/**
 * Living aurora backdrop — drifting blurred gradient blobs + a slowly rotating
 * conic ring. Pure CSS animation, so it moves regardless of JS hydration.
 */
export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* rotating conic halo */}
      <div className="absolute left-1/2 top-[-30%] h-[700px] w-[700px] -translate-x-1/2 animate-spin-slower opacity-[0.18] [background:conic-gradient(from_0deg,hsl(var(--grad-from)),hsl(var(--grad-to)),hsl(var(--grad-via)),hsl(var(--grad-from)))] blur-[90px]" />
      {/* drifting blobs */}
      <div className="absolute left-[12%] top-[6%] h-72 w-72 animate-drift-a rounded-full bg-primary/30 blur-[110px]" />
      <div className="absolute right-[8%] top-[18%] h-80 w-80 animate-drift-b rounded-full bg-accent/25 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-1/3 h-72 w-72 animate-drift-a rounded-full bg-[hsl(var(--grad-via))]/20 blur-[120px] [animation-delay:-6s]" />
    </div>
  );
}
