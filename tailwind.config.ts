import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marca Suplevet — hex exactos del manual (PLAN.md sección 2)
        navy: "#253C61",
        sky: "#99D3DA",
        "vitality-orange": "#EA8C43",
        "soft-gray": "#F2F2F2",

        // Tokens semánticos de shadcn/ui (mapeados a CSS variables en globals.css)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // Manier Bold: fuente de marca aun pendiente de recibir los archivos reales
        // (no está en Google Fonts, ver pendiente operativo). Fallback temporal: Fraunces.
        display: ["var(--font-display)", "Georgia", "serif"],
        impact: ["var(--font-impact)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        lg: "2rem",
        xl: "3rem",
        DEFAULT: "1rem",
        sm: "0.5rem",
      },
      spacing: {
        gutter: "24px",
        "mobile-margin": "20px",
        "section-y": "100px",
      },
      maxWidth: {
        container: "1280px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
