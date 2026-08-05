import { Trash2 } from "lucide-react";

import { useI18n } from "@oc-mui/i18n";
import { Button, Checkbox } from "@oc-mui/ui/components";

import { formatBytes } from "../lib/formatBytes";
import { itemPercent, itemProgress } from "../model/types";

import type { ItemState, UploadItem } from "../model/types";
import type { MouseEvent } from "react";

/**
 * One row of the queue.
 *
 * Two ideas carry the visual language here, and both replace a widget that
 * would otherwise sit *next to* the content:
 *
 * - **Progress fills the row.** Instead of a separate bar the row's own
 *   background fills left to right. At a glance the queue reads like a set of
 *   loading vessels, and no vertical space is spent on chrome.
 * - **A status rail on the left edge.** A hairline in the state's semantic
 *   colour, so scanning twenty rows for the one that failed is a colour scan,
 *   not a text scan.
 *
 * Rows are hairline-separated inside one panel rather than being individual
 * cards — a work surface, not a feed.
 */

const RAIL: Record<ItemState, string> = {
  queued: "bg-muted-foreground/30",
  preparing: "bg-info",
  paused: "bg-warning",
  prepared: "bg-ok",
  submitting: "bg-info",
  done: "bg-ok",
  failed: "bg-error",
  discarded: "bg-muted-foreground/30",
};

export const STATE_KEYS: Record<ItemState, string> = {
  queued: "state.queued",
  preparing: "state.preparing",
  paused: "state.paused",
  prepared: "state.prepared",
  submitting: "state.submitting",
  done: "state.done",
  failed: "state.failed",
  discarded: "state.discarded",
};

export const QueueRow = ({
  item,
  selected,
  onSelect,
  onDiscard,
}: {
  item: UploadItem;
  selected: boolean;
  /** `additive` is true for ctrl/meta/shift-click — extend instead of replace. */
  onSelect: (additive: boolean) => void;
  onDiscard: () => void;
}) => {
  const { t } = useI18n("upload-v2");
  const { sent, total } = itemProgress(item);
  const percent = itemPercent(item);
  const moving = item.state === "preparing" || item.state === "submitting";
  const showFill = moving || item.state === "paused";

  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onClick={(event: MouseEvent) => onSelect(event.metaKey || event.ctrlKey || event.shiftKey)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(false);
        }
      }}
      className={`group relative flex cursor-pointer items-center gap-3 py-2.5 pr-3 pl-4 text-sm outline-none transition-colors ${
        selected ? "bg-accent" : "hover:bg-muted/50"
      } focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset`}
    >
      {/* Status rail */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-[3px] ${RAIL[item.state]}`}
      />

      {/* Progress fill — behind the content, never intercepting clicks. */}
      {showFill && (
        <span
          aria-hidden
          className="bg-primary/10 pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      )}

      <Checkbox
        checked={selected}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={() => onSelect(true)}
        aria-label={t("queue.selectRow", { title: item.settings.title })}
        className="relative shrink-0"
      />

      <div className="relative min-w-0 flex-1">
        <p className="truncate font-medium">{item.settings.title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {item.tracks.length > 1
            ? t("row.tracks", { count: item.tracks.length })
            : item.tracks[0]?.file.name}
        </p>
      </div>

      <div className="relative w-28 shrink-0 text-right">
        <p
          className={`text-xs font-medium ${item.state === "failed" ? "text-error" : "text-muted-foreground"}`}
        >
          {t(STATE_KEYS[item.state])}
        </p>
        <p className="text-muted-foreground text-xs tabular-nums">
          {moving ? `${formatBytes(sent)} / ${formatBytes(total)}` : formatBytes(total)}
        </p>
      </div>

      {item.state !== "done" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            onDiscard();
          }}
          aria-label={t("action.discard")}
          className="text-muted-foreground hover:text-destructive relative size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
};
