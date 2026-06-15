import { Section, SectionHeading } from "@/components/ui/Section";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { steps } from "@/lib/content";

export function HowItWorks() {
  return (
    <Section id="how">
      <SectionHeading
        eyebrow="Comment ça marche"
        title="Opérationnel en 4 étapes"
        description="De l'inscription au déploiement multi-canal, sans intervention technique."
      />
      <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <StaggerItem key={s.n}>
            <div className="relative h-full rounded-xl border border-border bg-card/70 p-6 backdrop-blur-sm">
              <span className="font-display text-4xl font-bold text-gradient">{s.n}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
              {i < steps.length - 1 && (
                <span className="absolute right-5 top-7 hidden h-px w-8 bg-gradient-to-r from-primary/60 to-transparent lg:block" />
              )}
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
