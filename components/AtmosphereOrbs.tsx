/**
 * Low-chroma atmospheric blurs — stone/slate only (no multi-hue RGB pastels).
 */
export function AtmosphereOrbs() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -left-32 -top-24 h-[22rem] w-[22rem] rounded-full bg-stone-400/28 blur-3xl" />
      <div className="absolute -right-24 top-1/4 h-[18rem] w-[18rem] rounded-full bg-slate-400/22 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-stone-300/24 blur-3xl" />
      <div className="absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-stone-500/18 blur-3xl" />
    </div>
  );
}
