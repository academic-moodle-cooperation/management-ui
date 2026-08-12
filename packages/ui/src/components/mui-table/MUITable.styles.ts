import { cva } from "class-variance-authority";

const wrapper = cva(["w-full", "overflow-auto", "border-collapse"], {
  variants: {
    borderStyle: {
      dashed: ["border-dashed"],
      solid: ["border-solid"],
    },
    outerBorders: {
      true: ["border", "border-border"],
      false: [],
    },
    radius: {
      none: ["rounded-none"],
      sm: ["rounded-sm"],
      base: ["rounded"],
      md: ["rounded-md"],
      lg: ["rounded-lg"],
    },
  },
});

const table = cva([], {
  variants: {
    radius: {
      none: [],
      sm: [],
      base: [],
      md: [],
      lg: [],
    },
    size: {
      sm: ["text-sm"],
      md: ["text-base"],
      lg: ["text-lg"],
    },
  },
});

const thead = cva([], {
  variants: {
    borderStyle: {
      dashed: ["border-dashed"],
      solid: ["border-solid"],
    },
    size: {
      sm: ["text-xs"],
      md: ["text-sm"],
      lg: ["text-base"],
    },
    headerBorders: {
      true: ["border-b", "border-border"],
      false: [],
    },
    headerColor: {
      gray: ["hover:bg-accent", "bg-accent/80"],
    },
  },
});

const tbody = cva(["font-normal", "text-foreground"], {
  variants: {
    borderStyle: {
      dashed: ["divide-dashed"],
      solid: ["divide-solid"],
    },
    size: {
      xs: ["text-xs"],
      sm: ["text-sm"],
      md: ["text-base"],
      lg: ["text-lg"],
    },
    horizontalBorders: {
      true: ["divide-y", "divide-border"],
    },
  },
});

const tfoot = cva(["text-muted-foreground"], {
  variants: {
    borderStyle: {
      dashed: ["border-dashed"],
      solid: ["border-solid"],
    },
    size: {
      sm: ["text-xs"],
      md: ["text-sm"],
      lg: ["text-base"],
    },
    footerBorders: {
      true: ["border-t", "border-border"],
      false: [],
    },
  },
});

const tr = cva([], {
  variants: {
    borderStyle: {
      dashed: ["divide-dashed"],
      solid: ["divide-solid"],
    },
    verticalBorders: {
      true: ["divide-x", "divide-border"],
      false: [],
    },
    hoverable: {
      true: [],
      false: [],
    },
    striped: {
      true: [],
      false: [],
    },
    stripePosition: {
      even: [],
      odd: [],
    },
    color: {
      none: [],
      white: ["bg-white"],
      blue: ["bg-info/15", "text-info"],
      red: ["bg-error/15", "text-error"],
      green: ["bg-ok/15", "text-ok"],
      yellow: ["bg-warning/15", "text-warning-foreground"],
      // eslint-disable-next-line local/no-palette-classes -- variant is NAMED after a fixed color; no semantic token equivalent, removing it breaks the exported variant type. Revisit if a consumer appears (#297).
      purple: ["bg-purple-50", "text-purple-800"],
      gray: ["bg-muted", "text-foreground"],
      // eslint-disable-next-line local/no-palette-classes -- variant is NAMED after a fixed color; no semantic token equivalent, removing it breaks the exported variant type. Revisit if a consumer appears (#297).
      dark: ["bg-gray-600", "text-white"],
      // eslint-disable-next-line local/no-palette-classes -- variant is NAMED after a fixed color; no semantic token equivalent, removing it breaks the exported variant type. Revisit if a consumer appears (#297).
      black: ["bg-gray-900", "text-white"],
    },
  },
  compoundVariants: [
    {
      color: "none",
      stripePosition: "even",
      striped: true,
      className: ["even:bg-muted/50"],
    },
    {
      color: "none",
      stripePosition: "odd",
      striped: true,
      className: ["odd:bg-muted/50"],
    },
    {
      color: ["none", "white"],
      hoverable: true,
      className: ["hover:bg-accent"],
    },
    {
      color: "blue",
      hoverable: true,
      className: ["hover:bg-info/25"],
    },
    {
      color: "red",
      hoverable: true,
      className: ["hover:bg-error/25"],
    },
    {
      color: "green",
      hoverable: true,
      className: ["hover:bg-ok/25"],
    },
    {
      color: "yellow",
      hoverable: true,
      className: ["hover:bg-warning/25"],
    },
    {
      color: "purple",
      hoverable: true,
      // eslint-disable-next-line local/no-palette-classes -- variant is NAMED after a fixed color; no semantic token equivalent, removing it breaks the exported variant type. Revisit if a consumer appears (#297).
      className: ["hover:bg-purple-100"],
    },
    {
      color: "gray",
      hoverable: true,
      className: ["hover:bg-accent"],
    },
    {
      color: "dark",
      hoverable: true,
      // eslint-disable-next-line local/no-palette-classes -- variant is NAMED after a fixed color; no semantic token equivalent, removing it breaks the exported variant type. Revisit if a consumer appears (#297).
      className: ["hover:bg-gray-700"],
    },
    {
      color: "black",
      hoverable: true,
      className: ["hover:bg-black"],
    },
  ],
});

const td = cva(["[&[align=center]]:text-center", "[&[align=right]]:text-right"], {
  variants: {
    size: {
      sm: ["p-1"],
      md: ["p-2"],
      lg: ["p-2.5"],
    },
  },
});

const th = cva(["font-medium", "[&[align=center]]:text-center", "[&[align=right]]:text-right"], {
  variants: {
    size: {
      sm: ["p-1"],
      md: ["p-2"],
      lg: ["p-2.5"],
      xl: ["p-3"],
    },
  },
});

const tableStyles = {
  wrapper,
  table,
  tbody,
  tfoot,
  thead,
  tr,
  td,
  th,
};

export { tableStyles };
