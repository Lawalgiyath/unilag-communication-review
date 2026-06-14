export function SectionLabel({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: React.ReactNode;
  as?: "h2" | "h3" | "p" | "span" | "div";
  className?: string;
}) {
  return (
    <Tag className={`section-label flex items-center gap-3 ${className}`}>
      <span className="inline-block h-px w-6 bg-gold" aria-hidden="true" />
      {children}
    </Tag>
  );
}
