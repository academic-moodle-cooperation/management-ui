/**
 * "Which parts were watched" — an area chart of the watch profile.
 *
 * Plain SVG on purpose: no charting library is wrapped behind an `@oc-mui/*`
 * facade, and a plugin must not pull one in directly. `currentColor` keeps
 * it on the theme's primary token, so dark mode and org themes come free.
 */
export interface WatchProfileProps {
  profile: number[];
  /** Rendered height in px; the width is fluid. */
  height?: number;
  className?: string;
  ariaLabel?: string;
}

const WIDTH = 100;
const HEIGHT = 100;

export const WatchProfile = ({
  profile,
  height = 48,
  className = "",
  ariaLabel,
}: WatchProfileProps) => {
  const count = profile.length;
  if (count === 0) return null;

  const step = count > 1 ? WIDTH / (count - 1) : WIDTH;
  const points = profile.map((value, index) => `${index * step},${HEIGHT - value * HEIGHT}`);
  const line = `M${points.join(" L")}`;
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={`block w-full text-primary ${className}`}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      <path d={area} fill="currentColor" opacity={0.2} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
