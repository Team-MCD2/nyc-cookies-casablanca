import type { Config } from "tailwindcss";

/**
 * NYC Cookies — Tailwind config
 * Tokens portés depuis prototype/assets/css/styles.css
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        sm: "1.5rem",
        md: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Brand surfaces
        bg: "#0a0a0a",
        surface: "#141414",
        "surface-2": "#1c1c1c",
        "surface-3": "#242424",
        border: "#2a2a2a",
        "border-strong": "#3a3a3a",
        // Brand text
        text: "#fafafa",
        "text-2": "#d4d4d4",
        "text-3": "#a3a3a3",
        "text-muted": "#737373",
        // Brand accents (cookie crust + cream)
        accent: {
          DEFAULT: "#d54a2a",
          hover: "#e75a3a",
          soft: "rgba(213, 74, 42, 0.12)",
        },
        cream: {
          DEFAULT: "#f5e6d3",
          soft: "#fbf3e7",
        },
        // Semantic
        success: "#16a34a",
        "success-soft": "rgba(22, 163, 74, 0.14)",
        warning: "#f59e0b",
        "warning-soft": "rgba(245, 158, 11, 0.14)",
        danger: "#ef4444",
        "danger-soft": "rgba(239, 68, 68, 0.14)",
        info: "#3b82f6",
        "info-soft": "rgba(59, 130, 246, 0.14)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Bebas Neue", "Anton", "Impact", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      boxShadow: {
        "elev-sm": "0 1px 2px rgba(0,0,0,0.4)",
        "elev-md": "0 4px 12px rgba(0,0,0,0.35)",
        "elev-lg": "0 12px 32px rgba(0,0,0,0.45)",
        "glow-accent": "0 0 0 1px #d54a2a, 0 8px 24px rgba(213,74,42,0.25)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms ease",
        "slide-up": "slide-up 200ms ease",
        "slide-in-right": "slide-in-right 220ms ease",
      },
    },
  },
  plugins: [],
};

export default config;
