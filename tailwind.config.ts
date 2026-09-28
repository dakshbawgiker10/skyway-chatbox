import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#050408",
          900: "#090712",
          850: "#0e0b1c",
          800: "#130f24",
          750: "#191430",
          700: "#1f1a3a",
          600: "#2d2650",
          500: "#3e366a",
        },
        navy: {
          50: "#f0f4f8",
          100: "#d9e4ef",
          200: "#b3c9de",
          300: "#7fa3c4",
          400: "#4d7aa3",
          500: "#355d86",
          600: "#27496c",
          700: "#1e3a56",
          800: "#162c42",
          900: "#0d1b2a",
          950: "#07111a",
        },
        amber: {
          400: "#f5c518",
          500: "#e0b000",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        bubble: "0 1px 2px rgba(13, 27, 42, 0.08), 0 8px 24px rgba(13, 27, 42, 0.06)",
        "purple-glow-sm": "0 0 15px -3px rgba(168, 85, 247, 0.25)",
        "purple-glow": "0 0 30px -5px rgba(168, 85, 247, 0.3)",
        "purple-glow-lg": "0 0 50px -10px rgba(168, 85, 247, 0.4)",
        "purple-glow-xl": "0 0 80px -15px rgba(168, 85, 247, 0.35)",
        "glass-inset": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
