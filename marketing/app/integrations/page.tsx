import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/Section";
import { IntegrationsGrid } from "@/components/sections/Integrations";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FinalCTA } from "@/components/sections/FinalCTA";

export const metadata: Metadata = {
  title: "Intégrations",
  description:
    "Connectez Airtable, Google Drive, Gmail, Sheets, Outlook, Excel, WhatsApp, Telegram et vos API REST.",
};

export default function IntegrationsPage() {
  return (
    <>
      <Section className="pt-16">
        <SectionHeading
          eyebrow="Intégrations"
          title="Branchez vos outils à Odin"
          description="Chaque compte se connecte via OAuth. L'agent lit vos données et agit pour vous, en toute sécurité."
        />
        <div className="mx-auto mt-12 max-w-4xl">
          <IntegrationsGrid />
        </div>
      </Section>
      <HowItWorks />
      <FinalCTA />
    </>
  );
}
