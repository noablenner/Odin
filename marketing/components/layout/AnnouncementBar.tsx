"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { links } from "@/lib/config";

export function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (sessionStorage.getItem("odin-promo-closed")) setOpen(false);
  }, []);
  if (!open) return null;

  return (
    <div className="relative z-50 bg-brand-gradient text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-5 py-2 text-center text-sm font-medium">
        <Sparkles className="h-4 w-4 shrink-0" />
        {/* TODO: real launch offer / message */}
        <span>
          Lancez votre agent IA gratuitement —{" "}
          <a href={links.signup} className="underline underline-offset-2 hover:opacity-90">
            commencer maintenant
          </a>
        </span>
        <button
          onClick={() => {
            setOpen(false);
            sessionStorage.setItem("odin-promo-closed", "1");
          }}
          aria-label="Fermer l'annonce"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-white/15 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
