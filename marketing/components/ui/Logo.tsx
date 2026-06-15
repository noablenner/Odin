import Image from "next/image";
import { cn } from "@/lib/utils";
import markLight from "../brand/logo-mark-light.png";
import markDark from "../brand/logo-mark-dark.png";

/**
 * Odin brandmark — the official artwork.
 * Two theme variants are rendered and toggled with the `dark` class:
 *   • navy mark on transparent  → light theme
 *   • light mark on transparent → dark theme
 * Sizing comes from `className` (e.g. "h-8 w-8") on the wrapper.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block", className)}>
      <Image
        src={markLight}
        alt="Odin"
        fill
        sizes="64px"
        priority
        className="object-contain dark:hidden"
      />
      <Image
        src={markDark}
        alt=""
        aria-hidden
        fill
        sizes="64px"
        className="hidden object-contain dark:block"
      />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8" />
      <span className="font-display text-xl font-bold tracking-tight">ODIN</span>
    </span>
  );
}
