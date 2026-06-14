import { describe, it, expect } from "vitest";
import { slugify, articleSlug } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Gender and Media Representation")).toBe(
      "gender-and-media-representation"
    );
  });

  it("strips punctuation and apostrophes", () => {
    expect(slugify("Nigeria's Media: A 'Critical' Review!")).toBe(
      "nigerias-media-a-critical-review"
    );
  });

  it("handles diacritics", () => {
    expect(slugify("Communiqué résumé")).toBe("communique-resume");
  });
});

describe("articleSlug", () => {
  it("caps at 8 words", () => {
    const slug = articleSlug(
      "A Very Long Title With Many Many Words That Goes On And On Forever"
    );
    expect(slug.split("-").length).toBeLessThanOrEqual(8);
  });
});
