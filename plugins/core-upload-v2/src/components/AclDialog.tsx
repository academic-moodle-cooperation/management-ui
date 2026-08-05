import { useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import {
  AclEditor,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@oc-mui/ui/components";
import type { AclData, ACLEntry, SelectedElement } from "@oc-mui/ui/components";

/**
 * Access rights for the current selection.
 *
 * The shared `AclEditor` is reused rather than reimplemented — it owns the
 * user search and the managed-ACL queries, and duplicating those would mean
 * two places to fix whenever Opencast moves. It already understands the upload
 * case: passing an `Upload` element makes it report changes upward instead of
 * mutating an event or series that does not exist yet.
 *
 * It lives in a dialog rather than inline in the inspector for a plain reason:
 * it renders a four-column table of people against permissions, which is
 * unusable in a 300px panel. The inspector shows a summary and opens this.
 */

/** The editor needs *an* element; upload mode only reads the `__typename`. */
const UPLOAD_ELEMENT: SelectedElement = {
  __typename: "Upload",
  id: "",
  title: "",
};

export const aclSummary = (acl: AclData | undefined): { count: number; policy?: string } => {
  const entries = (acl?.entries?.length ?? 0) + (acl?.managedAclEntries?.length ?? 0);
  return acl?.managedAclId ? { count: entries, policy: acl.managedAclId } : { count: entries };
};

export const AclDialog = ({
  open,
  onOpenChange,
  acl,
  disabled,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acl: AclData | undefined;
  disabled: boolean;
  onApply: (acl: AclData) => void;
}) => {
  const { t } = useI18n("upload-v2");

  // Edited in the dialog and only written back on confirm, so cancelling
  // genuinely discards — the inspector writes straight through everywhere else,
  // but permissions deserve an explicit commit.
  const [entries, setEntries] = useState<ACLEntry[]>([]);
  const [managedAclId, setManagedAclId] = useState<string | undefined>(undefined);

  const reset = () => {
    setEntries([]);
    setManagedAclId(acl?.managedAclId);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("acl.title")}</DialogTitle>
          <DialogDescription>{t("acl.description")}</DialogDescription>
        </DialogHeader>

        {/* No entity exists yet, so there is nothing to refetch and no dirty
            state to report — the dialog's own confirm button is the commit.
            Those props are optional, so they are simply left off. */}
        <AclEditor
          selectedElement={UPLOAD_ELEMENT}
          aclEntries={entries}
          managedAclId={managedAclId}
          disabled={disabled}
          showUpdateButton={false}
          onAclChange={setEntries}
          onManagedAclChange={setManagedAclId}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("acl.cancel")}
          </Button>
          <Button
            onClick={() => {
              onApply({
                entries: entries.map((entry) => ({ role: entry.role, action: entry.action })),
                managedAclEntries: [],
                managedAclId,
              });
              onOpenChange(false);
            }}
          >
            {t("acl.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
