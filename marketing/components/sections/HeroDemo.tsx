"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Wand2 } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";

const EXAMPLES = [
  {
    q: "Résume les factures impayées de ce mois",
    a: "3 factures impayées (4 820 €). La plus ancienne : Acme, 28 j. de retard. Je prépare les relances ?",
  },
  {
    q: "Cherche le contrat Dupont dans le Drive",
    a: "Trouvé : « Contrat_Dupont_2026.pdf ». Échéance le 30/06. Clause de renouvellement tacite à J-60.",
  },
  {
    q: "Crée un récap des ventes dans Airtable",
    a: "Ajouté à la table « Ventes » : 12 deals, 38 400 € ce mois (+14 % vs. mois dernier).",
  },
];

const TYPE_Q = 38;
const TYPE_A = 18;

export function HeroDemo() {
  const reduce = useReducedMotion();

  // 3D tilt that follows the cursor
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), {
    stiffness: 150,
    damping: 18,
  });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  // typewriter state machine
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"q" | "think" | "a" | "hold">("q");
  const [qLen, setQLen] = useState(0);
  const [aLen, setALen] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const ex = EXAMPLES[i];

  useEffect(() => {
    if (reduce) {
      setQLen(ex.q.length);
      setALen(ex.a.length);
      setPhase("a");
      return;
    }
    const t = (ms: number, fn: () => void) => (timer.current = setTimeout(fn, ms));
    if (phase === "q") {
      if (qLen < ex.q.length) t(TYPE_Q, () => setQLen(qLen + 1));
      else t(550, () => setPhase("think"));
    } else if (phase === "think") {
      t(750, () => setPhase("a"));
    } else if (phase === "a") {
      if (aLen < ex.a.length) t(TYPE_A, () => setALen(aLen + 1));
      else t(2400, () => setPhase("hold"));
    } else if (phase === "hold") {
      setI((i + 1) % EXAMPLES.length);
      setQLen(0);
      setALen(0);
      setPhase("q");
    }
    return () => clearTimeout(timer.current);
  }, [phase, qLen, aLen, i, ex.q.length, ex.a.length, ex.q, ex.a, reduce]);

  return (
    <div style={{ perspective: 1200 }} className="mx-auto mt-10 max-w-2xl">
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="glass rounded-2xl p-4 shadow-glow sm:p-5"
      >
        {/* window chrome */}
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/70" />
          <span className="h-3 w-3 rounded-full bg-amber-400/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-xs text-muted-foreground">Odin · agent</span>
        </div>

        {/* user prompt bubble */}
        <div className="flex justify-end">
          <div className="flex max-w-[85%] items-start gap-2 rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-left text-sm text-white">
            <Wand2 className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
            <span>
              {ex.q.slice(0, qLen)}
              {phase === "q" && <span className="animate-blink">▍</span>}
            </span>
          </div>
        </div>

        {/* assistant reply bubble */}
        <div className="mt-3 flex min-h-[68px] justify-start">
          {phase !== "q" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex max-w-[88%] items-start gap-2.5 rounded-2xl rounded-bl-sm border border-border bg-surface-2/70 px-4 py-2.5 text-left text-sm"
            >
              <LogoMark className="mt-0.5 h-5 w-5 shrink-0" />
              {phase === "think" ? (
                <span className="flex gap-1 py-1.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
              ) : (
                <span className="text-foreground/90">
                  {ex.a.slice(0, aLen)}
                  {phase === "a" && aLen < ex.a.length && (
                    <span className="animate-blink">▍</span>
                  )}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
