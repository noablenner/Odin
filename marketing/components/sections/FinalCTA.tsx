import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { LogoMark } from "@/components/ui/Logo";
import { finalCta } from "@/lib/content";
import { links } from "@/lib/config";

export function FinalCTA() {
  return (
    <section id="contact" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
      <Container className="relative">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-primary/30 bg-surface/50 p-10 text-center backdrop-blur-md sm:p-16">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
            <LogoMark className="relative mx-auto mb-6 h-14 w-14 animate-float" />
            <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {finalCta.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg">
              {finalCta.subtitle}
            </p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href={links.signup} size="lg">
                {finalCta.cta} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={links.demo} variant="outline" size="lg">
                {finalCta.secondary}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
