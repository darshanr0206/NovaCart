import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NovaCart palette — white / off-white / soft gray / dark gray-black, blue accent used sparingly.
        cream: "#FAFAF8",
        surface: "#FFFFFF",
        mist: "#F3F4F6",
        ink: "#161618",
        graphite: "#4B4B4F",
        line: "#E7E7E9",
        nova: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,22,24,0.04), 0 8px 24px -12px rgba(22,22,24,0.10)",
        elevated: "0 20px 60px -20px rgba(22,22,24,0.25)",
      },
      maxWidth: {
        content: "1280px",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
