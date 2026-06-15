/**
 * All marketing copy lives here — original Odin content, written to mirror the
 * narrative rhythm of the Limova reference without reusing its wording.
 * Placeholders that need real data are tagged with TODO.
 */
import {
  Brain,
  Plug,
  MessagesSquare,
  SlidersHorizontal,
  Cpu,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const hero = {
  badge: "Noté 4,9/5 — TODO: avis vérifiés",
  title: ["Un agent IA qui connaît", "toute votre entreprise."],
  subtitle:
    "Odin se branche sur vos outils, apprend vos documents et répond à votre place — sur le web, WhatsApp et Telegram. Sans une ligne de code.",
  examplePrompt: "Résume les factures impayées de ce mois et relance les clients",
  ctaPrimary: "Commencer gratuitement",
  ctaSecondary: "Réserver une démo",
};

export const trust = {
  label: "Conçu pour les entreprises qui veulent agir, pas configurer",
  // TODO: replace with real client / press logos
  logos: ["TechCrunch", "Les Échos", "Maddyness", "BFM Business", "Product Hunt", "La French Tech"],
};

export const problemSolution = {
  eyebrow: "Le problème",
  problemTitle: "Vos données sont partout. Vos réponses, nulle part.",
  problems: [
    "Vos informations sont éclatées entre la messagerie, le drive, la compta et dix autres outils.",
    "Les assistants IA génériques ne connaissent rien à votre entreprise.",
    "Automatiser demande des intégrations techniques que vous n'avez pas le temps de mettre en place.",
  ],
  solutionTitle: "Odin centralise tout et agit pour vous.",
  solution:
    "Connectez vos comptes, importez vos documents : Odin devient un collaborateur qui connaît votre contexte et exécute vos demandes en langage naturel.",
};

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: Brain,
    title: "Mémoire & RAG",
    description:
      "Importez vos documents : Odin les lit, les structure et répond à partir de vos données, en citant ses sources.",
  },
  {
    icon: Plug,
    title: "Connecteurs natifs",
    description:
      "Airtable, Google Drive, Gmail, Sheets, Outlook, Excel — plus les API REST et webhooks. Chaque compte se branche via OAuth.",
  },
  {
    icon: MessagesSquare,
    title: "Multi-canal",
    description:
      "Le même agent répond depuis le chat web, WhatsApp et Telegram. Une seule intelligence, partout où vous êtes.",
  },
  {
    icon: SlidersHorizontal,
    title: "Agent personnalisable",
    description:
      "Nom, personnalité, instructions, base de connaissances : façonnez un agent qui parle comme votre entreprise.",
  },
  {
    icon: Cpu,
    title: "Modèle choisi automatiquement",
    description:
      "Odin sélectionne le bon modèle selon la tâche — rapide et économique au quotidien, plus puissant quand il le faut. Aucun réglage technique.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité & RGPD",
    description:
      "Identifiants chiffrés, accès cloisonné par compte, hébergement européen. Vos données restent les vôtres.",
  },
];

export const steps = [
  {
    n: "01",
    title: "Créez votre compte",
    description: "Inscription en moins d'une minute. Aucune carte requise pour démarrer.",
  },
  {
    n: "02",
    title: "Configurez votre agent",
    description: "Donnez-lui un nom, une personnalité et vos instructions métier.",
  },
  {
    n: "03",
    title: "Connectez vos outils",
    description: "Branchez vos comptes en OAuth et importez vos documents clés.",
  },
  {
    n: "04",
    title: "Déployez partout",
    description: "Activez le web, WhatsApp et Telegram. Votre agent est opérationnel.",
  },
];

export const integrations = [
  { name: "Airtable", live: true },
  { name: "Google Drive", live: true },
  { name: "Gmail", live: true },
  { name: "Google Sheets", live: true },
  { name: "Microsoft Outlook", live: true },
  { name: "Excel Online", live: true },
  { name: "WhatsApp", live: true },
  { name: "Telegram", live: true },
  { name: "API REST", live: true },
  { name: "Webhooks", live: true },
  { name: "Slack", live: false },
  { name: "Notion", live: false },
];

export const useCases = [
  {
    audience: "Dirigeants de TPE/PME",
    title: "Votre bras droit opérationnel",
    description:
      "Relances clients, synthèses, rédaction, suivi des tâches — déléguez le répétitif et gardez la vue d'ensemble.",
  },
  {
    audience: "Équipes commerciales",
    title: "Le CRM qui parle",
    description:
      "Interrogez vos données de vente, préparez vos rendez-vous et envoyez vos suivis depuis une simple conversation.",
  },
  {
    audience: "Support & opérations",
    title: "Des réponses sourcées, 24/7",
    description:
      "Odin répond aux questions à partir de votre documentation interne, avec les sources, sur le canal du client.",
  },
];

export interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const plans: Plan[] = [
  {
    name: "Free",
    price: "0 €", // TODO: confirm pricing
    period: "/ mois",
    tagline: "Pour tester Odin sur un cas d'usage.",
    features: [
      "1 agent personnalisable",
      "Chat web",
      "100 messages / mois",
      "Mémoire jusqu'à 20 documents",
    ],
    cta: "Commencer",
  },
  {
    name: "Pro",
    price: "49 €", // TODO: confirm pricing
    period: "/ mois",
    tagline: "Pour les indépendants et petites équipes.",
    features: [
      "Agent illimité en messages",
      "Web + WhatsApp + Telegram",
      "Tous les connecteurs",
      "Mémoire étendue + citations",
      "Sélection auto du modèle",
    ],
    cta: "Essayer Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "Sur devis", // TODO: confirm pricing
    period: "",
    tagline: "Pour les entreprises avec des besoins avancés.",
    features: [
      "Plusieurs agents & espaces",
      "Connecteurs API & webhooks dédiés",
      "Onboarding accompagné",
      "Support prioritaire",
      "Conformité & SSO (à venir)",
    ],
    cta: "Nous contacter",
  },
];

export const testimonials = [
  // TODO: replace with real verified testimonials
  {
    quote:
      "Odin a remplacé les allers-retours entre cinq outils. Je pose une question, j'ai la réponse — avec les sources.",
    name: "Placeholder — Dirigeante",
    role: "PME services",
    initials: "PD",
  },
  {
    quote:
      "La configuration a pris dix minutes. L'agent connaît nos process mieux que certains nouveaux arrivants.",
    name: "Placeholder — Responsable ops",
    role: "Agence",
    initials: "RO",
  },
  {
    quote:
      "Pouvoir piloter l'agent depuis WhatsApp a tout changé pour mon équipe terrain.",
    name: "Placeholder — Directeur commercial",
    role: "Distribution",
    initials: "DC",
  },
];

export const faqs = [
  {
    q: "Faut-il savoir coder pour utiliser Odin ?",
    a: "Non. Vous connectez vos outils en quelques clics via OAuth et configurez l'agent en langage naturel. Aucune compétence technique n'est requise.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Oui. Les identifiants de connexion sont chiffrés, chaque compte est cloisonné, et vos documents ne servent qu'à répondre à vos propres demandes.",
  },
  {
    q: "Quels outils puis-je connecter ?",
    a: "Airtable, Google Drive, Gmail, Google Sheets, Microsoft Outlook et Excel Online, ainsi que n'importe quelle API REST ou webhook. D'autres connecteurs arrivent régulièrement.",
  },
  {
    q: "Comment Odin choisit-il son modèle d'IA ?",
    a: "Automatiquement. Odin évalue chaque demande et utilise un modèle rapide et économique pour le quotidien, et un modèle plus puissant pour les tâches complexes — sans aucun réglage de votre part.",
  },
  {
    q: "Sur quels canaux l'agent répond-il ?",
    a: "Sur le chat web de la plateforme, ainsi que sur WhatsApp et Telegram une fois ces canaux activés. C'est le même agent, avec la même mémoire, partout.",
  },
  {
    q: "Puis-je essayer gratuitement ?",
    a: "Oui, l'offre Free vous permet de tester Odin sans carte bancaire. Vous passez à un plan supérieur quand vous êtes prêt.",
  },
];

export const finalCta = {
  title: "Donnez à votre entreprise un agent qui agit.",
  subtitle: "Connectez vos outils, importez vos documents, et laissez Odin faire le reste.",
  cta: "Commencer gratuitement",
  secondary: "Réserver une démo",
};
