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
        background: "#000000", // OLED Black
        foreground: "#ffffff",
        primary: "#39FF14", // Neon Green
        accent: "#9D00FF", // Neon Purple
        surface: "#121212",
        "surface-light": "#1E1E1E",
      },
    },
  },
  plugins: [],
};
export default config;
