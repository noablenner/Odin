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

/**
 * Legal / company info used by the /privacy, /terms and /support pages.
 * TODO: replace the placeholder values before submitting OAuth apps
 * (Airtable / Google / Microsoft) for review.
 */
export const legal = {
  productName: "Odin",
  // TODO: domaine de production du site
  domain: "https://[VOTRE-DOMAINE]",
  // TODO: entité légale exploitant Odin
  legalEntity: "[ENTITÉ LÉGALE — à compléter]",
  // TODO: adresse postale de l'entité
  address: "[ADRESSE POSTALE — à compléter]",
  // TODO: email d'assistance RÉEL (exigé par Airtable/Google/Microsoft)
  supportEmail: "support@[VOTRE-DOMAINE]",
  // TODO: email dédié aux demandes RGPD (peut être identique au support)
  privacyEmail: "privacy@[VOTRE-DOMAINE]",
  lastUpdated: "15 juin 2026",
};

export const nav = [
  { label: "Fonctionnalités", href: "/#features" },
  { label: "Intégrations", href: "/integrations" },
  { label: "Comment ça marche", href: "/#how" },
  { label: "Tarifs", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
];
