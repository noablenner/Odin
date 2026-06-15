"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("odin-theme") as "dark" | "light") || "dark";
    setTheme(stored);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(next);
    localStorage.setItem("odin-theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Activer le thème ${theme === "dark" ? "clair" : "sombre"}`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2/60 hover:text-foreground cursor-pointer"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
