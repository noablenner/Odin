import type { Metadata } from "next";
import Link from "next/link";
import { Mail, LifeBuoy, FileText, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { legal, links } from "@/lib/config";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Besoin d'aide avec Odin ? Contactez notre support et consultez nos pages confidentialité et conditions.",
};

export default function SupportPage() {
  return (
    <article className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-radial-glow" />
      <Container className="relative max-w-3xl py-16 sm:py-20">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-sm">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Support &amp; contact
          </h1>
          <p className="mt-3 text-muted-foreground">
            Une question, un problème ou une demande concernant une intégration&nbsp;?
            Notre équipe est là pour vous aider.
          </p>
        </header>

        {/* Prominent support email */}
        <Card className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Email d&apos;assistance
          </p>
          <a
            href={`mailto:${legal.supportEmail}`}
            className="mt-2 inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground hover:text-primary sm:text-3xl"
          >
            <Mail className="h-6 w-6 text-primary" />
            {legal.supportEmail}
          </a>
          <p className="mt-3 text-sm text-muted-foreground">
            Nous répondons généralement sous 1 à 2 jours ouvrés.
            {/* TODO: ajuster le délai de réponse annoncé */}
          </p>
          <div className="mt-5">
            <ButtonLink href={`mailto:${legal.supportEmail}`} size="md">
              <Mail className="h-4 w-4" /> Écrire au support
            </ButtonLink>
          </div>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="font-display text-lg font-semibold">Comment obtenir de l&apos;aide</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Décrivez votre problème et, si possible, les étapes pour le reproduire.</li>
              <li>• Précisez le connecteur concerné (Airtable, Google, Microsoft…).</li>
              <li>• Indiquez l&apos;adresse e-mail de votre compte {legal.productName}.</li>
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-lg font-semibold">Gérer vos accès</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Vous pouvez révoquer un accès OAuth à tout moment depuis l&apos;onglet
              <em> Connecteurs </em> de l&apos;application, ou supprimer votre compte et
              vos données depuis <em>Paramètres</em>.
            </p>
            <ButtonLink href={links.app} variant="outline" size="sm" className="mt-4">
              Ouvrir l&apos;application
            </ButtonLink>
          </Card>
        </div>

        {/* Links to legal pages */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 border-t border-border pt-8 sm:flex-row">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ShieldCheck className="h-4 w-4" /> Politique de confidentialité
          </Link>
          <span className="hidden text-border sm:inline">·</span>
          <Link
            href="/terms"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-4 w-4" /> Conditions d&apos;utilisation
          </Link>
        </div>
      </Container>
    </article>
  );
}
