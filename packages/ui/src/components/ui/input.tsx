import * as React from "react";

import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      // The field's own mark. The look (`styles/parts/input.css`, cascade
      // layer `ui`) hangs on it and not on `data-slot`, which a wrapper may
      // replace with its own (the sidebar's field does).
      data-ui-input=""
      // Layout and behaviour only.
      className={cn(
        "flex w-full min-w-0 disabled:pointer-events-none disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
