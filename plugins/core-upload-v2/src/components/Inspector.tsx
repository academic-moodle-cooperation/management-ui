import { ImagePlus, Shield, X } from "lucide-react";
import { useRef, useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import { ComponentResolver } from "@oc-mui/plugin-system";
import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@oc-mui/ui/components";
import type { AclData } from "@oc-mui/ui/components";

import { MIXED, sharedValue } from "../model/types";

import { AclDialog, aclSummary } from "./AclDialog";
import { TrackList } from "./TrackList";
import { WorkflowOptions } from "./WorkflowOptions";

import type { UploadV2Config } from "../config";
import type { WorkflowDefinition } from "../ingest/workflows";
import type { ItemSettings, ProcessingMode, TrackFlavor, UploadItem } from "../model/types";
import type { ChangeEvent, ReactNode } from "react";

/**
 * Metadata and processing options for the current selection — issue #123.
 *
 * The design decision that matters: there is no per-item gear and no global
 * gear. The inspector edits *whatever is selected*, so editing one item and
 * editing all of them is the same gesture, and a field whose values disagree
 * across the selection renders as "mixed" instead of silently flattening.
 * That makes the overwrite warning the issue asked for unnecessary — the
 * conflict is visible before the edit rather than confessed after it.
 */

const MIXED_TOKEN = "__mixed__";
const INHERIT_TOKEN = "__inherit__";

/**
 * The default filling of the `upload:acl-editor` slot: a summary plus a button
 * that opens the shared editor in a dialog. Deliberately small — an
 * organisation that plugs in its own component replaces exactly this much.
 */
const DefaultAclControl = ({
  aclData,
  onAclDataChange,
  disabled,
  isMixed,
}: {
  aclData: AclData | undefined;
  onAclDataChange: (acl: AclData) => void;
  disabled?: boolean;
  isMixed?: boolean;
}) => {
  const { t } = useI18n("upload-v2");
  const [open, setOpen] = useState(false);
  const { count } = aclSummary(aclData);

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
        {isMixed
          ? t("field.mixed")
          : count > 0
            ? t("acl.summary", { count })
            : t("acl.inherited")}
      </span>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        <Shield className="size-4" />
        {t("acl.edit")}
      </Button>
      <AclDialog
        open={open}
        onOpenChange={setOpen}
        acl={aclData}
        disabled={Boolean(disabled)}
        onApply={onAclDataChange}
      />
    </div>
  );
};

/** Label / control pair. Dense, left-aligned labels — a tool, not a form page. */
const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium">{label}</Label>
    {children}
    {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
  </div>
);

/**
 * `<input type="datetime-local">` wants `YYYY-MM-DDTHH:mm` in *local* time,
 * while we store ISO/UTC. Converting through the epoch keeps the displayed
 * clock time equal to the one the recording device showed.
 */
const toLocalInput = (iso: string | undefined): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromLocalInput = (value: string): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

/** People fields are stored as lists but edited as one comma-separated line. */
const joinPeople = (people: string[] | undefined) => (people ?? []).join(", ");
const splitPeople = (value: string) =>
  value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

const languageName = (code: string, locale: string) => {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

export const Inspector = ({
  selection,
  config,
  onChange,
  onAddTrack,
  onSwapFlavor,
  onRemoveTrack,
  workflows,
}: {
  selection: readonly UploadItem[];
  config: UploadV2Config;
  /** Discovered from Opencast; empty when it could not be asked. */
  workflows: WorkflowDefinition[];
  onChange: (change: Partial<ItemSettings>) => void;
  onAddTrack: (itemId: string, file: File, flavor: TrackFlavor) => void;
  onSwapFlavor: (itemId: string, trackId: string, flavor: TrackFlavor) => void;
  onRemoveTrack: (itemId: string, trackId: string) => void;
}) => {
  const { t, i18n } = useI18n("upload-v2");
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (selection.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm">
        <p>{t("inspector.emptyTitle")}</p>
        <p className="text-xs">{t("inspector.emptyHint")}</p>
      </div>
    );
  }

  const single = selection.length === 1 ? selection[0] : undefined;

  const recordedAt = sharedValue(selection, "recordedAt");
  const presenters = sharedValue(selection, "presenters");
  const language = sharedValue(selection, "language");
  const transcribe = sharedValue(selection, "transcribe");
  const translate = sharedValue(selection, "translate");
  const processing = sharedValue(selection, "processing");
  const previewImage = sharedValue(selection, "previewImage");
  const description = sharedValue(selection, "description");
  const subject = sharedValue(selection, "subject");
  const license = sharedValue(selection, "license");
  const rightsHolder = sharedValue(selection, "rightsHolder");
  const contributors = sharedValue(selection, "contributors");
  const acl = sharedValue(selection, "acl");
  const workflowId = sharedValue(selection, "workflowId");
  const workflowConfig = sharedValue(selection, "workflowConfig");

  // Per the issue: translating into the same language is meaningless, so the
  // option switches off when the spoken language already is English.
  const translateDisabled = language !== MIXED && language?.startsWith("en") === true;

  const stt = config.stt;
  const showTranscribe = Boolean(stt?.transcribeKey);
  const showTranslate = Boolean(stt?.translateKey);
  const showPrepare = config.workflows.prepare !== "";

  const languageValue =
    language === MIXED ? MIXED_TOKEN : language === undefined ? INHERIT_TOKEN : language;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-medium">
          {single ? single.settings.title : t("inspector.multi", { count: selection.length })}
        </p>
        <p className="text-muted-foreground text-xs">
          {single ? t("inspector.singleHint") : t("inspector.multiHint")}
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Field label={t("field.title")}>
          {single ? (
            <Input
              // Keyed by item: without it React reuses the same DOM node when
              // the selection changes and the previous title lingers in it.
              key={single.id}
              value={single.settings.title}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ title: event.target.value })
              }
            />
          ) : (
            <Input key="multi" readOnly disabled value="" placeholder={t("field.titleMulti")} />
          )}
        </Field>

        {/* Tracks are a property of one recording, so this only appears for a
            single selection — pairing twenty files at once is a different
            feature and deliberately not this one. */}
        {single && (
          <TrackList
            item={single}
            onAddTrack={(file, flavor) => onAddTrack(single.id, file, flavor)}
            onSwap={(trackId, flavor) => onSwapFlavor(single.id, trackId, flavor)}
            onRemove={(trackId) => onRemoveTrack(single.id, trackId)}
          />
        )}

        <Field label={t("field.recordedAt")} hint={t("field.recordedAtHint")}>
          <Input
            type="datetime-local"
            value={recordedAt === MIXED ? "" : toLocalInput(recordedAt)}
            placeholder={recordedAt === MIXED ? t("field.mixed") : undefined}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({ recordedAt: fromLocalInput(event.target.value) })
            }
          />
          {recordedAt === MIXED && (
            <p className="text-muted-foreground text-xs">{t("field.mixed")}</p>
          )}
        </Field>

        <Field label={t("field.presenters")} hint={t("field.presentersHint")}>
          <Input
            value={presenters === MIXED ? "" : joinPeople(presenters)}
            placeholder={presenters === MIXED ? t("field.mixed") : t("field.presentersEmpty")}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({ presenters: splitPeople(event.target.value) })
            }
          />
        </Field>

        <Field label={t("field.language")} hint={t("field.languageHint")}>
          <Select
            value={languageValue}
            onValueChange={(value) =>
              onChange({
                ...(value === INHERIT_TOKEN ? { language: undefined } : { language: value }),
                // Keeping an impossible combination out of the payload is
                // cheaper than explaining it later.
                ...(value.startsWith("en") ? { translate: false } : {}),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {language === MIXED && (
                <SelectItem value={MIXED_TOKEN}>{t("field.mixed")}</SelectItem>
              )}
              <SelectItem value={INHERIT_TOKEN}>{t("field.languageInherit")}</SelectItem>
              {config.languages.map((code) => (
                <SelectItem key={code} value={code}>
                  {languageName(code, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* When Opencast told us which workflows it offers, the user picks
            one and its own declared options are rendered. Everything below is
            the fallback for installations whose External API we could not
            reach: a fixed publish/prepare pair plus the STT keys from config. */}
        {workflows.length > 0 ? (
          <WorkflowOptions
            workflows={workflows}
            workflowId={workflowId}
            workflowConfig={workflowConfig}
            onChange={onChange}
          />
        ) : (
          <>
        {(showTranscribe || showTranslate) && (
          <div className="space-y-3">
            <Label className="text-xs font-medium">{t("field.stt")}</Label>
            {showTranscribe && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={transcribe === MIXED ? "indeterminate" : Boolean(transcribe)}
                  onCheckedChange={(checked) => onChange({ transcribe: checked === true })}
                />
                {t("field.transcribe")}
              </label>
            )}
            {showTranslate && (
              <label
                className={`flex items-center gap-2 text-sm ${translateDisabled ? "text-muted-foreground" : ""}`}
              >
                <Checkbox
                  disabled={translateDisabled}
                  checked={translate === MIXED ? "indeterminate" : Boolean(translate)}
                  onCheckedChange={(checked) => onChange({ translate: checked === true })}
                />
                {t("field.translate")}
                {translateDisabled && (
                  <span className="text-xs">{t("field.translateDisabled")}</span>
                )}
              </label>
            )}
          </div>
        )}

        {showPrepare && (
          <Field label={t("field.processing")}>
            <div className="grid gap-2">
              {(["publish", "prepare"] as ProcessingMode[]).map((mode) => (
                <label
                  key={mode}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm transition-colors ${
                    processing === mode ? "border-primary bg-accent" : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    className="mt-1 accent-[var(--primary)]"
                    checked={processing === mode}
                    onChange={() => onChange({ processing: mode })}
                  />
                  <span>
                    <span className="block font-medium">{t(`field.processing_${mode}`)}</span>
                    <span className="text-muted-foreground block text-xs">
                      {t(`field.processing_${mode}_hint`)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {processing === MIXED && (
              <p className="text-muted-foreground text-xs">{t("field.mixed")}</p>
            )}
          </Field>
        )}
          </>
        )}

        {/* Institution-specific Dublin Core, off unless switched on in config.
            Rendered from one list so adding a field is a config edit plus a
            translation key, not another branch here. */}
        {config.visibleFields.includes("description") && (
          <Field label={t("field.description")}>
            <Textarea
              rows={3}
              value={description === MIXED ? "" : (description ?? "")}
              placeholder={description === MIXED ? t("field.mixed") : undefined}
              onChange={(event) => onChange({ description: event.target.value })}
            />
          </Field>
        )}

        {config.visibleFields.includes("subject") && (
          <Field label={t("field.subject")}>
            <Input
              value={subject === MIXED ? "" : (subject ?? "")}
              placeholder={subject === MIXED ? t("field.mixed") : undefined}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ subject: event.target.value })
              }
            />
          </Field>
        )}

        {config.visibleFields.includes("license") && (
          // Free text, not a picker: the allowed licence values live in the
          // episode catalog definition, which we cannot fetch before the event
          // exists. Swap to a select once the backend serves it.
          <Field label={t("field.license")} hint={t("field.licenseHint")}>
            <Input
              value={license === MIXED ? "" : (license ?? "")}
              placeholder={license === MIXED ? t("field.mixed") : undefined}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ license: event.target.value })
              }
            />
          </Field>
        )}

        {config.visibleFields.includes("rightsHolder") && (
          <Field label={t("field.rightsHolder")}>
            <Input
              value={rightsHolder === MIXED ? "" : (rightsHolder ?? "")}
              placeholder={rightsHolder === MIXED ? t("field.mixed") : undefined}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ rightsHolder: event.target.value })
              }
            />
          </Field>
        )}

        {config.visibleFields.includes("contributors") && (
          <Field label={t("field.contributors")} hint={t("field.presentersHint")}>
            <Input
              value={contributors === MIXED ? "" : joinPeople(contributors)}
              placeholder={contributors === MIXED ? t("field.mixed") : undefined}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ contributors: splitPeople(event.target.value) })
              }
            />
          </Field>
        )}

        {/* Access rights go through the same `upload:acl-editor` extension
            point v1 used, with the same prop names, so an organisation's
            existing ACL plugin keeps working in v2 unchanged. What changed is
            the default: v1 resolved to `null`, meaning the OSS build could not
            set permissions at all. */}
        <Field label={t("acl.label")} hint={t("acl.hint")}>
          <ComponentResolver
            componentType="upload:acl-editor"
            defaultComponent={DefaultAclControl}
            useOverridePrefix={false}
            loadingBehavior="none"
            componentProps={{
              aclData: acl === MIXED ? undefined : acl,
              onAclDataChange: (next: AclData) => onChange({ acl: next }),
              selectedSeries: null,
              disabled: false,
              refetch: () => {},
              isMixed: acl === MIXED,
            }}
          />
        </Field>

        <Field label={t("field.preview")} hint={t("field.previewHint")}>
          {previewImage && previewImage !== MIXED ? (
            <div className="flex items-center gap-2">
              <span className="bg-muted truncate rounded px-2 py-1 text-xs">
                {previewImage.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t("field.previewClear")}
                onClick={() => onChange({ previewImage: undefined })}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
              <ImagePlus className="size-4" />
              {previewImage === MIXED ? t("field.mixed") : t("field.previewPick")}
            </Button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onChange({ previewImage: file });
              event.target.value = "";
            }}
          />
        </Field>
      </div>
    </div>
  );
};
