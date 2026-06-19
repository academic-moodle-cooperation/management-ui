import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import { ComponentResolver } from "@oc-mui/plugin-system";
import {
  useMuiCreateSeriesMutation,
  useMuiGetAllManagedAclsQuery,
  useQueryClient,
  useMuiUserQuery,
  type AccessControlListInput,
  type CommonSeriesMetadataInput,
  type MuiGetAllManagedAclsQuery,
} from "@oc-mui/query";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  type AclData,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from "@oc-mui/ui/components";

interface CreateSeriesToolbarActionProps {
  refetch?: () => void;
}

interface CreateSeriesFormState {
  title: string;
  description: string;
  language: string;
  license: string;
  contributor: string;
  creator: string;
  publisher: string;
  subject: string;
  rightsHolder: string;
}

const DEFAULT_FORM_STATE: CreateSeriesFormState = {
  title: "",
  description: "",
  language: "",
  license: "",
  contributor: "",
  creator: "",
  publisher: "",
  subject: "",
  rightsHolder: "",
};

const LANGUAGE_OPTIONS = [
  "ara",
  "dan",
  "deu",
  "eng",
  "fin",
  "fra",
  "gsw",
  "hin",
  "ita",
  "jpn",
  "nld",
  "nor",
  "pol",
  "por",
  "roh",
  "rus",
  "slv",
  "spa",
  "swe",
  "tur",
  "ukr",
  "zho",
] as const;

const LICENSE_OPTIONS = [
  "CC-BY",
  "CC-BY-SA",
  "CC-BY-ND",
  "CC-BY-NC",
  "CC-BY-NC-SA",
  "CC-BY-NC-ND",
  "CC0",
  "ALLRIGHTS",
] as const;

const parseListField = (value: string): string[] | undefined => {
  const normalized = value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeOptionalText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isSameAclEntries = (
  a: Array<{ role: string; action: string[] }>,
  b: Array<{ role: string; action: string[] }>,
): boolean => {
  if (a.length !== b.length) return false;

  return a.every((entry, index) => {
    const target = b[index];
    if (!target) return false;
    if (entry.role !== target.role) return false;
    if (entry.action.length !== target.action.length) return false;
    return entry.action.every((action, actionIndex) => action === target.action[actionIndex]);
  });
};

const isSameManagedAclEntries = (
  a: Array<{ role: string | null; action: Array<string | null> | null }>,
  b: Array<{ role: string | null; action: Array<string | null> | null }>,
): boolean => {
  if (a.length !== b.length) return false;

  return a.every((entry, index) => {
    const target = b[index];
    if (!target) return false;
    if (entry.role !== target.role) return false;

    const entryActions = entry.action ?? [];
    const targetActions = target.action ?? [];
    if (entryActions.length !== targetActions.length) return false;

    return entryActions.every((action, actionIndex) => action === targetActions[actionIndex]);
  });
};

const buildMetadataInput = (formState: CreateSeriesFormState): CommonSeriesMetadataInput => {
  const metadata: CommonSeriesMetadataInput = {
    title: formState.title.trim(),
  };

  const description = normalizeOptionalText(formState.description);
  if (description !== undefined) {
    metadata.description = description;
  }

  const language = normalizeOptionalText(formState.language);
  if (language !== undefined) {
    metadata.language = language;
  }

  const license = normalizeOptionalText(formState.license);
  if (license !== undefined) {
    metadata.license = license;
  }

  const subject = normalizeOptionalText(formState.subject);
  if (subject !== undefined) {
    metadata.subject = subject;
  }

  const rightsHolder = normalizeOptionalText(formState.rightsHolder);
  if (rightsHolder !== undefined) {
    metadata.rightsHolder = rightsHolder;
  }

  const contributor = parseListField(formState.contributor);
  if (contributor !== undefined) {
    metadata.contributor = contributor;
  }

  const creator = parseListField(formState.creator);
  if (creator !== undefined) {
    metadata.creator = creator;
  }

  const publisher = parseListField(formState.publisher);
  if (publisher !== undefined) {
    metadata.publisher = publisher;
  }

  return metadata;
};

type ManagedAclItem = NonNullable<MuiGetAllManagedAclsQuery["managedAcls"]["nodes"][number]>;

export const CreateSeriesToolbarAction = ({ refetch }: CreateSeriesToolbarActionProps) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const createSeries = useMuiCreateSeriesMutation();
  const { data: userData } = useMuiUserQuery();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<CreateSeriesFormState>(DEFAULT_FORM_STATE);
  const [pluginAclData, setPluginAclData] = useState<AclData | null>(null);

  const { data: managedAclsData } = useMuiGetAllManagedAclsQuery();

  const managedAcls = useMemo(() => {
    return (managedAclsData?.managedAcls.nodes || []).filter(
      (policy): policy is ManagedAclItem => policy !== null,
    );
  }, [managedAclsData]);

  const privateManagedAclId = useMemo(() => {
    const privatePolicy = managedAcls.find(
      (policy) => policy.name?.toLowerCase().trim() === "private",
    );
    return privatePolicy?.id;
  }, [managedAcls]);

  const updateField = (field: keyof CreateSeriesFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const onAclDataChange = (aclData: AclData, managedAclId: string) => {
    const nextAclData: AclData = {
      ...aclData,
      managedAclId: managedAclId || aclData.managedAclId,
    };

    setPluginAclData((prev) => {
      if (!prev) return nextAclData;

      const sameManagedAclId = prev.managedAclId === nextAclData.managedAclId;
      const sameEntries = isSameAclEntries(prev.entries, nextAclData.entries);
      const sameManagedEntries = isSameManagedAclEntries(
        prev.managedAclEntries ?? [],
        nextAclData.managedAclEntries ?? [],
      );

      return sameManagedAclId && sameEntries && sameManagedEntries ? prev : nextAclData;
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormState(DEFAULT_FORM_STATE);
      setPluginAclData(null);
    }
  };

  const handleCreateSeries = () => {
    const normalizedTitle = formState.title.trim();
    if (!normalizedTitle) {
      toast.error(t("series:seriesTable.createSeries.validation.titleRequired"));
      return;
    }

    const metadata = buildMetadataInput(formState);
    const userRole = userData?.currentUser.userRole?.trim();
    const defaultEntries =
      userRole && userRole.length > 0 ? [{ role: userRole, action: ["read", "write"] }] : [];
    const defaultManagedAclId =
      privateManagedAclId && Number.isFinite(Number(privateManagedAclId))
        ? Number(privateManagedAclId)
        : undefined;
    const hasPluginEntries = (pluginAclData?.entries?.length || 0) > 0;
    const hasPluginManagedAclId =
      pluginAclData?.managedAclId !== undefined && pluginAclData.managedAclId !== "";

    // Guard rails for hidden defaults when no ACL plugin contributes values.
    if (!hasPluginEntries && defaultEntries.length === 0) {
      toast.error(t("series:seriesTable.createSeries.toast.error"));
      return;
    }

    if (!hasPluginManagedAclId && defaultManagedAclId === undefined) {
      toast.error(t("series:seriesTable.createSeries.toast.error"));
      return;
    }

    const aclEntries = pluginAclData?.entries?.length ? pluginAclData.entries : defaultEntries;
    const aclManagedAclIdRaw = pluginAclData?.managedAclId || defaultManagedAclId;
    const aclManagedAclId =
      aclManagedAclIdRaw !== undefined && aclManagedAclIdRaw !== ""
        ? Number(aclManagedAclIdRaw)
        : undefined;

    const acl: AccessControlListInput = {
      entries: aclEntries,
      ...(aclManagedAclId !== undefined && Number.isFinite(aclManagedAclId)
        ? { managedAclId: aclManagedAclId }
        : {}),
    };

    createSeries.mutate(
      {
        metadata,
        acl,
      },
      {
        onSuccess: () => {
          toast.success(t("series:seriesTable.createSeries.toast.success"));
          setIsDialogOpen(false);
          setFormState(DEFAULT_FORM_STATE);
          void queryClient.invalidateQueries({ queryKey: ["GetMySeries"] });
          refetch?.();
        },
        onError: () => {
          toast.error(t("series:seriesTable.createSeries.toast.error"));
        },
      },
    );
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <Button
        variant="secondary"
        className="flex font-medium text-sm h-8 rounded-md px-3 py-1"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("series:seriesTable.createSeries.button")}
      </Button>

      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("series:seriesTable.createSeries.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("series:seriesTable.createSeries.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="create-series-title">{t("series:seriesInfo.title")} *</Label>
            <Input
              id="create-series-title"
              value={formState.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-series-description">{t("series:seriesInfo.description")}</Label>
            <Textarea
              id="create-series-description"
              rows={3}
              value={formState.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="create-series-language">{t("series:seriesInfo.language")}</Label>
              <Select
                value={formState.language}
                onValueChange={(value) => updateField("language", value)}
              >
                <SelectTrigger id="create-series-language">
                  <SelectValue placeholder={t("noOptionSelected")} />
                </SelectTrigger>
                <SelectContent className="sidebar-portal-inside">
                  {LANGUAGE_OPTIONS.map((languageCode) => (
                    <SelectItem key={languageCode} value={languageCode}>
                      {t(`common:languages.${languageCode}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-series-license">{t("series:seriesInfo.license")}</Label>
              <Select
                value={formState.license}
                onValueChange={(value) => updateField("license", value)}
              >
                <SelectTrigger id="create-series-license">
                  <SelectValue placeholder={t("noOptionSelected")} />
                </SelectTrigger>
                <SelectContent className="sidebar-portal-inside">
                  {LICENSE_OPTIONS.map((licenseCode) => (
                    <SelectItem key={licenseCode} value={licenseCode}>
                      {t(`common:licences.${licenseCode}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-series-contributor">{t("series:seriesInfo.contributor")}</Label>
            <Textarea
              id="create-series-contributor"
              rows={2}
              value={formState.contributor}
              onChange={(event) => updateField("contributor", event.target.value)}
            />
            <span className="text-xs text-muted-foreground">{t("common:sepatateValues")}</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-series-creator">{t("series:seriesInfo.creator")}</Label>
            <Textarea
              id="create-series-creator"
              rows={2}
              value={formState.creator}
              onChange={(event) => updateField("creator", event.target.value)}
            />
            <span className="text-xs text-muted-foreground">{t("common:sepatateValues")}</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-series-publisher">{t("series:seriesInfo.publisher")}</Label>
            <Textarea
              id="create-series-publisher"
              rows={2}
              value={formState.publisher}
              onChange={(event) => updateField("publisher", event.target.value)}
            />
            <span className="text-xs text-muted-foreground">{t("common:sepatateValues")}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="create-series-subject">{t("series:seriesInfo.subject")}</Label>
              <Input
                id="create-series-subject"
                value={formState.subject}
                onChange={(event) => updateField("subject", event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-series-rights-holder">{t("series:seriesInfo.rightsHolder")}</Label>
              <Input
                id="create-series-rights-holder"
                value={formState.rightsHolder}
                onChange={(event) => updateField("rightsHolder", event.target.value)}
              />
            </div>
          </div>

          <ComponentResolver
            componentType="series:create-series:acl-editor"
            defaultComponent={() => null}
            componentProps={{
              aclData: pluginAclData,
              onAclDataChange,
              selectedSeries: null,
              disabled: createSeries.isPending,
              refetch,
            }}
            useOverridePrefix={false}
            loadingBehavior="none"
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            {t("common:cancel")}
          </Button>
          <Button
            onClick={handleCreateSeries}
            disabled={createSeries.isPending || formState.title.trim().length === 0}
          >
            {t("common:create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
