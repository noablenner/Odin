import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { trust } from "@/lib/content";

export function TrustBar() {
  return (
    <section className="border-y border-border bg-background-2/30 py-10">
      <Container>
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {trust.label}
          </p>
        </Reveal>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-70">
          {trust.logos.map((logo) => (
            <span
              key={logo}
              className="font-display text-lg font-semibold tracking-tight text-muted-foreground"
            >
              {/* TODO: replace text with real client/press SVG logos */}
              {logo}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
