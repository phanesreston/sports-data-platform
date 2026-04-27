import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#080810",
          surface: "#0f0f1a",
          card: "#13131e",
          border: "#1c1c2e",
        },
        accent: {
          green: "#22c55e",
          "green-dim": "#16a34a",
          purple: "#818cf8",
          "purple-dim": "#4f46e5",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,197,94,0.15), transparent)",
      },
      animation: {
        marquee: "marquee 50s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
