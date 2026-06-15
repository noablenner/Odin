"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { links, nav } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div
        className={cn(
          "transition-all duration-300",
          scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Odin — accueil">
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            <ButtonLink href={links.login} variant="ghost" size="sm">
              Se connecter
            </ButtonLink>
            <ButtonLink href={links.signup} variant="primary" size="sm">
              Commencer gratuitement
            </ButtonLink>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-surface-2/60 cursor-pointer"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-b border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <div className="space-y-1 px-5 py-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="grid gap-2 pt-3">
              <ButtonLink href={links.login} variant="outline" size="md">
                Se connecter
              </ButtonLink>
              <ButtonLink href={links.signup} variant="primary" size="md">
                Commencer gratuitement
              </ButtonLink>
              <a
                href={links.phone}
                className="mt-1 inline-flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <Phone className="h-4 w-4" /> Nous appeler
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
