import { Container } from "@/components/ui/Container";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

// TODO: replace with real metrics.
const stats = [
  { value: 10, suffix: "+", label: "intégrations natives" },
  { value: 3, label: "canaux (web, WhatsApp, Telegram)" },
  { value: 24, suffix: "/7", label: "disponibilité de l'agent" },
  { value: 100, suffix: "%", label: "vos données, jamais revendues" },
];

export function Stats() {
  return (
    <section className="border-y border-border bg-background-2/30 py-14">
      <Container>
        <Stagger className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label} className="text-center">
              <p className="font-display text-4xl font-bold text-gradient sm:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
