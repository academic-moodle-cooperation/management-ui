import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";
import { shadcnPlugin } from "./shadcn-plugin";

export const shadcnPreset: Config = {
  content: [],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        "bouncing-loader": {
          from: { opacity: "1", transform: "translate3d(0, 0, 0)" },
          to: { opacity: "0.1", transform: "translate3d(0, -1rem, 0)" },
        },
      },
      animation: {
        "bouncing-loader": "bouncing-loader 0.6s infinite alternate",
      },
    },
  },
  plugins: [shadcnPlugin, animatePlugin],
};
