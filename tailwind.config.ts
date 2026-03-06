import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#DA2037", // FlameCore
        secondary: "#F9C972", // GoldenSpark
        accent: "#F56F10", // SolarBurst
        warning: "#E64C2B", // HeatPulse
        white: "#FFFFFF", // PureWhite
      },
      fontFamily: {
        geist: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        "geist-mono": ["var(--font-geist-mono)", "monospace"],
        "geist-pixel": ["var(--font-geist-pixel)", "system-ui", "sans-serif"],
      },
    },
  },
  darkMode: "class",
};

export default config;

