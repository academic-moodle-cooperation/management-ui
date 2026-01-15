import React, { useState, useEffect, useMemo } from "react";

import {
  useGetManagedAclsWithEventIdQuery,
  useGetManagedAclsWithSeriesIdQuery,
} from "@workspace/query";
import { AclEditor, type SelectedElement, type ACLEntry } from "@workspace/ui/components";

/**
 * ACL Editor Tab Component for TU Wien Table Sidebars
 * Wraps the existing AclEditor component for use in table sidebar tabs
 *
 * Disables the editor for events that are not fully processed (status !== 'PROCESSED').
 * Series are always enabled.
 *
 * Now fetches ACL data via GraphQL and transforms it for the editor.
 */
export interface AclEditorTabProps {
  selectedElement?: SelectedElement | null;
  refetch?: () => void;
  onClose?: () => void;
}

export const AclEditorTab: React.FC<AclEditorTabProps> = ({
  selectedElement,
  refetch = () => {},
  onClose = () => {},
}) => {
  // Disable editor for events that are not PROCESSED
  const aclEditorDisabled =
    selectedElement?.__typename === "Event"
      ? selectedElement?.eventStatus?.split(".")?.pop() !== "PROCESSED"
      : false; // Series are always enabled

  const isEvent = selectedElement?.__typename === "Event";
  const isSeries = selectedElement?.__typename === "Series";
  const id = selectedElement?.id ?? "";

  // Fetch ACL data based on element type
  const { data: eventAclData } = useGetManagedAclsWithEventIdQuery(
    { id },
    { enabled: isEvent && !!id },
  );
  const { data: seriesAclData } = useGetManagedAclsWithSeriesIdQuery(
    { id },
    { enabled: isSeries && !!id },
  );

  // Extract initial ACL entries from the fetched data
  const initialAclEntries: ACLEntry[] = useMemo(() => {
    let aclUsers: Array<{
      role?: string | null;
      label?: string | null;
      action?: Array<string | null> | null;
    } | null> = [];

    if (isEvent && eventAclData?.eventById?.acl?.users) {
      aclUsers = eventAclData.eventById.acl.users;
    } else if (isSeries && seriesAclData?.seriesById?.acl?.users) {
      aclUsers = seriesAclData.seriesById.acl.users;
    }

    const processedEntries = aclUsers
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null) // Filter out null entries
      .map((entry) => ({
        role: entry.role || "",
        label: entry.label || entry.role || "",
        userId: "", // userId is not available in the GraphQL response, will be set when adding users
        action: entry.action?.filter((action): action is string => action !== null) || [], // Filter out null actions
      }));

    return processedEntries;
  }, [isEvent, isSeries, eventAclData, seriesAclData]);

  // For managedAclId, prioritize selectedElement data, then fall back to ACL matching
  const initialManagedAclId: string | undefined = useMemo(() => {
    // First try to get it from selectedElement (if available)
    let managedAclIdFromElement: string | number | null | undefined;

    if (selectedElement?.__typename === "Event") {
      managedAclIdFromElement = (
        selectedElement as { muiEventInfo?: { managedAclId?: string | number | null } }
      ).muiEventInfo?.managedAclId;
    } else if (selectedElement?.__typename === "Series") {
      managedAclIdFromElement = (
        selectedElement as { muiSeriesInfo?: { managedAclId?: string | number | null } }
      ).muiSeriesInfo?.managedAclId;
    }

    // Convert to string if we have a valid value
    if (managedAclIdFromElement !== null && managedAclIdFromElement !== undefined) {
      const managedAclIdStr = String(managedAclIdFromElement);
      return managedAclIdStr;
    }

    return undefined;
  }, [selectedElement]);

  // State management
  const [aclEntries, setAclEntries] = useState<ACLEntry[]>([]);
  const [managedAclId, setManagedAclId] = useState<string | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);

  // Update state when data changes
  useEffect(() => {
    setAclEntries(initialAclEntries);
    setHasChanges(false);
  }, [initialAclEntries]);

  useEffect(() => {
    setManagedAclId(initialManagedAclId);
  }, [initialManagedAclId]);

  return (
    <div className="h-full">
      <AclEditor
        selectedElement={selectedElement}
        aclEntries={aclEntries}
        managedAclId={managedAclId}
        hasChanges={hasChanges}
        refetch={refetch}
        onClose={onClose}
        showUpdateButton={true}
        onAclChange={setAclEntries}
        onManagedAclChange={setManagedAclId}
        onHasChangesChange={setHasChanges}
        disabled={aclEditorDisabled}
      />
    </div>
  );
};
