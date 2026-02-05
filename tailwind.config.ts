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
        primary: {
          DEFAULT: "#4B0082", // Indigo
          light: "#5D3FD3", // Royal Purple
          dark: "#310054",
        },
        accent: {
          DEFAULT: "#D4AF37", // Gold
          light: "#FFD700", // Warm Amber
        },
        background: {
          DEFAULT: "#0A001F", // Dark Navy
          alt: "#0F0523", // Near-black
        },
        foreground: {
          DEFAULT: "#F0F0FF", // Soft White
          muted: "#D7D4E6", // Light Lavender-gray
        },
        secondary: {
          DEFAULT: "#40E0D0", // Teal
          alt: "#00CED1", // Cyan
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        script: ["var(--font-great-vibes)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
