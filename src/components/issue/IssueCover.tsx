import { format } from "date-fns";

/**
 * Typographic issue "cover" — oxblood block with Fraunces numerals and an
 * inset gold hairline frame. No images, broadsheet style.
 */
export function IssueCover({
  volume,
  issue,
  year,
  publishedAt,
  size = "md",
}: {
  volume: number;
  issue: number;
  year: number;
  publishedAt?: Date | null;
  size?: "sm" | "md" | "lg";
}) {
  const heights = { sm: "h-32", md: "h-44", lg: "h-56" };
  const volSizes = { sm: "text-3xl", md: "text-5xl", lg: "text-6xl" };
  return (
    <div
      className={`relative flex ${heights[size]} flex-col items-center justify-center bg-oxblood p-3 text-paper`}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-2 border border-gold/60" />
      <span className="text-[10px] uppercase tracking-[0.22em] text-gold">
        Volume
      </span>
      <span className={`font-display ${volSizes[size]} font-semibold leading-none`}>
        {volume}
      </span>
      <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-paper/85">
        Issue {issue} · {year}
      </span>
      {publishedAt && size !== "sm" && (
        <span className="mt-2 text-[10px] uppercase tracking-[0.14em] text-paper/60">
          {format(publishedAt, "MMMM yyyy")}
        </span>
      )}
    </div>
  );
}
