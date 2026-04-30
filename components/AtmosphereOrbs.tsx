/**
 * Pastel gradient orbs — decorative only (DESIGN.md: atmospheric, not CTA surfaces).
 */
export function AtmosphereOrbs() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -left-32 -top-24 h-[22rem] w-[22rem] rounded-full bg-orb-mint/35 blur-3xl" />
      <div className="absolute -right-24 top-1/4 h-[18rem] w-[18rem] rounded-full bg-orb-lavender/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-orb-peach/25 blur-3xl" />
      <div className="absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-orb-sky/20 blur-3xl" />
    </div>
  );
}
