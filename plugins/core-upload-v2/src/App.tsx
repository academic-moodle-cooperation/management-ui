import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import { useGetUserInfo, useQuery } from "@oc-mui/query";
import {
  Button,
  Checkbox,
  Sheet,
  SheetContent,
  Toaster,
  toast,
  useIsMobile,
} from "@oc-mui/ui/components";

import { DualDropzones } from "./components/DualDropzones";
import { Inspector } from "./components/Inspector";
import { QueueRow } from "./components/QueueRow";
import { SeriesPicker } from "./components/SeriesPicker";
import { uploadV2Config } from "./config";
import { fetchUploadWorkflows } from "./ingest/workflows";
import { installUnloadGuard } from "./model/orphans";
import { uploadQueue } from "./model/queue";
import { useUploadQueue } from "./model/useUploadQueue";

import type { SelectedSeries } from "./components/SeriesPicker";
import type { ItemSettings } from "./model/types";
import type { DragEvent } from "react";

/**
 * Upload v2.
 *
 * A two-pane work surface rather than a feed of cards: the queue on the left,
 * an inspector on the right that edits whatever is selected. That shape is
 * what makes bulk metadata editing (issue #123) a normal gesture instead of a
 * "global gear" bolted onto a list — select many, edit once, see "mixed"
 * wherever the selection disagrees.
 *
 * Everything is styled through semantic theme tokens and `@oc-mui/ui` only, so
 * an org theme plugin restyles this screen without touching it.
 */
export const App = () => {
  const { t } = useI18n("upload-v2");
  const config = uploadV2Config.use();
  const { data: user } = useGetUserInfo();
  const { items } = useUploadQueue();

  const [series, setSeries] = useState<SelectedSeries | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dualMode, setDualMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Which workflows this installation offers for uploads, straight from
  // Opencast. Failure yields an empty list, and the inspector falls back to the
  // configured publish/prepare pair — never an error where the form should be.
  const { data: workflows = [] } = useQuery({
    queryKey: ["upload-v2", "workflows"],
    queryFn: () => fetchUploadWorkflows(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => installUnloadGuard(), []);

  // Selection is derived, never stored twice: an item that got discarded must
  // not linger as a phantom in the inspector.
  const selection = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const accept = config.whitelist.map((extension) => `.${extension}`).join(",");

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const all = Array.from(files);
      const allowed = all.filter((file) =>
        config.whitelist.includes(file.name.split(".").pop()?.toLowerCase() ?? ""),
      );
      const rejected = all.length - allowed.length;
      if (rejected > 0) toast.warning(t("toast.rejected", { count: rejected }));
      if (allowed.length === 0) return;

      const created = uploadQueue.addFiles(allowed);
      // Land straight in the inspector — the next thing anyone wants after
      // dropping files is to describe them.
      setSelectedIds(created);
      setSheetOpen(true);
    },
    [config.whitelist, t],
  );

  const select = (id: string, additive: boolean) =>
    setSelectedIds((current) => {
      if (!additive) return [id];
      return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    });

  const editable = items.filter(
    (item) => item.state !== "done" && item.state !== "discarded" && item.state !== "failed",
  );
  const allSelected = editable.length > 0 && editable.every((i) => selectedIds.includes(i.id));

  const onChange = (change: Partial<ItemSettings>) => uploadQueue.updateMany(selectedIds, change);

  const readyCount = items.filter((item) => item.state === "prepared").length;
  const activeCount = items.filter(
    (item) => item.state === "queued" || item.state === "preparing",
  ).length;
  const submitting = items.some((item) => item.state === "submitting");

  const onPublish = () =>
    void uploadQueue.submitAll({
      presenter: user?.user?.name ?? "",
      username: user?.user?.username ?? "",
      location: config.location,
      ...(series ? { seriesId: series.id } : {}),
      workflowIds: { publish: config.workflows.publish, prepare: config.workflows.prepare },
      ...(config.stt ? { sttKeys: config.stt } : {}),
    });

  const dropHandlers = {
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      addFiles(event.dataTransfer.files);
    },
  };

  const inspector = (
    <Inspector
      selection={selection}
      config={config}
      workflows={workflows}
      onChange={onChange}
      onAddTrack={(itemId, file, flavor) => uploadQueue.addTrackToItem(itemId, file, flavor)}
      onSwapFlavor={(itemId, trackId, flavor) =>
        uploadQueue.setTrackFlavor(itemId, trackId, flavor)
      }
      onRemoveTrack={(itemId, trackId) => uploadQueue.removeTrack(itemId, trackId)}
    />
  );

  const onPair = (presenter: File, presentation: File) => {
    const id = uploadQueue.addPair(presenter, presentation);
    setSelectedIds([id]);
    setSheetOpen(true);
  };

  return (
    <div className="flex h-full flex-col" {...dropHandlers}>
      {/* Toolbar — title, series and the primary action on one line. The
          shell already frames the page, so a separate heading block plus a
          separator would only push the actual work further down. */}
      <header className="flex flex-wrap items-center gap-3 border-b px-6 py-4">
        <h1 className="font-heading mr-auto text-xl font-semibold">{t("title")}</h1>
        <div className="w-64">
          <SeriesPicker selected={series} onSelect={setSeries} />
        </div>
        <Button
          size="lg"
          disabled={readyCount === 0 || series === null || submitting}
          onClick={onPublish}
          title={series === null ? t("footer.selectSeries") : undefined}
        >
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {readyCount > 1 ? t("action.publishMany", { count: readyCount }) : t("action.publish")}
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col gap-4 p-6">
          {/* The mode switch lives with the drop target it changes. Single is
              the default because it also covers the dual case via the
              inspector; the two-slot mode is the convenience for people who
              know upfront that they are pairing. */}
          <div className="flex justify-center">
            <div className="bg-muted inline-flex rounded-lg p-1 text-sm">
              {([false, true] as const).map((dual) => (
                <button
                  key={String(dual)}
                  type="button"
                  onClick={() => setDualMode(dual)}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    dualMode === dual
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(dual ? "dual.modeDual" : "dual.modeSingle")}
                </button>
              ))}
            </div>
          </div>

          {dualMode ? (
            <DualDropzones accept={accept} onPair={onPair} />
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-center transition-colors ${
                isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-heading text-lg font-medium">{t("dropzone.headline")}</p>
              <p className="text-muted-foreground max-w-sm text-sm">{t("dropzone.hint")}</p>
            </button>
          )}
        </div>
      ) : (
        // Direction comes from `useIsMobile` rather than a `md:flex-row`
        // utility, so that it and the panel-versus-sheet decision below can
        // never disagree about which layout is showing — one boolean drives
        // both. (Responsive utilities do work; they were broken by a
        // stylesheet-ordering bug that is fixed in `apps/shell/src/app.css`.)
        <div className={`flex min-h-0 flex-1 ${isMobile ? "flex-col" : "flex-row"}`}>
          {/* Queue */}
          <section className="flex min-h-0 flex-1 flex-col" aria-label={t("queue.label")}>
            <div className="text-muted-foreground flex items-center gap-3 border-b px-4 py-2 text-xs">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) =>
                  setSelectedIds(checked === true ? editable.map((i) => i.id) : [])
                }
                aria-label={t("queue.selectAll")}
              />
              <span className="mr-auto">
                {activeCount > 0
                  ? t("queue.summaryActive", { active: activeCount, total: items.length })
                  : t("queue.summary", { count: items.length })}
              </span>
              {selectedIds.length > 0 && (
                <span>{t("queue.selectedCount", { count: selectedIds.length })}</span>
              )}
            </div>

            <div role="listbox" aria-multiselectable className="min-h-0 flex-1 divide-y overflow-y-auto">
              {items.map((item) => (
                <QueueRow
                  key={item.id}
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  onSelect={(additive) => {
                    select(item.id, additive);
                    setSheetOpen(true);
                  }}
                  onDiscard={() => void uploadQueue.discard(item.id)}
                />
              ))}
            </div>

            {dualMode ? (
              <div className="space-y-2 border-t p-4">
                <DualDropzones accept={accept} onPair={onPair} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setDualMode(false)}
                >
                  {t("dual.backToSingle")}
                </Button>
              </div>
            ) : (
              <div
                className={`flex items-center justify-between gap-3 border-t px-4 py-2.5 text-sm transition-colors ${
                  isDragging ? "bg-accent" : ""
                }`}
              >
                <span className="text-muted-foreground text-xs">{t("dropzone.compactHint")}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setDualMode(true)}>
                    {t("dual.modeDual")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="size-4" />
                    {t("dropzone.addMore")}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Inspector — a docked side panel on wide screens, a sheet on
              narrow ones. The sheet is *not rendered at all* above the
              breakpoint: hiding a modal with `lg:hidden` leaves its overlay
              behind, which silently swallows every click on the page. The
              breakpoint deliberately matches `useIsMobile` (768px) so CSS and
              JS can never disagree about which one is showing. */}
          {!isMobile && (
            <aside
              className="w-72 shrink-0 border-l lg:w-80 xl:w-96"
              aria-label={t("inspector.label")}
            >
              {inspector}
            </aside>
          )}
          {isMobile && (
            <Sheet open={sheetOpen && selection.length > 0} onOpenChange={setSheetOpen}>
              <SheetContent side="bottom" className="h-[70vh] p-0">
                {inspector}
              </SheetContent>
            </Sheet>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <Toaster />
    </div>
  );
};

export default App;
