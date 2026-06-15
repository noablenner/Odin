import type { Config } from "tailwindcss";

/**
 * Odin marketing — design tokens.
 *
 * Visual identity is derived from the NodeFlow site (dark, deep-violet
 * background with a violet→magenta gradient accent, heavy geometric display
 * type, generous radii and soft purple glows). All colours are exposed as CSS
 * variables in globals.css and consumed here so the whole site stays on-token.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        "background-2": "hsl(var(--background-2))",
        surface: "hsl(var(--surface))",
        "surface-2": "hsl(var(--surface-2))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        card: "hsl(var(--card))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        navy: "hsl(var(--navy))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "var(--radius)",
        lg: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 8px)",
        sm: "calc(var(--radius) - 12px)",
      },
      boxShadow: {
        glow: "0 0 60px -12px hsl(var(--primary) / 0.55)",
        "glow-sm": "0 0 30px -8px hsl(var(--primary) / 0.5)",
        card: "0 1px 0 0 hsl(var(--border)) inset, 0 20px 50px -30px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(110deg, hsl(var(--grad-from)), hsl(var(--grad-via)) 50%, hsl(var(--grad-to)))",
        "radial-glow":
          "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.22), transparent 70%)",
        grid: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
      },
      backgroundSize: { grid: "56px 56px" },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        shimmer: { to: { backgroundPosition: "200% center" } },
        marquee: { to: { transform: "translateX(-50%)" } },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
