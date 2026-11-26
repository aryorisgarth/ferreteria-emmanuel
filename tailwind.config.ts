import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1E293B",
          slate: "#334155",
          slateBlue: "#3E4A62",
          mist: "#475569",
          yellow: "var(--theme-primary, #FDD825)",
          yellowDark: "var(--theme-primary-hover, #EAB308)",
          bright: "var(--theme-accent-light, #FEF08A)",
          dark: "#0F172A",
          paper: "#F8FAFC",
          apple: "#F5F5F7",
        },
        theme: {
          primary: "var(--theme-primary, #FDD825)",
          hover: "var(--theme-primary-hover, #EAB308)",
          contrast: "var(--theme-primary-contrast, #0F172A)",
          light: "var(--theme-accent-light, #FEF9C3)",
          border: "var(--theme-accent-border, #FDE047)",
          ring: "var(--theme-ring, rgba(234, 179, 8, 0.35))",
        },
      },
      fontFamily: {
        display: ["Manrope", "Segoe UI", "sans-serif"],
        body: ["Manrope", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        apple: "0.375rem",
        enterprise: "0.375rem",
        "enterprise-sm": "0.25rem",
        "enterprise-md": "0.375rem",
        "enterprise-lg": "0.5rem",
      },
      boxShadow: {
        apple: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        enterprise: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
