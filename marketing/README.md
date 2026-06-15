# Odin — Marketing site

The public marketing site for Odin, **separate from the web app** (which lives
in `/frontend`). Built with Next.js 14 (App Router), TypeScript, Tailwind CSS
and Framer Motion.

- **Visual identity** is derived from the **NodeFlow** brand (dark, deep-violet
  background, violet→magenta gradient accent, heavy geometric display type,
  generous radii, soft purple glows).
- **Structure & narrative** are inspired by **Limova** (rewritten, original copy).

## Run locally

```bash
cd marketing
cp .env.local.example .env.local   # set NEXT_PUBLIC_APP_URL to the app
npm install
npm run dev        # http://localhost:3001
```

`npm run build` for a production build, `npm run lint` to lint.

## Design tokens (source of truth)

All colours, type, radius and shadows are defined as CSS variables in
[`app/globals.css`](./app/globals.css) and surfaced to Tailwind in
[`tailwind.config.ts`](./tailwind.config.ts). Components never use raw hex.

| Token | Dark value (HSL) | Meaning |
|-------|------------------|---------|
| `--background` | `263 45% 5%` | Deep violet-black page bg |
| `--surface` / `--surface-2` | `264 38% 9%` / `263 34% 14%` | Cards, raised surfaces |
| `--foreground` | `0 0% 100%` | Primary text |
| `--muted-foreground` | `265 18% 72%` | Secondary text |
| `--primary` | `258 90% 66%` (#8B5CF6) | Violet accent |
| `--accent` | `291 86% 55%` | Magenta |
| `--navy` | `218 48% 17%` (#16233E) | Odin logo navy |
| `--grad-from/via/to` | `#7C3AED → #A855F7 → #D426EE` | Brand gradient |
| `--radius` | `1rem` | Base corner radius |

Fonts (`next/font/google`): **Space Grotesk** (display) · **Inter** (body) ·
**JetBrains Mono** (mono). A light theme is included as a cohesive companion
using the Odin navy as foreground.

## Structure

```
app/
  layout.tsx          fonts, theme script, navbar + footer shell
  page.tsx            home (composes the sections below)
  pricing/page.tsx
  integrations/page.tsx
components/
  ui/        Logo, Button, Container, Section, Card, Badge
  layout/    Navbar, Footer, AnnouncementBar, ThemeToggle
  motion/    Reveal, Stagger (Framer Motion, reduced-motion aware)
  sections/  Hero, TrustBar, ProblemSolution, Features, HowItWorks,
             Integrations, UseCases, Pricing, Testimonials, FAQ, FinalCTA
lib/
  content.ts  ALL copy (edit here)
  config.ts   links + nav
  utils.ts
```

## TODO placeholders to fill

- `[DOMAINE]` — production domain (footer, metadata `NEXT_PUBLIC_SITE_URL`).
- Real **prices** for Free / Pro / Business (`lib/content.ts → plans`).
- Real **testimonials** (`lib/content.ts → testimonials`).
- Real **client/press logos** (`TrustBar`, integration SVGs).
- Final **logo assets**: drop `logo-odin.png` / `logo-odin-mark.png` into
  `/public` and swap `LogoMark` if you want the exact artwork (current logo is
  an on-brand SVG approximation).
- Real **phone** + **demo-booking** link (`lib/config.ts`).
- Confirm **display font** matches NodeFlow's exact typeface (Space Grotesk is
  a close, on-brand match).
