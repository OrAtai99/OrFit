import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1F4E78",
          light: "#2563a8",
          dark: "#163a58",
        },
        danger: {
          DEFAULT: "#B91C1C",
          light: "#dc2626",
          dark: "#991b1b",
        },
        success: {
          DEFAULT: "#047857",
          light: "#059669",
          dark: "#065f46",
        },
        muted: "#6B7280",
        surface: {
          dark: "#1F2937",
          light: "#F5F7FA",
        },
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "Arial", "sans-serif"],
      },
      minHeight: {
        touch: "52px",
      },
    },
  },
  plugins: [],
};

export default config;
