/**
 * Subtle audio-waveform gesture (audio-waveform-card pattern from DESIGN.md).
 */
export function WaveformStrip() {
  const heights = [3, 8, 5, 12, 6, 14, 7, 10, 4, 11, 5, 9, 4, 7, 2];
  return (
    <div
      className="flex h-6 items-end gap-0.5 text-muted/40"
      aria-hidden
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-current"
          style={{ height: `${h * 2}px` }}
        />
      ))}
    </div>
  );
}
