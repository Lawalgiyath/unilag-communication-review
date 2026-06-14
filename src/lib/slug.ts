/** Convert arbitrary text to a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Slug for an article: first ~8 significant words of the title. */
export function articleSlug(title: string): string {
  const slug = slugify(title);
  const parts = slug.split("-").slice(0, 8);
  return parts.join("-");
}
