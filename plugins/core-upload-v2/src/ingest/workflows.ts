import { logger } from "@oc-mui/utils";

/**
 * Workflow discovery.
 *
 * Opencast already knows which workflows exist, which of them are meant for
 * uploads, and what options each one takes — so we ask it instead of writing
 * the answers into `config.json`.
 *
 * `GET /api/workflow-definitions?filter=tag:upload&withconfigurationpaneljson=true`
 * returns every definition tagged `upload`, each with its title, description,
 * display order and a structured declaration of its own configuration. The
 * `name` of a declared field *is* the workflow property key: whatever we send
 * as an extra form field to `/ingest/ingest` reaches the workflow under that
 * name (Opencast's `getWorkflowConfig` copies every field except
 * `mediaPackage`). That is what makes "generate subtitles" work without anyone
 * telling us the key by hand.
 *
 * The endpoint and the `withconfigurationpaneljson` parameter exist in both
 * Opencast 19 and 20, so nothing here is version-gated.
 */

/** One control a workflow declares. Mirrors the fieldset entries verbatim. */
export type WorkflowField = {
  name: string;
  type: string;
  label?: string;
  value?: string;
  min?: string;
  max?: string;
};

export type WorkflowOptionGroup = {
  description?: string;
  fieldset?: WorkflowField[];
};

export type WorkflowDefinition = {
  id: string;
  title: string;
  description?: string;
  displayOrder?: number;
  tags?: string[];
  /** Flattened from the declared panel; empty when the workflow declares none. */
  fields: WorkflowField[];
};

type ApiWorkflowDefinition = {
  identifier?: string;
  id?: string;
  title?: string;
  description?: string;
  displayOrder?: number;
  tags?: string[];
  configuration_panel_json?: unknown;
};

/**
 * The panel arrives as JSON, but Opencast has shipped it as a *string* holding
 * JSON in some versions and as a parsed array in others. Accept both rather
 * than trusting one.
 */
const parsePanel = (raw: unknown): WorkflowField[] => {
  let panel: unknown = raw;
  if (typeof raw === "string") {
    if (raw.trim() === "") return [];
    try {
      panel = JSON.parse(raw);
    } catch {
      // A workflow with an unparseable panel must not take the whole list down;
      // it simply contributes no options.
      return [];
    }
  }
  if (!Array.isArray(panel)) return [];

  return (panel as WorkflowOptionGroup[]).flatMap((group) =>
    Array.isArray(group?.fieldset)
      ? group.fieldset.filter((field): field is WorkflowField => Boolean(field?.name))
      : [],
  );
};

export const parseWorkflowDefinitions = (payload: unknown): WorkflowDefinition[] => {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((raw: ApiWorkflowDefinition) => {
      const id = raw.identifier ?? raw.id;
      if (!id) return undefined;
      return {
        id,
        title: raw.title?.trim() || id,
        ...(raw.description ? { description: raw.description } : {}),
        ...(raw.displayOrder !== undefined ? { displayOrder: raw.displayOrder } : {}),
        ...(raw.tags ? { tags: raw.tags } : {}),
        fields: parsePanel(raw.configuration_panel_json),
      } satisfies WorkflowDefinition;
    })
    .filter((definition): definition is WorkflowDefinition => definition !== undefined)
    .sort(
      (a, b) =>
        (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER) ||
        a.title.localeCompare(b.title),
    );
};

/**
 * Fetches the workflows an installation offers for uploads.
 *
 * Returns an empty list on any failure — an installation whose External API is
 * closed off should fall back to the configured workflow IDs, not see an error
 * page where its upload form used to be.
 */
export const fetchUploadWorkflows = async (tag = "upload"): Promise<WorkflowDefinition[]> => {
  try {
    const response = await fetch(
      `/api/workflow-definitions?filter=tag:${encodeURIComponent(tag)}&withconfigurationpaneljson=true`,
      { headers: { accept: "application/json" } },
    );
    if (!response.ok) {
      logger.warn("[upload-v2] workflow discovery unavailable", { status: response.status });
      return [];
    }
    return parseWorkflowDefinitions(await response.json());
  } catch (error) {
    logger.warn("[upload-v2] workflow discovery failed", { error });
    return [];
  }
};
