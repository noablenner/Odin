import { Plug } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { LogoMark } from "@/components/ui/Logo";
import { integrations } from "@/lib/content";
import { cn } from "@/lib/utils";

export function IntegrationsGrid() {
  return (
    <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {integrations.map((it) => (
        <StaggerItem key={it.name}>
          <div
            className={cn(
              "flex h-full items-center gap-3 rounded-xl border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors",
              it.live ? "hover:border-primary/40" : "opacity-60"
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2/70 text-muted-foreground">
              {/* TODO: replace with each provider's official SVG logo */}
              <Plug className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{it.name}</span>
              <span
                className={cn(
                  "text-xs",
                  it.live ? "text-primary" : "text-muted-foreground"
                )}
              >
                {it.live ? "Disponible" : "Bientôt"}
              </span>
            </span>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function Integrations() {
  return (
    <Section id="integrations" className="bg-background-2/30">
      <SectionHeading
        eyebrow="Intégrations"
        title={
          <span className="inline-flex flex-wrap items-center justify-center gap-3">
            Vos outils, branchés à <LogoMark className="h-9 w-9" /> Odin
          </span>
        }
        description="Connectez vos propres comptes en OAuth. L'agent lit et agit sur vos données, en toute sécurité."
      />
      <div className="mx-auto mt-12 max-w-4xl">
        <IntegrationsGrid />
      </div>
    </Section>
  );
}
