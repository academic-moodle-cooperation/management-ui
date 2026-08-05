import { useI18n } from "@oc-mui/i18n";
import {
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@oc-mui/ui/components";

import { MIXED } from "../model/types";

import type { WorkflowDefinition, WorkflowField } from "../ingest/workflows";
import type { ItemSettings } from "../model/types";
import type { ChangeEvent } from "react";

/**
 * Workflow choice and the options that workflow declares.
 *
 * Nothing here is hardcoded: the list comes from Opencast (`tag:upload`) and
 * each control is built from the workflow's own `configuration_panel_json`.
 * The field's declared `name` is the key posted to `/ingest/ingest`, so a
 * workflow that adds an option gets a working control without anyone touching
 * this plugin or its config.
 */

/** Checkboxes travel as the strings Opencast's workflow conditions compare. */
const asBool = (value: string | undefined) => value === "true";

const FieldControl = ({
  field,
  value,
  onChange,
}: {
  field: WorkflowField;
  value: string | undefined;
  onChange: (value: string) => void;
}) => {
  const label = field.label?.trim() || field.name;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={asBool(value)}
          onCheckedChange={(checked) => onChange(checked === true ? "true" : "false")}
        />
        {label}
      </label>
    );
  }

  if (field.type === "select" || field.type === "radio") {
    // Opencast declares the choices inline on some field types; when it does
    // not, a plain text control is more honest than an empty dropdown.
    const options = (field as WorkflowField & { options?: string[] }).options;
    if (!options?.length) return null;
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{label}</Label>
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type={field.type === "number" ? "number" : "text"}
        value={value ?? ""}
        {...(field.min !== undefined ? { min: field.min } : {})}
        {...(field.max !== undefined ? { max: field.max } : {})}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
    </div>
  );
};

export const WorkflowOptions = ({
  workflows,
  workflowId,
  workflowConfig,
  onChange,
}: {
  workflows: WorkflowDefinition[];
  workflowId: string | typeof MIXED | undefined;
  workflowConfig: Record<string, string> | typeof MIXED | undefined;
  onChange: (change: Partial<ItemSettings>) => void;
}) => {
  const { t } = useI18n("upload-v2");

  const selectedId = workflowId === MIXED ? undefined : workflowId;
  const selected = workflows.find((workflow) => workflow.id === selectedId);
  const values = workflowConfig === MIXED ? {} : (workflowConfig ?? {});

  /** Seeds the declared defaults so the workflow starts as its author intended. */
  const pick = (id: string) => {
    const workflow = workflows.find((candidate) => candidate.id === id);
    const defaults = Object.fromEntries(
      (workflow?.fields ?? [])
        .filter((field) => field.value !== undefined)
        .map((field) => [field.name, String(field.value).trim()]),
    );
    onChange({ workflowId: id, workflowConfig: defaults });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("workflow.label")}</Label>
        <Select value={workflowId === MIXED ? "" : (selectedId ?? "")} onValueChange={pick}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={workflowId === MIXED ? t("field.mixed") : t("workflow.pick")} />
          </SelectTrigger>
          <SelectContent>
            {workflows.map((workflow) => (
              <SelectItem key={workflow.id} value={workflow.id}>
                {workflow.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected?.description && (
          <p className="text-muted-foreground text-xs">{selected.description}</p>
        )}
      </div>

      {selected && selected.fields.length > 0 && (
        <div className="space-y-3 border-l-2 pl-3">
          {selected.fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(value) =>
                onChange({ workflowConfig: { ...values, [field.name]: value } })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
