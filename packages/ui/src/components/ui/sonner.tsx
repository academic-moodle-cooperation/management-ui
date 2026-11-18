import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { cn } from "../../lib/utils";
import { useThemeMode } from "../theme-mode/theme-mode-context";

/**
 * Fixed class names for the toaster and the parts of a toast, as handles for
 * theme CSS.
 *
 * This is the one exception to "every part of a base component has a
 * `data-slot`": sonner renders the toast itself and accepts class names for
 * its parts, but no attributes. The names carry no styling of their own.
 */
const TOASTER_CLASS = "sonner-toaster";
const TOAST_CLASSES = {
  toast: "sonner-toast",
  icon: "sonner-icon",
  content: "sonner-content",
  title: "sonner-title",
  description: "sonner-description",
  actionButton: "sonner-action",
  cancelButton: "sonner-cancel",
  closeButton: "sonner-close",
} as const;

const Toaster = (props: ToasterProps) => {
  // Follows the appearance axis (ThemeModeProvider); sonner understands
  // "system" itself. A provider-less render falls back to "system".
  const { theme } = useThemeMode();

  // A caller's class names for the toast parts are added to the fixed ones.
  // A caller's `className` replaces "toaster group", as it always did; the
  // fixed name stays.
  const { className, toastOptions, ...rest } = props;
  const classNames: Record<string, string | undefined> = { ...toastOptions?.classNames };
  for (const [part, name] of Object.entries(TOAST_CLASSES)) {
    classNames[part] = cn(name, classNames[part]);
  }

  return (
    <Sonner
      theme={theme}
      className={cn(className ?? "toaster group", TOASTER_CLASS)}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...(rest as any)}
      toastOptions={{ ...toastOptions, classNames }}
    />
  );
};

export { Toaster };
