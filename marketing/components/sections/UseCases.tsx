import { Section, SectionHeading } from "@/components/ui/Section";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { useCases } from "@/lib/content";

export function UseCases() {
  return (
    <Section id="use-cases">
      <SectionHeading
        eyebrow="Pour qui"
        title="Un agent, mille usages"
        description="Odin s'adapte à votre métier et à votre façon de travailler."
      />
      <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
        {useCases.map((u) => (
          <StaggerItem key={u.title}>
            <div className="h-full rounded-xl border border-border bg-card/70 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                {u.audience}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold">{u.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {u.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
