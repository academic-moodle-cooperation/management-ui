import { Check, Loader2, Palette, X } from "lucide-react";
import React from "react";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@oc-mui/ui/components";

import type { ThemeDefinition } from "../services/themes";

export interface ThemeModalProps {
  theme: ThemeDefinition | null;
  isInstalled: boolean;
  isLoading: boolean;
  onClose: () => void;
  onPreview: () => void;
  onApply: () => void;
  onRemove: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  theme,
  isInstalled,
  isLoading,
  onClose,
  onPreview,
  onApply,
  onRemove,
}) => (
  <Dialog
    open={theme !== null}
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  >
    {theme ? (
      <DialogContent key={theme.id} showCloseButton={false} className="gap-0 sm:max-w-lg">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>

        <DialogHeader className="gap-4 pr-10 text-left sm:text-left">
          <div className="flex items-start gap-3">
            <div
              className={`flex shrink-0 rounded-lg p-2.5 ${
                isInstalled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <Palette className="h-5 w-5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <DialogTitle className="text-lg font-semibold leading-tight">{theme.name}</DialogTitle>
              <div
                className={`flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 ${
                  isInstalled ? "border-emerald-500/40 bg-emerald-500/20" : "border-transparent bg-muted"
                }`}
                aria-hidden
                title={isInstalled ? "Theme active" : "Theme inactive"}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full bg-background shadow transition-[margin] duration-200 ${
                    isInstalled ? "ml-auto" : "mr-auto"
                  }`}
                >
                  {isInstalled ? <Check className="h-3 w-3 text-emerald-600" strokeWidth={2.5} /> : null}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {theme.category}
            </Badge>
            <span className="text-xs text-muted-foreground">by {theme.author}</span>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-foreground">
            {theme.description}
          </DialogDescription>
        </div>

        <DialogFooter className="mt-6 gap-2 sm:justify-end">
          {isInstalled ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemove}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Remove
                </>
              ) : (
                "Remove"
              )}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onPreview} disabled={isLoading}>
                Preview
              </Button>
              <Button type="button" variant="default" onClick={onApply} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Apply
                  </>
                ) : (
                  "Apply"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    ) : null}
  </Dialog>
);
