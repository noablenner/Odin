"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { Aurora } from "@/components/motion/Aurora";
import { HeroDemo } from "./HeroDemo";
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
      <Aurora />
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(65%_55%_at_50%_0%,black,transparent)] opacity-30" />

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
            <LogoMark className="mb-1 mr-1 inline-block h-10 w-10 align-middle animate-float sm:h-14 sm:w-14" />
            <br className="hidden sm:block" />
            <span className="text-gradient text-gradient-animate">{hero.title[1]}</span>
          </motion.h1>

          <motion.p
            {...fade(0.16)}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            {...fade(0.24)}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <ButtonLink href={links.signup} size="lg">
              {hero.ctaPrimary} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href={links.demo} variant="outline" size="lg">
              {hero.ctaSecondary}
            </ButtonLink>
          </motion.div>

          <motion.p
            {...fade(0.32)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Sans carte bancaire · Mise en route en quelques minutes
          </motion.p>
        </div>

        <motion.div {...fade(0.4)}>
          <HeroDemo />
        </motion.div>
      </Container>
    </section>
  );
}
