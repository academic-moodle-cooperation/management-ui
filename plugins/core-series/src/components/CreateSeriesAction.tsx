import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";

import { useExtensionLabels, useI18n } from "@oc-mui/i18n";
import type { CreateSeriesVariant } from "@oc-mui/plugin-core";
import { useQueryClient } from "@oc-mui/query";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@oc-mui/ui/components";

import { useCreateSeriesVariants } from "./createSeriesVariants";

interface CreateSeriesActionProps {
  refetch?: () => void;
}

interface VariantChooserProps {
  variants: CreateSeriesVariant[];
  onPick: (variant: CreateSeriesVariant) => void;
}

const VariantChooser = ({ variants, onPick }: VariantChooserProps) => {
  const { t } = useI18n();
  // Loads the labels' namespaces up front, so an org plugin's caption shows
  // translated even before its own component has mounted.
  const resolveLabel = useExtensionLabels(
    variants.flatMap((variant) => [
      { key: variant.id, label: variant.label },
      ...(variant.description ? [{ key: variant.id, label: variant.description }] : []),
    ]),
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("series:seriesTable.createSeries.dialog.chooserTitle")}</DialogTitle>
        <DialogDescription>
          {t("series:seriesTable.createSeries.dialog.chooserDescription")}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-2">
        {variants.map((variant) => {
          const Icon = variant.icon;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onPick(variant)}
              className="flex items-start gap-4 rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
              <span className="flex flex-col gap-1">
                <span className="font-medium">
                  {resolveLabel({ key: variant.id, label: variant.label })}
                </span>
                {variant.description && (
                  <span className="text-sm text-muted-foreground">
                    {resolveLabel({ key: variant.id, label: variant.description })}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

/**
 * The "Create series" button and its dialog. The dialog is a shell: it lists
 * the variants registered on `series:create-series:variants` (filtered by
 * config and the user's roles), shows a chooser when there is more than one,
 * and renders the picked variant, which owns the dialog body and footer.
 * After `onCreated` it closes, invalidates the series list and calls `refetch`.
 *
 * Rendered next to the page heading by default, or in the table toolbar when
 * `plugins.series.seriesTable.createSeries.placement` is `"toolbar"`. Renders
 * nothing when no variant is available.
 */
export const CreateSeriesAction = ({ refetch }: CreateSeriesActionProps) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const variants = useCreateSeriesVariants();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  if (variants.length === 0) {
    return null;
  }

  const single = variants.length === 1 ? variants[0] : undefined;
  const picked = single ?? variants.find((variant) => variant.id === pickedId);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setPickedId(null);
    }
  };

  const handleCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ["GetMySeries"] });
    refetch?.();
    handleOpenChange(false);
  };

  // With a single variant "cancel" closes; with several it returns to the chooser.
  const handleCancel = single ? () => handleOpenChange(false) : () => setPickedId(null);

  const PickedComponent = picked?.component;

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <Button
        className="flex font-medium text-sm h-8 rounded-md px-3 py-1"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("series:seriesTable.createSeries.button")}
      </Button>

      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {PickedComponent ? (
          <>
            {!single && (
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 text-muted-foreground"
                onClick={() => setPickedId(null)}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("series:seriesTable.createSeries.dialog.back")}
              </Button>
            )}
            <PickedComponent
              onCreated={handleCreated}
              onCancel={handleCancel}
              {...(refetch && { refetch })}
            />
          </>
        ) : (
          <VariantChooser variants={variants} onPick={(variant) => setPickedId(variant.id)} />
        )}
      </DialogContent>
    </Dialog>
  );
};
