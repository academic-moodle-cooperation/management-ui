export interface ACLEntry {
  role: string; // e.g., "admin", "editor"
  label: string; // e.g., "Administrator", "Editor" - for UI display only
  userId: string; // e.g., "user123" - for UI display only
  action: string[]; // e.g., ["read", "write"]
}

export interface ManagedACLEntry {
  role: string | null;
  action: Array<string | null> | null;
}

// Type that matches GraphQL AccessControlItemInput
export interface ACLEntryInput {
  role: string;
  action: string[];
}

export interface AclData {
  managedAclId: string | undefined; // ID of the managed ACL policy, if any
  managedAclEntries?: ManagedACLEntry[] | undefined; // Array of ACL entries
  entries: ACLEntryInput[]; // API-facing ACL entries (UI-only fields removed)
}

export interface SelectedElement {
  __typename: "Event" | "Series" | "Upload";
  id: string;
  title: string;
  muiEventInfo?: {
    managedAclId?: string;
  };
  muiSeriesInfo?: {
    managedAclId?: string;
  };
  acl?: {
    users: ACLEntry[];
  };
  eventStatus?: string;
}
