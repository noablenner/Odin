import { Container } from "@/components/ui/Container";
import { legal } from "@/lib/config";

/** Shared shell for the /privacy, /terms and /support pages. */
export function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-radial-glow" />
      <Container className="relative max-w-3xl py-16 sm:py-20">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-3 text-muted-foreground">{intro}</p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Dernière mise à jour : {legal.lastUpdated}
          </p>
        </header>
        <div className="prose-odin">{children}</div>
      </Container>
    </article>
  );
}
