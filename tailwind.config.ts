import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.css",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
        },
      },
      boxShadow: {
        retro: "6px 6px 0 0 var(--retro-black)",
      },
    },
  },
  plugins: [],
};
export default config;
