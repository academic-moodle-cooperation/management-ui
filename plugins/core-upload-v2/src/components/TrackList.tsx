import { ArrowLeftRight, Monitor, Plus, User, X } from "lucide-react";
import { useRef } from "react";

import { useI18n } from "@oc-mui/i18n";
import { Button } from "@oc-mui/ui/components";

import { formatBytes } from "../lib/formatBytes";
import { otherFlavor } from "../model/types";

import type { Track, TrackFlavor, UploadItem } from "../model/types";
import type { ChangeEvent } from "react";

/**
 * The dual-stream editor for a single item.
 *
 * A recording is one item with one or two tracks; this is where the second one
 * is attached and where you say which is the speaker and which is the screen.
 * Once a track has been transferred its flavor is frozen — the flavor is sent
 * along with the bytes in `addTrack`, so changing it later would mean rebuilding
 * the media package. The UI simply stops offering the swap rather than failing
 * at submit time.
 */

const FLAVOR_ICON = {
  "presenter/source": User,
  "presentation/source": Monitor,
  "audio/source": User,
} as const;

const FLAVOR_KEY: Record<TrackFlavor, string> = {
  "presenter/source": "tracks.presenter",
  "presentation/source": "tracks.presentation",
  "audio/source": "tracks.audio",
};

const TrackRow = ({
  track,
  canEdit,
  canRemove,
  onSwap,
  onRemove,
}: {
  track: Track;
  canEdit: boolean;
  canRemove: boolean;
  onSwap: () => void;
  onRemove: () => void;
}) => {
  const { t } = useI18n("upload-v2");
  const Icon = FLAVOR_ICON[track.flavor];

  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{t(FLAVOR_KEY[track.flavor])}</p>
        <p className="text-muted-foreground truncate text-xs">
          {track.file.name} · {formatBytes(track.file.size)}
        </p>
      </div>
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={onSwap}
          aria-label={t("tracks.swap")}
          title={t("tracks.swap")}
        >
          <ArrowLeftRight className="size-3.5" />
        </Button>
      )}
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-7 shrink-0"
          onClick={onRemove}
          aria-label={t("tracks.remove")}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
};

export const TrackList = ({
  item,
  onAddTrack,
  onSwap,
  onRemove,
}: {
  item: UploadItem;
  onAddTrack: (file: File, flavor: TrackFlavor) => void;
  onSwap: (trackId: string, flavor: TrackFlavor) => void;
  onRemove: (trackId: string) => void;
}) => {
  const { t } = useI18n("upload-v2");
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd =
    item.tracks.length < 2 && ["queued", "preparing", "prepared"].includes(item.state);
  const first = item.tracks[0];
  // The second track takes whatever the first one isn't.
  const nextFlavor = first ? otherFlavor(first.flavor) : "presenter/source";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium">{t("tracks.label")}</span>
        {item.tracks.length === 2 && (
          <span className="text-muted-foreground text-xs">{t("tracks.dual")}</span>
        )}
      </div>

      {item.tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          canEdit={item.tracks.length === 2 && !track.uploaded}
          canRemove={item.tracks.length === 2 && !track.uploaded}
          onSwap={() => onSwap(track.id, otherFlavor(track.flavor))}
          onRemove={() => onRemove(track.id)}
        />
      ))}

      {canAdd && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => inputRef.current?.click()}
          >
            <Plus className="size-4" />
            {t(`tracks.add_${nextFlavor === "presenter/source" ? "presenter" : "presentation"}`)}
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              if (file) onAddTrack(file, nextFlavor);
              event.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
};
