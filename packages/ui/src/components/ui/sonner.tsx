import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useThemeMode } from "../theme-mode/theme-mode-context";

/**
 * The toast parts and the `data-slot` each one gets. sonner renders them
 * itself and offers no way to pass attributes, only class names, so the
 * slots are stamped onto its elements (found through sonner's own marks).
 */
const TOAST_SLOTS: readonly (readonly [selector: string, slot: string])[] = [
  ["[data-sonner-toaster]", "sonner-toaster"],
  ["[data-sonner-toast]", "sonner-toast"],
  ["[data-sonner-toast] [data-icon]", "sonner-icon"],
  ["[data-sonner-toast] [data-content]", "sonner-content"],
  ["[data-sonner-toast] [data-title]", "sonner-title"],
  ["[data-sonner-toast] [data-description]", "sonner-description"],
  ["[data-sonner-toast] [data-button]:not([data-cancel])", "sonner-action"],
  ["[data-sonner-toast] [data-button][data-cancel]", "sonner-cancel"],
  ["[data-sonner-toast] [data-close-button]", "sonner-close"],
];

function stampToastSlots(root: Element) {
  for (const [selector, slot] of TOAST_SLOTS) {
    for (const element of root.querySelectorAll(selector)) {
      if (element.getAttribute("data-slot") !== slot) element.setAttribute("data-slot", slot);
    }
  }
}

const Toaster = ({ ...props }: ToasterProps) => {
  // Follows the appearance axis (ThemeModeProvider); sonner understands
  // "system" itself. A provider-less render falls back to "system".
  const { theme } = useThemeMode();

  // Toasts come and go, so the slots are stamped whenever sonner changes its
  // list. The observer runs before the next paint, and React leaves
  // attributes it did not render alone.
  const sectionRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    stampToastSlots(section);
    const observer = new MutationObserver(() => stampToastSlots(section));
    observer.observe(section, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
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
      {...(props as any)}
      ref={sectionRef}
    />
  );
};

export { Toaster };
