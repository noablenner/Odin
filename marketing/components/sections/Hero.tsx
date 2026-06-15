"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles, Star, Wand2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { hero } from "@/lib/content";
import { links } from "@/lib/config";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease, delay },
  });

  return (
    <section className="relative overflow-hidden">
      {/* background glow + grid */}
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)] opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />

      <Container className="relative pb-20 pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fade(0)} className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </span>
              {hero.badge}
            </span>
          </motion.div>

          <motion.h1
            {...fade(0.08)}
            className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            {hero.title[0]}{" "}
            <span className="relative inline-flex items-center">
              <LogoMark className="mb-1 mr-1 inline-block h-10 w-10 align-middle sm:h-14 sm:w-14 animate-float" />
            </span>
            <br className="hidden sm:block" />
            <span className="text-gradient">{hero.title[1]}</span>
          </motion.h1>

          <motion.p
            {...fade(0.16)}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {hero.subtitle}
          </motion.p>

          {/* Prompt mock card */}
          <motion.div {...fade(0.24)} className="mx-auto mt-10 max-w-2xl">
            <div className="glass rounded-xl p-3 shadow-glow-sm">
              <div className="flex items-center gap-2 px-2 py-3 text-left text-sm text-muted-foreground sm:text-base">
                <Wand2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-foreground/90">{hero.examplePrompt}</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm">
                  <LogoMark className="h-5 w-5" />
                  Agent Odin
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </span>
                <div className="flex flex-1 gap-2">
                  <ButtonLink href={links.signup} size="md" className="flex-1">
                    {hero.ctaPrimary} <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink href={links.demo} variant="outline" size="md">
                    {hero.ctaSecondary}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p
            {...fade(0.32)}
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Sans carte bancaire · Mise en route en quelques minutes
          </motion.p>
        </div>
      </Container>
    </section>
  );
}
