import { useEffect, RefObject } from "react";

/**
 * Custom hook that handles clicks outside specified elements
 * Only triggers the callback when clicking outside ALL of the provided refs
 */
export function useClickOutside(refs: RefObject<HTMLElement | null>[], handler: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If the click is inside a sidebar portal element, do nothing
      if ((event.target as HTMLElement).closest(".sidebar-portal-inside")) return;

      // Check if the click is outside all of the provided refs
      const isOutsideAll = refs.every(
        (ref) => !ref.current || !ref.current.contains(event.target as Node)
      );

      if (isOutsideAll) {
        handler();
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Remove event listener on cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [refs, handler]);
}
