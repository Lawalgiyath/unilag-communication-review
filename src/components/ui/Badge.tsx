const VARIANTS = {
  gold: "border border-gold text-gold-dark bg-transparent",
  maroon: "border border-maroon text-maroon bg-transparent",
  solid: "bg-maroon text-paper border border-maroon",
  neutral: "border border-hairline text-secondary bg-transparent",
} as const;

export function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <span
      className={`inline-block rounded-[2px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
