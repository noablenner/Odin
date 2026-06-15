import { ArrowRight, Check, X } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";
import { LogoMark } from "@/components/ui/Logo";
import { problemSolution as ps } from "@/lib/content";

export function ProblemSolution() {
  return (
    <Section>
      <SectionHeading eyebrow={ps.eyebrow} title={ps.problemTitle} />
      <div className="mt-12 grid items-stretch gap-6 md:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <ul className="space-y-4">
              {ps.problems.map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                    <X className="h-4 w-4" />
                  </span>
                  <span className="text-muted-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="relative h-full overflow-hidden border-primary/30 bg-brand-gradient/[0.04]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex items-center gap-2">
                <LogoMark className="h-7 w-7" />
                <span className="font-display text-lg font-semibold">{ps.solutionTitle}</span>
              </div>
              <p className="text-muted-foreground">{ps.solution}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
                <Check className="h-4 w-4" /> Branché sur vos outils
                <ArrowRight className="h-4 w-4" /> opérationnel en minutes
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
