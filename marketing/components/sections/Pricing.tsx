import { Check } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { plans } from "@/lib/content";
import { links } from "@/lib/config";
import { cn } from "@/lib/utils";

export function PricingCards() {
  return (
    <Stagger className="grid items-stretch gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <StaggerItem key={plan.name}>
          <div
            className={cn(
              "relative flex h-full flex-col rounded-xl border p-7 backdrop-blur-sm",
              plan.highlighted
                ? "border-primary/50 bg-card shadow-glow-sm"
                : "border-border bg-card/70"
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white">
                Le plus populaire
              </span>
            )}
            <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">{plan.price}</span>
              {plan.period && (
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              )}
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <ButtonLink
              href={links.signup}
              variant={plan.highlighted ? "primary" : "outline"}
              size="md"
              className="mt-7 w-full"
            >
              {plan.cta}
            </ButtonLink>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function Pricing() {
  return (
    <Section id="pricing" className="bg-background-2/30">
      <SectionHeading
        eyebrow="Tarifs"
        title="Des offres simples et transparentes"
        description="Commencez gratuitement, évoluez quand vous êtes prêt. Prix indicatifs — TODO à confirmer."
      />
      <div className="mt-14">
        <PricingCards />
      </div>
    </Section>
  );
}
