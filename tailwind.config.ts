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
          base: "#F3F4F6",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E5E7EB",
        },
        accent: {
          green: "#4CAF6A",
          "green-dim": "#3d9959",
          purple: "#2F343A",
          "purple-dim": "#1a1e22",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(76,175,106,0.08), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
