import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { trust } from "@/lib/content";

export function TrustBar() {
  // Duplicate the logo list so the marquee loops seamlessly.
  const row = [...trust.logos, ...trust.logos];

  return (
    <section className="border-y border-border bg-background-2/30 py-10">
      <Container>
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {trust.label}
          </p>
        </Reveal>
      </Container>
      <div className="marquee-mask mt-7 overflow-hidden">
        <div className="marquee-track gap-12 px-6">
          {row.map((logo, i) => (
            <span
              key={`${logo}-${i}`}
              className="shrink-0 font-display text-lg font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {/* TODO: replace text with real client/press SVG logos */}
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
