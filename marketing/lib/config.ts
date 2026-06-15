/**
 * Central site config: external links + navigation.
 * App URLs point at the Odin web app (separate from this marketing site).
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const links = {
  app: APP_URL,
  login: `${APP_URL}/auth`,
  signup: `${APP_URL}/auth`,
  dashboard: `${APP_URL}/dashboard`,
  demo: "/#contact", // TODO: replace with real demo-booking link
  phone: "tel:+33000000000", // TODO: real phone number
  // Legal / support pages (live in the app or here — TODO confirm)
  privacy: "/privacy",
  terms: "/terms",
  support: "/support",
};

export const nav = [
  { label: "Fonctionnalités", href: "/#features" },
  { label: "Intégrations", href: "/integrations" },
  { label: "Comment ça marche", href: "/#how" },
  { label: "Tarifs", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
];
