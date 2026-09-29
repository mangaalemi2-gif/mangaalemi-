import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--c-bg) / <alpha-value>)",
        foreground: "rgb(var(--c-fg) / <alpha-value>)",
        primary: "#39FF14", // Neon Green
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-light": "rgb(var(--c-slight) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
export default config;
