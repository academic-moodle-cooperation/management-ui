import { logger } from "@oc-mui/utils";

/**
 * Thin wrapper around Opencast's `/ingest/*` endpoints.
 *
 * The endpoint surface is identical in Opencast 19 and 20 — `IngestRestService`
 * is byte-for-byte the same file on both release branches — so nothing here is
 * version-gated.
 *
 * Order matters only in one respect: the track may be attached at any time, but
 * `ingest()` must come last because it starts the workflow. Metadata, ACL and
 * attachments are all applied to the media package before that call, which is
 * what allows the file to transfer while the user is still typing.
 */

export class IngestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "IngestError";
  }
}

const post = async (path: string, body?: FormData, signal?: AbortSignal): Promise<string> => {
  // Built up field by field: with `exactOptionalPropertyTypes`, handing `fetch`
  // an explicit `body: undefined` is a type error, not a no-op.
  const init: RequestInit = {
    method: "POST",
    redirect: "manual",
    headers: { pragma: "no-cache", "cache-control": "no-cache" },
  };
  if (body !== undefined) init.body = body;
  if (signal !== undefined) init.signal = signal;

  const response = await fetch(path, init);

  if (!response.ok) {
    throw new IngestError(`${path} responded ${response.status}`, response.status);
  }
  return response.text();
};

/** Creates an empty media package and returns its XML. */
export const createMediaPackage = (signal?: AbortSignal): Promise<string> =>
  post("/ingest/createMediaPackage", undefined, signal);

/**
 * Reads the `id` attribute off the media package root element.
 *
 * Kept separate from `createMediaPackage` because the ID is what identifies a
 * media package across a reload, and it is short enough to log.
 *
 * A regex rather than `DOMParser` on purpose: this module is also exercised
 * from plain Node tests and could be reached from a worker, neither of which
 * has a DOM. We only ever need the root element's `id`, so the trade is cheap.
 */
export const mediaPackageId = (xml: string): string | undefined =>
  /<mediapackage[^>]*\sid="([^"]+)"/.exec(xml)?.[1];

export type EpisodeMetadata = {
  title: string;
  /** `dcterms:creator`, one element per presenter. */
  presenters: string[];
  seriesId?: string;
  location: string;
  /** ISO code; omitted from the catalog when undefined. */
  language?: string;
  /** Username recorded as `dcterms:source`. */
  source: string;
  /**
   * When the recording was made. Falls back to now only when nothing better is
   * known — writing the upload time into `dcterms:created` silently misdates
   * every episode that wasn't recorded today.
   */
  recordedAt?: string;
  description?: string;
  subject?: string;
  license?: string;
  rightsHolder?: string;
  contributors?: string[];
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const buildDublinCore = (meta: EpisodeMetadata): string => {
  const line = (tag: string, value?: string) =>
    value ? `\n      <dcterms:${tag}>${escapeXml(value)}</dcterms:${tag}>` : "";

  /** Repeating terms (creator, contributor) get one element each. */
  const lines = (tag: string, values?: string[]) =>
    (values ?? [])
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => line(tag, value))
      .join("");

  const created = meta.recordedAt ?? new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<dublincore xmlns="http://www.opencastproject.org/xsd/1.0/dublincore/"
            xmlns:dcterms="http://purl.org/dc/terms/"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <dcterms:created xsi:type="dcterms:W3CDTF">${escapeXml(created)}</dcterms:created>${line(
        "title",
        meta.title,
      )}${lines("creator", meta.presenters)}${lines("contributor", meta.contributors)}${line(
        "isPartOf",
        meta.seriesId,
      )}${line("language", meta.language)}${line("description", meta.description)}${line(
        "subject",
        meta.subject,
      )}${line("license", meta.license)}${line("rightsHolder", meta.rightsHolder)}${line(
        "source",
        meta.source,
      )}${line("spatial", meta.location)}
</dublincore>
`;
};

/** Attaches the episode Dublin Core catalog; returns the updated media package. */
export const addDublinCore = async (
  mediaPackage: string,
  meta: EpisodeMetadata,
  signal?: AbortSignal,
): Promise<string> => {
  const body = new FormData();
  body.append("mediaPackage", mediaPackage);
  body.append("dublinCore", encodeURIComponent(buildDublinCore(meta)));
  body.append("flavor", "dublincore/episode");
  return post("/ingest/addDCCatalog", body, signal);
};

export type AccessRule = { role: string; action: string[] };

/**
 * Builds the XACML episode policy Opencast expects.
 *
 * One `Rule` per role-and-action pair, each permitting that action when the
 * requester holds the role. Returns `undefined` for an empty rule set: an
 * empty policy is not "no restriction", it is "nobody may do anything", and
 * attaching one would lock the episode away from its own uploader. Not
 * attaching a policy at all lets Opencast fall back to the series or workflow
 * default, which is what "I didn't set permissions" should mean.
 */
export const buildAccessPolicy = (rules: AccessRule[]): string | undefined => {
  const pairs = rules.flatMap((rule) =>
    (rule.action ?? [])
      .filter(Boolean)
      .map((action) => ({ role: rule.role, action }))
      .filter((pair) => pair.role),
  );
  if (pairs.length === 0) return undefined;

  const ruleXml = pairs
    .map(
      ({ role, action }) => `
  <Rule RuleId="${escapeXml(`${role}_${action}_Permit`)}" Effect="Permit">
    <Target>
      <Actions>
        <Action>
          <ActionMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
            <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(action)}</AttributeValue>
            <ActionAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id"
              DataType="http://www.w3.org/2001/XMLSchema#string"/>
          </ActionMatch>
        </Action>
      </Actions>
    </Target>
    <Condition>
      <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:string-is-in">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(role)}</AttributeValue>
        <SubjectAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role"
          DataType="http://www.w3.org/2001/XMLSchema#string"/>
      </Apply>
    </Condition>
  </Rule>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Policy PolicyId="mediapackage-1"
  RuleCombiningAlgId="urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:permit-overrides"
  Version="2.0"
  xmlns="urn:oasis:names:tc:xacml:2.0:policy:schema:os">${ruleXml}
</Policy>
`;
};

/** Attaches an arbitrary file (ACL XML, preview image, …) to the media package. */
export const addAttachment = async (
  mediaPackage: string,
  flavor: string,
  file: Blob,
  filename: string,
  signal?: AbortSignal,
): Promise<string> => {
  const body = new FormData();
  body.append("mediaPackage", mediaPackage);
  body.append("flavor", flavor);
  body.append("BODY", file, filename);
  return post("/ingest/addAttachment", body, signal);
};

/**
 * Starts the workflow. Every entry of `workflowConfig` is handed to the workflow
 * as a configuration property — Opencast's `getWorkflowConfig` copies all form
 * fields except `mediaPackage` verbatim. That is the mechanism behind the
 * transcribe/translate switches; which property names a workflow reads comes
 * from the plugin config, not from a guess.
 */
export const ingest = async (
  mediaPackage: string,
  workflowDefinitionId: string | undefined,
  workflowConfig: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<string> => {
  const body = new FormData();
  body.append("mediaPackage", mediaPackage);
  if (workflowDefinitionId) {
    body.append("workflowDefinitionId", workflowDefinitionId);
  }
  for (const [key, value] of Object.entries(workflowConfig)) {
    body.append(key, value);
  }
  return post("/ingest/ingest", body, signal);
};

/**
 * Deletes a media package that was created but never ingested, including any
 * bytes already transferred. This is what makes cancelling honest: the user is
 * told nothing was kept, and nothing is.
 */
export const discardMediaPackage = async (mediaPackage: string): Promise<void> => {
  const body = new FormData();
  body.append("mediaPackage", mediaPackage);
  try {
    await post("/ingest/discardMediaPackage", body);
  } catch (error) {
    // Best-effort: a failed discard leaves an orphan for the server-side reaper
    // but must never block the UI or turn into an error the user has to action.
    logger.warn("[upload-v2] discarding media package failed", { error });
  }
};

/**
 * Fire-and-forget discard for `beforeunload`, where neither fetch nor XHR is
 * guaranteed to complete. Returns whether the beacon was accepted.
 */
export const discardViaBeacon = (mediaPackage: string): boolean => {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
  const body = new FormData();
  body.append("mediaPackage", mediaPackage);
  return navigator.sendBeacon("/ingest/discardMediaPackage", body);
};
