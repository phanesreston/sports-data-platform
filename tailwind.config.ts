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
          base: "#05091c",
          surface: "#080f23",
          card: "#0c1529",
          border: "#172034",
        },
        accent: {
          green: "#60a5fa",
          "green-dim": "#3b82f6",
          purple: "#a78bfa",
          "purple-dim": "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(96,165,250,0.12), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
