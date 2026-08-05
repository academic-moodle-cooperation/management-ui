import { Check, Monitor, User } from "lucide-react";
import { useRef, useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import { Button } from "@oc-mui/ui/components";

import { formatBytes } from "../lib/formatBytes";

import type { DragEvent } from "react";

/**
 * The second dual-stream entry path: two labelled slots, one per flavor.
 *
 * Filling both creates one item and clears the slots, so several pairs can be
 * added one after another without the UI ever having to guess which file
 * belongs to which. That guessing — pairing twenty files by filename — is
 * knowingly out of scope; this covers the case where someone has a camera file
 * and a screen file in front of them and wants them joined.
 */

const Slot = ({
  kind,
  file,
  accept,
  onPick,
  onClear,
}: {
  kind: "presenter" | "presentation";
  file: File | null;
  accept: string;
  onPick: (file: File) => void;
  onClear: () => void;
}) => {
  const { t } = useI18n("upload-v2");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = kind === "presenter" ? User : Monitor;

  return (
    <div
      onDragOver={(event: DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event: DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        const dropped = event.dataTransfer.files[0];
        if (dropped) onPick(dropped);
      }}
      className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? "border-primary bg-accent"
          : file
            ? "border-ok/60 bg-ok/5"
            : "border-border hover:border-primary/40"
      }`}
    >
      <div
        className={`flex size-10 items-center justify-center rounded-full ${
          file ? "bg-ok/15 text-ok" : "bg-muted text-muted-foreground"
        }`}
      >
        {file ? <Check className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
      </div>

      <p className="text-sm font-medium">{t(`tracks.${kind}`)}</p>

      {file ? (
        <>
          <p className="text-muted-foreground max-w-full truncate text-xs">
            {file.name} · {formatBytes(file.size)}
          </p>
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t("dual.clear")}
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">{t(`dual.hint_${kind}`)}</p>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            {t("dual.choose")}
          </Button>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked) onPick(picked);
          event.target.value = "";
        }}
      />
    </div>
  );
};

export const DualDropzones = ({
  accept,
  onPair,
}: {
  accept: string;
  /** Called once both slots are filled; the slots reset afterwards. */
  onPair: (presenter: File, presentation: File) => void;
}) => {
  const { t } = useI18n("upload-v2");
  const [presenter, setPresenter] = useState<File | null>(null);
  const [presentation, setPresentation] = useState<File | null>(null);

  // Completing the pair is the commit point — no extra confirm button, because
  // there is nothing left to decide once both slots hold a file.
  const commit = (next: { presenter: File | null; presentation: File | null }) => {
    if (next.presenter && next.presentation) {
      onPair(next.presenter, next.presentation);
      setPresenter(null);
      setPresentation(null);
    } else {
      setPresenter(next.presenter);
      setPresentation(next.presentation);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Slot
          kind="presenter"
          file={presenter}
          accept={accept}
          onPick={(file) => commit({ presenter: file, presentation })}
          onClear={() => setPresenter(null)}
        />
        <Slot
          kind="presentation"
          file={presentation}
          accept={accept}
          onPick={(file) => commit({ presenter, presentation: file })}
          onClear={() => setPresentation(null)}
        />
      </div>
      <p className="text-muted-foreground text-center text-xs">{t("dual.explain")}</p>
    </div>
  );
};
