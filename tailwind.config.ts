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
        brand: {
          primary: "var(--brand-primary, #0f172a)",
          "primary-hover": "var(--brand-primary-hover, #1e293b)",
          accent: "var(--brand-accent, #059669)",
          "accent-light": "var(--brand-accent-light, #ecfdf5)",
          surface: "var(--brand-surface, #ffffff)",
        },
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        "2xl": "1rem",
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
