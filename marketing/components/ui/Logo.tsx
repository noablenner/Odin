import { cn } from "@/lib/utils";

/**
 * Odin brandmark — an SVG approximation of the supplied logo: a tilted
 * violet→magenta halo, a 4-point sparkle, and a navy head silhouette.
 *
 * TODO: drop the final raster/vector assets into /public
 *   (logo-odin.png — horizontal lockup, logo-odin-mark.png — icon) and swap
 *   <LogoMark/> for <Image/> if you prefer the exact artwork.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="odin-halo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(262 83% 62%)" />
          <stop offset="100%" stopColor="hsl(291 86% 58%)" />
        </linearGradient>
      </defs>
      {/* halo */}
      <g transform="rotate(-18 24 15)">
        <ellipse
          cx="24"
          cy="15"
          rx="17"
          ry="5.5"
          fill="none"
          stroke="url(#odin-halo)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="74 26"
        />
      </g>
      {/* head / beard silhouette (navy) */}
      <path
        d="M19 16c-4 2-6 6-5 11 .6 3 .3 6-1 9 3 .4 5-1 6.5-3 1.6 2 4 3 6.5 2.4-1.2-1.6-1.4-3.4-.8-5.4 1.8-1 3-2.9 3-5.2 0-4.8-4.2-8.2-9.7-8.8-1.6-.2-3.2.2-4.5.9Z"
        fill="hsl(218 48% 17%)"
        className="dark:fill-[hsl(220_30%_92%)]"
      />
      {/* sparkle */}
      <path
        d="M39 9.5l1.1 2.6 2.6 1.1-2.6 1.1-1.1 2.6-1.1-2.6-2.6-1.1 2.6-1.1z"
        fill="hsl(291 86% 60%)"
      />
    </svg>
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
