import { Trash2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { useI18n, loadNamespace } from "@oc-mui/i18n";
import {
  useMuiGetAllManagedAclsQuery,
  useMuiUpdateEventAclMutation,
  useMuiUpdateSeriesAclMutation,
  useMuiGetManagedAclsWithEventIdQuery,
  useMuiGetManagedAclsWithSeriesIdQuery,
  useMuiSearchUserQuery,
  useQueryClient,
} from "@oc-mui/query";
import type { MuiSearchUserQuery } from "@oc-mui/query";
import { logger } from "@oc-mui/utils";

import { OverflowTooltip } from "../overflow-tooltip";
import {
  Button,
  Checkbox,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  toast,
} from "../ui";

import type { AclData, ACLEntry, ACLEntryInput, SelectedElement } from "./types";

type UserSearchResult = NonNullable<NonNullable<MuiSearchUserQuery["searchUser"]>["nodes"]>[number];

interface AclEditorProps {
  selectedElement?: SelectedElement | null | undefined;
  aclEntries: ACLEntry[];
  managedAclId?: string | undefined;
  hasChanges: boolean;
  refetch: () => void;
  onClose?: (() => void) | undefined;
  showUpdateButton?: boolean | undefined;
  onAclChange: (entries: ACLEntry[]) => void;
  onManagedAclChange: (managedAclId: string) => void;
  onHasChangesChange: (hasChanges: boolean) => void;
  disabled?: boolean | undefined;
}

export const AclEditor: React.FC<AclEditorProps> = ({
  selectedElement,
  aclEntries,
  managedAclId,
  hasChanges,
  refetch = () => {},
  showUpdateButton = true,
  onAclChange,
  onManagedAclChange,
  onHasChangesChange,
  disabled = false,
}) => {
  // Only UI state is local
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const updateEventAcl = useMuiUpdateEventAclMutation();
  const updateSeriesAcl = useMuiUpdateSeriesAclMutation();
  const { t, i18n } = useI18n();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadTranslations = async () => {
      await loadNamespace("muitable-sidebar", i18n.language);
    };
    loadTranslations();
  }, [i18n.language]);

  const { data, isLoading, isError } = useMuiSearchUserQuery({
    query: searchQuery,
    limit: 10,
    offset: 0,
  });
  const filteredUsers = data?.searchUser.nodes || [];

  const isEvent = selectedElement?.__typename === "Event";
  const isSeries = selectedElement?.__typename === "Series";
  const isUpload = selectedElement?.__typename === "Upload" || (!isEvent && !isSeries);
  const id = selectedElement?.id ?? "";

  // Check if the selected element is editable
  const isEventEditable =
    !disabled && (!isEvent || selectedElement?.eventStatus?.split(".")?.pop() === "PROCESSED");

  const { data: managedAclsWithEvent } = useMuiGetManagedAclsWithEventIdQuery(
    { id },
    { enabled: isEvent && !!id },
  );
  const { data: managedAclsWithSeries } = useMuiGetManagedAclsWithSeriesIdQuery(
    { id },
    { enabled: isSeries && !!id },
  );
  const { data: managedAclsWithoutUsers } = useMuiGetAllManagedAclsQuery(undefined, {
    enabled: isUpload,
  });

  const managedAcls = isEvent
    ? (managedAclsWithEvent?.managedAcls?.nodes ?? [])
    : isSeries
      ? (managedAclsWithSeries?.managedAcls?.nodes ?? [])
      : (managedAclsWithoutUsers?.managedAcls?.nodes ?? []);

  // User actions call parent callbacks
  const handleAddUser = useCallback(
    (user: UserSearchResult) => {
      if (user) {
        const exists = aclEntries.find((entry) => entry.role === user.userRole);
        if (!exists) {
          const updatedEntries = [
            ...aclEntries,
            {
              role: user.userRole || "",
              label: user.name || user.username || "",
              userId: user.username || "",
              action: ["read"],
            },
          ];
          onAclChange(updatedEntries);
          onHasChangesChange(true);
          setSearchQuery("");
          setOpen(false);
        }
      }
    },
    [aclEntries, onAclChange, onHasChangesChange],
  );

  const handlePermissionChange = (index: number, permission: string, value: boolean | string) => {
    const updatedEntries = [...aclEntries];
    if (updatedEntries[index] && updatedEntries[index].action) {
      if (value) {
        if (!updatedEntries[index].action.includes(permission)) {
          updatedEntries[index].action.push(permission);
        }
      } else {
        updatedEntries[index].action = updatedEntries[index].action.filter(
          (act) => act !== permission,
        );
      }
      onAclChange(updatedEntries);
      onHasChangesChange(true);
    }
  };

  const handleRemoveEntry = (index: number) => {
    const updatedEntries = [...aclEntries];
    updatedEntries.splice(index, 1);
    onAclChange(updatedEntries);
    onHasChangesChange(true);
  };

  const handleUpdate = () => {
    // Convert UI ACLEntry to API ACLEntryInput (remove UI-only fields)
    const entries: ACLEntryInput[] = aclEntries.map((entry) => ({
      role: entry.role ?? "",
      action: entry.action ?? [],
    }));

    const aclData: AclData = {
      managedAclId: managedAclId || undefined,
      entries: entries as ACLEntry[],
    };

    if (selectedElement?.__typename === "Event") {
      updateEventAcl.mutate(
        {
          eventId: selectedElement.id,
          acl: { managedAclId: aclData.managedAclId, entries: aclData.entries },
        },
        {
          onSuccess: () => {
            toast.success(t("muitable-sidebar:changesSaved"));
            // Invalidate all event-related queries
            queryClient.invalidateQueries({ queryKey: ["GetMyEvents"] });
            queryClient.invalidateQueries({ queryKey: ["EventsFromSeries"] });
            queryClient.invalidateQueries({ queryKey: ["GetManagedAclsWithEventId"] });
            refetch();
            // Do NOT call onClose or onEditClose here
          },
        },
      );
    }
    if (selectedElement?.__typename === "Series") {
      updateSeriesAcl.mutate(
        {
          seriesId: selectedElement.id,
          acl: { managedAclId: aclData.managedAclId, entries: aclData.entries },
        },
        {
          onSuccess: () => {
            toast.success(t("muitable-sidebar:changesSaved"));
            // Invalidate all series-related queries
            queryClient.invalidateQueries({ queryKey: ["GetMySeries"] });
            queryClient.invalidateQueries({ queryKey: ["GetSeriesInfo"] });
            queryClient.invalidateQueries({ queryKey: ["GetManagedAclsWithSeriesId"] });
            refetch();
            // Do NOT call onClose or onEditClose here
          },
          onError: (error) => {
            toast.error(t("muitable-sidebar:changesFailed"));
            logger.error(
              "Error updating series ACL",
              error instanceof Error ? error : new Error(String(error)),
              { seriesId: id },
            );
          },
        },
      );
    }
    onHasChangesChange(false); // Use controlled hasChanges prop
  };

  const handleManagedAclUpdate = (value: string): void => {
    onManagedAclChange(value);
    onHasChangesChange(true);
  };

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <div className="space-y-8">
        <div className="mb-4 pt-4 flex flex-col gap-2">
          <Label>{t("muitable-sidebar:accessPolicy")}</Label>
          <Select
            value={managedAclId ?? "none"}
            onValueChange={handleManagedAclUpdate}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("muitable-sidebar:selectAccessPolicy")} />
            </SelectTrigger>
            <SelectContent className="sidebar-portal-inside">
              <SelectItem value="none">{t("muitable-sidebar:noPolicy")}</SelectItem>
              {managedAcls
                .filter((policy) => policy != null)
                .map((policy) => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {t(`muitable-sidebar:acls.${policy.name}`)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 w-full overflow-hidden">
          <h3>{t("muitable-sidebar:accessList")}</h3>
          {aclEntries.length === 0 ? (
            <>
              <div className="flex justify-start my-2">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      size={"sm"}
                      variant="ghost"
                      onClick={() => setOpen(!open)}
                      className="flex items-center gap-1"
                      disabled={disabled}
                    >
                      + {t("muitable-sidebar:addUser")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="sidebar-portal-inside w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder={t("muitable-sidebar:searchUser")}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      {isLoading && <div className="p-2">{t("muitable-sidebar:loading")}</div>}
                      {isError && (
                        <div className="p-2">{t("muitable-sidebar:errorLoadingUsers")}</div>
                      )}
                      <CommandEmpty>{t("muitable-sidebar:noUsersFound")}</CommandEmpty>
                      <CommandList>
                        {filteredUsers.map((user) => (
                          <CommandItem key={user?.username} onSelect={() => handleAddUser(user)}>
                            {user?.name || user?.username}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-sm font-mono flex justify-center text-muted-foreground">
                {t("muitable-sidebar:noEntries")}
              </p>
            </>
          ) : (
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2 px-0">User</TableHead>
                  <TableHead className="w-1/4 px-0 text-center">
                    {t("muitable-sidebar:read")}
                  </TableHead>
                  <TableHead className="w-1/4 px-0 text-center">
                    {t("muitable-sidebar:write")}
                  </TableHead>
                  <TableHead className="w-1/3 px-0 text-center">
                    {t("muitable-sidebar:actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aclEntries.map((entry, index) => (
                  <TableRow key={`${entry.role}-${index}`}>
                    <TableCell className="p-0 max-w-0 ">
                      <OverflowTooltip className="block p-0 max-w-[500px] truncate">
                        {entry.label || entry.role}
                      </OverflowTooltip>
                    </TableCell>
                    <TableCell className="text-center py-2 px-0">
                      <Checkbox
                        checked={entry.action.includes("read")}
                        disabled
                        onCheckedChange={(value) => handlePermissionChange(index, "read", value)}
                      />
                    </TableCell>
                    <TableCell className="text-center py-2 px-0">
                      <Checkbox
                        checked={entry.action.includes("write")}
                        disabled={disabled}
                        onCheckedChange={(value) => handlePermissionChange(index, "write", value)}
                      />
                    </TableCell>
                    <TableCell className="text-center py-2 px-0">
                      <Button
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => handleRemoveEntry(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="py-2 px-0">
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setOpen(!open)}
                          className="flex items-center gap-1"
                          disabled={disabled}
                        >
                          + {t("muitable-sidebar:addUser")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="sidebar-portal-inside w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder={t("muitable-sidebar:searchUser")}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          {isLoading && <div className="p-2">{t("muitable-sidebar:loading")}</div>}
                          {isError && (
                            <div className="p-2">{t("muitable-sidebar:errorLoadingUsers")}</div>
                          )}
                          <CommandEmpty>{t("muitable-sidebar:noUsersFound")}</CommandEmpty>
                          <CommandList>
                            {filteredUsers.map((user) => (
                              <CommandItem
                                key={user?.username}
                                onSelect={() => handleAddUser(user)}
                              >
                                {user?.name || user?.username}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>

        {showUpdateButton &&
          (isEventEditable ? (
            <Button
              onClick={handleUpdate}
              className="m-2 absolute bottom-4 right-4"
              size={"sm"}
              disabled={!hasChanges}
            >
              Update
            </Button>
          ) : (
            <div className="text-xs text-center text-muted-foreground">
              {t("muitable-sidebar:cannotEdit")}
            </div>
          ))}
      </div>
    </div>
  );
};

export {
  type AclData,
  type ACLEntry,
  type ACLEntryInput,
  type SelectedElement,
  type ManagedACLEntry,
} from "./types";
