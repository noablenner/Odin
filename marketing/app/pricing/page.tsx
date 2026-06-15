import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/Section";
import { PricingCards } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Des offres simples et transparentes. Commencez gratuitement.",
};

export default function PricingPage() {
  return (
    <>
      <Section className="pt-16">
        <SectionHeading
          eyebrow="Tarifs"
          title="Choisissez votre plan"
          description="Commencez gratuitement, évoluez quand vous êtes prêt. Prix indicatifs — TODO à confirmer."
        />
        <div className="mt-14">
          <PricingCards />
        </div>
      </Section>
      <FAQ />
      <FinalCTA />
    </>
  );
}
