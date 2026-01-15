import React, { useEffect, useState } from "react";

import { useGetAllManagedAclsQuery, type GetAllManagedAclsQuery } from "@workspace/query";
import {
  AclEditor,
  type ManagedACLEntry,
  type ACLEntry,
  type AclData,
} from "@workspace/ui/components";

export interface UploadAclEditorProps {
  aclData?: AclData | null;
  onAclDataChange: (aclData: AclData, managedAclId: string) => void;
  // selectedSeries: Series;
  disabled: boolean;
  refetch?: () => void;
}

export const UploadAclEditor: React.FC<UploadAclEditorProps> = ({
  aclData,
  onAclDataChange,
  // selectedSeries,
  disabled = false,
  refetch = () => {},
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [managedAclId, setManagedAclId] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<ACLEntry[]>([]);
  type ManagedAclNode = NonNullable<GetAllManagedAclsQuery["managedAcls"]["nodes"][number]>;
  const [managedAcls, setManagedAcls] = useState<ManagedAclNode[]>([]);
  const [managedAclEntries, setManagedAclEntries] = useState<ManagedACLEntry[]>([]);

  // Fetch managed ACLs
  const { data: managedAclsData } = useGetAllManagedAclsQuery();
  useEffect(() => {
    const nodes = managedAclsData?.managedAcls?.nodes ?? [];
    // Filter out null values
    setManagedAcls(nodes.filter((node): node is ManagedAclNode => node !== null));
  }, [managedAclsData]);

  // When managed ACL changes, update entries
  const onManagedAclChange = (aclId: string) => {
    setManagedAclId(aclId);
    const selectedAcl = managedAcls.find((acl) => acl.id === aclId);
    const entries = selectedAcl?.acl?.entries ?? [];
    // Filter out null values and map to ManagedACLEntry
    setManagedAclEntries(
      entries
        .filter((entry): entry is ManagedACLEntry => entry !== null)
        .map((entry) => ({
          role: entry.role ?? null,
          action: entry.action ?? null,
        })),
    );
  };

  const onAclChange = (entries: ACLEntry[]) => {
    setEntries(entries);
  };

  const onHasChangesChange = (hasChanges: boolean) => {
    setHasChanges(hasChanges);
  };

  useEffect(() => {
    onAclDataChange(
      {
        entries: entries.map((e) => ({ role: e.role, action: e.action })),
        managedAclEntries,
        managedAclId: managedAclId ?? "",
      },
      managedAclId ?? "",
    );
  }, [managedAclId, entries, managedAclEntries, onAclDataChange]);

  return (
    <div className="h-full">
      <AclEditor
        aclEntries={
          aclData?.entries.map((entry) => ({
            role: entry.role,
            action: entry.action,
            label: entry.role,
            userId: "",
          })) ?? []
        }
        managedAclId={managedAclId}
        hasChanges={hasChanges}
        refetch={refetch}
        onClose={() => {}}
        showUpdateButton={false}
        onAclChange={onAclChange}
        onManagedAclChange={onManagedAclChange}
        onHasChangesChange={onHasChangesChange}
        disabled={disabled}
      />
    </div>
  );
};
