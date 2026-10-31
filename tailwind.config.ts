import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg-rgb) / <alpha-value>)",
        "bg-secondary": "rgb(var(--color-bg-secondary-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-surface-rgb) / <alpha-value>)",
        "surface-hover": "rgb(var(--color-surface-hover-rgb) / <alpha-value>)",
        border: "var(--color-border)",
        primary: { DEFAULT: "rgb(var(--color-text-primary-rgb) / <alpha-value>)", muted: "rgb(var(--color-text-secondary-rgb) / <alpha-value>)" },
        accent: { DEFAULT: "rgb(var(--color-accent-rgb) / <alpha-value>)", soft: "rgb(var(--color-accent-soft-rgb) / <alpha-value>)" },
        warm: "rgb(var(--color-warm-rgb) / <alpha-value>)",
        success: "rgb(var(--color-success-rgb) / <alpha-value>)",
        error: "rgb(var(--color-error-rgb) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-inter)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "20px",
        "card-sm": "14px"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(155,203,255,0.14), 0 20px 60px -20px rgba(155,203,255,0.18)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 16px 40px -16px rgba(0,0,0,0.5)"
      },
      backdropBlur: {
        xs: "2px"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 2.4s linear infinite",
        scan: "scan 3.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
