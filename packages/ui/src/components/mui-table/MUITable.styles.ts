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
      blue: ["bg-blue-50", "text-blue-800"],
      red: ["bg-red-50", "text-red-800"],
      green: ["bg-green-50", "text-green-800"],
      yellow: ["bg-yellow-50", "text-yellow-800"],
      purple: ["bg-purple-50", "text-purple-800"],
      gray: ["bg-gray-50", "text-gray-800"],
      dark: ["bg-gray-600", "text-white"],
      black: ["bg-gray-900", "text-white"],
    },
  },
  compoundVariants: [
    {
      color: "none",
      stripePosition: "even",
      striped: true,
      className: ["even:bg-gray-50"],
    },
    {
      color: "none",
      stripePosition: "odd",
      striped: true,
      className: ["odd:bg-gray-50"],
    },
    {
      color: ["none", "white"],
      hoverable: true,
      className: ["hover:bg-gray-100"],
    },
    {
      color: "blue",
      hoverable: true,
      className: ["hover:bg-blue-100"],
    },
    {
      color: "red",
      hoverable: true,
      className: ["hover:bg-red-100"],
    },
    {
      color: "green",
      hoverable: true,
      className: ["hover:bg-green-100"],
    },
    {
      color: "yellow",
      hoverable: true,
      className: ["hover:bg-yellow-100"],
    },
    {
      color: "purple",
      hoverable: true,
      className: ["hover:bg-purple-100"],
    },
    {
      color: "gray",
      hoverable: true,
      className: ["hover:bg-gray-100"],
    },
    {
      color: "dark",
      hoverable: true,
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
