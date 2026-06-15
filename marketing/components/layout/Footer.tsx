import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { links } from "@/lib/config";

const columns = [
  {
    title: "Produit",
    items: [
      { label: "Fonctionnalités", href: "/#features" },
      { label: "Intégrations", href: "/integrations" },
      { label: "Tarifs", href: "/pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Entreprise",
    items: [
      { label: "Ouvrir l'app", href: links.app },
      { label: "Se connecter", href: links.login },
      { label: "Support", href: links.support },
      { label: "Réserver une démo", href: links.demo },
    ],
  },
  {
    title: "Légal",
    items: [
      { label: "Confidentialité", href: links.privacy },
      { label: "Conditions", href: links.terms },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background-2/40">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              L&apos;agent IA qui connaît votre entreprise et agit à votre place — sur
              tous vos canaux.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Odin — TODO: [DOMAINE]. Tous droits réservés.</p>
          <p>Conçu en Europe · Hébergement RGPD</p>
        </div>
      </Container>
    </footer>
  );
}
