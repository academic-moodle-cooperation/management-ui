import Mustache from "mustache";

import onProgress from "./onProgress";
import { UploadFileBlob } from "@workspace/store";
import { toast, type AclData, type ACLEntryInput } from "@workspace/ui/components";
import { i18next } from "@workspace/i18n";
import { logger } from "@workspace/utils";

type UploadSettings = {
  seriesId: string;
  workflowId: string;
  acl: string;
  dcc: string;
  titleField: string;
  presenterField: string;
};

type Recording = {
  deviceType: string;
  media: Blob;
  url: string;
  mimeType: string;
  dimensions: string;
};

type User = {
  org: {
    anonymousRole: string;
    name: string;
    adminRole: string;
    id: string;
    properties: unknown;
  };
  roles: string[];
  userRole: string;
  user: {
    provider: string;
    name: string;
    email: string;
    username: string;
  };
};

const getMediaBlob = async (url: string) => {
  const response = await fetch(url);

  const reader = response.body?.getReader();

  const contentLength = response.headers.get("Content-Length") || 0;

  let receivedLength = 0;
  const chunks = [];
  while (reader) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;
  }
  return new Blob(chunks);
};

export const opencastUpload = async (
  selectedFile: UploadFileBlob,
  seriesId: string,
  workflowId: string,
  currentUser: User,
  location: string | undefined,
  updateFile: (updateFileInfo: UploadFileBlob) => void,
  setUploadError: (error: Error) => void,
  aclData?: AclData
) => {
  if (!selectedFile.file || selectedFile.status === "aborted" || !location) return;

  // TypeScript: location is checked above, so it's safe to use here
  // Create a local variable with the correct type using type assertion
  const locationString = location as string;

  const recordings = [
    {
      deviceType: "desktop",
      media: await getMediaBlob(selectedFile.src),
      url: selectedFile.src,
      mimeType: selectedFile.file.type,
      dimensions: "",
    },
  ];

  let mediaPackage = await request("/ingest/createMediaPackage", {}, setUploadError)
    .then((response) => {
      return response?.text() || "";
    })
    .catch((err) => {
      logger.error(
        "Error creating media package",
        err instanceof Error ? err : new Error(String(err))
      );
      return "";
    });

  if (!mediaPackage) return;

  const title =
    selectedFile?.uploadName.replace("%", "%25") ||
    selectedFile?.name.split(".").slice(0, -1).join(".");
  const presenter = currentUser.user.name || "";

  const aclXml = aclData ? constructAclFromData(aclData) : DEFAULT_ACL_TEMPLATE;

  const uploadSettings: UploadSettings = {
    seriesId,
    workflowId,
    acl: aclXml,
    dcc: DEFAULT_DCC_TEMPLATE,
    titleField: title,
    presenterField: presenter,
  };

  // TypeScript: location is checked above, so it's safe to use here
  const updatedMediaPackage = await addDcCatalog({
    mediaPackage,
    title,
    presenter,
    uploadSettings,
    currentUser,
    location: locationString,
    setUploadError,
  });

  if (!updatedMediaPackage) return;
  mediaPackage = updatedMediaPackage;

  if (uploadSettings?.acl !== null) {
    const aclMediaPackage = await attachAcl({
      mediaPackage,
      uploadSettings,
      currentUser,
      setUploadError,
    });
    if (!aclMediaPackage) return;
    mediaPackage = aclMediaPackage;
  }

  mediaPackage = await uploadTracks(
    selectedFile,
    {
      mediaPackage,
      recordings,
      title,
      presenter,
    },
    updateFile
  );

  if (!mediaPackage) return;

  await finishIngest({ mediaPackage, uploadSettings }, setUploadError);
};

const addDcCatalog = async ({
  mediaPackage,
  title,
  presenter,
  uploadSettings,
  currentUser,
  location,
  setUploadError,
}: {
  mediaPackage: string;
  title: string;
  presenter: string;
  uploadSettings: UploadSettings;
  currentUser: User;
  location: string;
  setUploadError: (e: Error) => void;
}) => {
  const seriesId = uploadSettings.seriesId;
  const template = uploadSettings.dcc;
  const dcc = constructDcc(template, { presenter, title, seriesId }, currentUser, location);

  const body = new FormData();
  body.append("mediaPackage", mediaPackage);
  body.append("dublinCore", encodeURIComponent(dcc));
  body.append("flavor", "dublincore/episode");

  return await request("/ingest/addDCCatalog", { method: "post", body }, setUploadError)
    .then((response) => response?.text())
    .catch((err) => {
      logger.error("Error adding DC catalog", err instanceof Error ? err : new Error(String(err)));
      return "";
    });
};

const constructDcc = (
  template: string,
  { title, presenter, seriesId }: { presenter: string; title: string; seriesId: string },
  currentUser: User,
  location: string
) => {
  // Prepare template "view": the values that can be used within the template.
  const view = {
    user: currentUser,
    lti: null,
    title,
    presenter,
    seriesId,
    now: new Date().toISOString(),
    location,
  };

  return renderTemplate(template, view);
};

const attachAcl = async ({
  mediaPackage,
  uploadSettings,
  currentUser,
  setUploadError,
}: {
  mediaPackage: string;
  uploadSettings: UploadSettings;
  currentUser: User;
  setUploadError: (e: Error) => void;
}) => {
  const acl = constructAcl(uploadSettings.acl, currentUser);

  const body = new FormData();
  body.append("flavor", "security/xacml+episode");
  body.append("mediaPackage", mediaPackage);
  body.append("BODY", new Blob([acl]), "acl.xml");

  return await request("/ingest/addAttachment", { method: "post", body }, setUploadError)
    .then((response) => response?.text())
    .catch((err) => {
      logger.error("Error adding attachment", err instanceof Error ? err : new Error(String(err)));
      return "";
    });
};

const constructAcl = (template: string, currentUser: User) => {
  if (!currentUser) {
    throw new Error(`'currentUser' is '${currentUser}' in 'constructAcl'`);
  }

  // Prepare template "view": the values that can be used within the template.
  const view = {
    user: currentUser,
    lti: null,
    roleOAuthUser: currentUser.roles.find((r) => r === "ROLE_OAUTH_USER"),
  };

  return renderTemplate(template, view);
};

// Function to generate ACL XML from aclData
const constructAclFromData = (aclData: AclData) => {
  // Convert managed ACL entries to API-facing entries (role/action only)
  const managedEntries: ACLEntryInput[] = (aclData?.managedAclEntries || []).map((entry) => ({
    role: entry.role || "",
    action: entry.action?.filter((a): a is string => a !== null) || [],
  }));

  const entries: ACLEntryInput[] = (aclData.entries || []).concat(managedEntries);

  // If entries are provided, construct the ACL XML dynamically
  if (entries && entries.length > 0) {
    // Start building the XML
    let rulesXml = "";

    entries.forEach((entry, index) => {
      const { role, action } = entry;

      // For each action in the entry, create a Rule
      action.forEach((act) => {
        const ruleId = `${escapeString(role)}_${escapeString(act)}_Permit`;
        rulesXml += `
  <Rule RuleId="${ruleId}" Effect="Permit">
    <Target>
      <Actions>
        <Action>
          <ActionMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
            <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeString(act)}</AttributeValue>
            <ActionAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id"
              DataType="http://www.w3.org/2001/XMLSchema#string"/>
          </ActionMatch>
        </Action>
      </Actions>
    </Target>
    <Condition>
      <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:string-is-in">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeString(role)}</AttributeValue>
        <SubjectAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role"
          DataType="http://www.w3.org/2001/XMLSchema#string"/>
      </Apply>
    </Condition>
  </Rule>`;
      });
    });

    // Complete the XML
    const aclXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Policy PolicyId="custom-policy-${Date.now()}"
  RuleCombiningAlgId="urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:permit-overrides"
  Version="2.0"
  xmlns="urn:oasis:names:tc:xacml:2.0:policy:schema:os">
${rulesXml}
  <Rule RuleId="user_read_Permit" Effect="Permit">
    <Target>
      <Actions>
        <Action>
          <ActionMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
            <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">read</AttributeValue>
            <ActionAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id"
              DataType="http://www.w3.org/2001/XMLSchema#string"/>
          </ActionMatch>
        </Action>
      </Actions>
    </Target>
    <Condition>
      <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:string-is-in">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">{{ user.userRole }}</AttributeValue>
        <SubjectAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role"
          DataType="http://www.w3.org/2001/XMLSchema#string"/>
      </Apply>
    </Condition>
  </Rule>
  <Rule RuleId="user_write_Permit" Effect="Permit">
    <Target>
      <Actions>
        <Action>
          <ActionMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
            <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">write</AttributeValue>
            <ActionAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id"
              DataType="http://www.w3.org/2001/XMLSchema#string"/>
          </ActionMatch>
        </Action>
      </Actions>
    </Target>
    <Condition>
      <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:string-is-in">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">{{ user.userRole }}</AttributeValue>
        <SubjectAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role"
          DataType="http://www.w3.org/2001/XMLSchema#string"/>
      </Apply>
    </Condition>
  </Rule>
</Policy>
`;

    return aclXml;
  }

  // Fallback to default if no managedAclId or entries are provided
  return DEFAULT_ACL_TEMPLATE;
};

const uploadTracks = async (
  selectedFile: UploadFileBlob,
  {
    mediaPackage,
    recordings,
    title,
    presenter,
  }: {
    mediaPackage: string;
    recordings: Recording[];
    title: string;
    presenter: string;
  },
  updateFile: (updateFileInfo: UploadFileBlob) => void
) => {
  const totalBytes = recordings.map((r: Recording) => r.media.size).reduce((a, b) => a + b, 0);
  let finishedTracksBytes = 0;

  for (const { deviceType, media, url, mimeType } of recordings) {
    const finishedBytes = finishedTracksBytes;
    let trackFlavor = "presentation/source";
    if (deviceType === "desktop") {
      trackFlavor = "presentation/source";
    } else if (deviceType === "video") {
      trackFlavor = "presenter/source";
    }

    if (selectedFile.displayType === "Audio") trackFlavor = "audio/source";

    // const flavor = deviceType === "desktop" ? "presentation" : "presenter";
    const downloadName = selectedFile?.name;

    const body = new FormData();
    body.append("mediaPackage", mediaPackage);
    body.append("flavor", trackFlavor);
    body.append("tags", "");
    body.append("BODY", media, downloadName);

    const url = "/ingest/addTrack";

    mediaPackage = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      xhr.onload = () => {
        updateFile({
          ...selectedFile,
          status: "completed",
          progress: 100,
        });

        toast.success(i18next.t("upload:toast.success"), {
          style: {
            background: "hsl(143, 85%, 96%)",
            color: "hsl(140, 100%, 27%)",
            borderColor: "hsl(145, 92%, 91%)",
          },
        });

        resolve(xhr.responseText);
      };
      xhr.onabort = () => {
        toast.info(i18next.t("upload:toast.aborted"));

        resolve(xhr.responseText);
      };
      xhr.onloadend = () => {
        logger.debug("File upload response", { responseText: xhr.responseText });
      };
      xhr.onerror = () => {
        updateFile({
          ...selectedFile,
          status: "error",
        });
      };
      xhr.upload.onprogress = (e) => {
        if (onProgress) {
          const totalLoaded = e.loaded + finishedBytes;
          () => onProgress(totalLoaded / totalBytes);

          const progress = Math.round((totalLoaded / totalBytes) * 100);

          updateFile({
            ...selectedFile,
            status: "loading",
            progress,
            request: xhr,
          });
        }
      };

      try {
        xhr.send(body);

        updateFile({
          ...selectedFile,
          status: "loading",
          request: xhr,
        });
      } catch (e) {
        updateFile({
          ...selectedFile,
          status: "error",
        });
        logger.error("Error uploading file", e instanceof Error ? e : new Error(String(e)), {
          url,
        });
        reject(e);
      }
    });

    finishedTracksBytes += media.size;
  }
  return mediaPackage;
};

const finishIngest = async (
  { mediaPackage, uploadSettings }: { mediaPackage: string; uploadSettings: UploadSettings },
  setUploadError: (e: Error) => void
) => {
  if (!mediaPackage) return;

  const workflowId = uploadSettings.workflowId;

  const body = new FormData();
  body.append("mediaPackage", mediaPackage);
  if (workflowId) {
    body.append("workflowDefinitionId", workflowId);
  }

  await request("/ingest/ingest", { method: "post", body }, setUploadError).catch((err) => {
    logger.error("Error ingesting media", err instanceof Error ? err : new Error(String(err)));
  });
};

const request = async (path: string, options = {}, setUploadError: (e: Error) => void) => {
  const url = path;

  const headers = new Headers();
  headers.append("pragma", "no-cache");
  headers.append("cache-control", "no-cache");

  let response;
  try {
    response = await fetch(url, {
      ...options,
      // credentials: 'same-origin',
      redirect: "manual",
      headers,
    });
  } catch (e) {
    setUploadError(e as Error);
  }

  return response;
};

const escapeString = (s: string | undefined) => new XMLSerializer().serializeToString(new Text(s));

const renderTemplate = (template: string, view: unknown) => {
  const originalEscape = Mustache.escape;
  Mustache.escape = escapeString;
  const out = Mustache.render(template, view);
  Mustache.escape = originalEscape;
  return out;
};

const DEFAULT_DCC_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
    <dublincore xmlns="http://www.opencastproject.org/xsd/1.0/dublincore/"
              xmlns:dcterms="http://purl.org/dc/terms/"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <dcterms:created xsi:type="dcterms:W3CDTF">{{ now }}</dcterms:created>
      <dcterms:title>{{ title }}</dcterms:title>
      {{ #presenter }}<dcterms:creator>{{ presenter }}</dcterms:creator>{{ /presenter }}
      {{ #seriesId }}<dcterms:isPartOf>{{ seriesId }}</dcterms:isPartOf>{{ /seriesId }}
      <dcterms:source>{{ user.user.username }}</dcterms:source>
      <dcterms:extent xsi:type="dcterms:ISO8601">PT5.568S</dcterms:extent>
      <dcterms:spatial>{{ location }}</dcterms:spatial>
    </dublincore>
  `;

const DEFAULT_ACL_TEMPLATE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Policy PolicyId="mediapackage-1"
      RuleCombiningAlgId="urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:permit-overrides"
      Version="2.0"
      xmlns="urn:oasis:names:tc:xacml:2.0:policy:schema:os">
      <Rule RuleId="user_read_Permit" Effect="Permit">
        <Target>
          <Actions>
            <Action>
              <ActionMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">read</AttributeValue>
                <ActionAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id"
                  DataType="http://www.w3.org/2001/XMLSchema#string"/>
              </ActionMatch>
            </Action>
          </Actions>
        </Target>
        <Condition>
          <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:string-is-in">
            <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">{{ user.userRole }}</AttributeValue>
            <SubjectAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role"
              DataType="http://www.w3.org/2001/XMLSchema#string"/>
          </Apply>
        </Condition>
      </Rule>
      <Rule RuleId="user_write_Permit" Effect="Permit">
        <Target>
          <Actions>
            <Action>
              <ActionMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">write</AttributeValue>
                <ActionAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id"
                  DataType="http://www.w3.org/2001/XMLSchema#string"/>
              </ActionMatch>
            </Action>
          </Actions>
        </Target>
        <Condition>
          <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:string-is-in">
            <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">{{ user.userRole }}</AttributeValue>
            <SubjectAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role"
              DataType="http://www.w3.org/2001/XMLSchema#string"/>
          </Apply>
        </Condition>
      </Rule>
    </Policy>
    `;
