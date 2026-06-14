import { describe, it, expect } from "vitest";
import { dayHash } from "@/lib/views";

describe("dayHash", () => {
  const date = new Date("2026-06-05T10:00:00Z");

  it("is deterministic for same visitor+article+day", () => {
    const a = dayHash("1.2.3.4", "Mozilla/5.0", "art1", date);
    const b = dayHash("1.2.3.4", "Mozilla/5.0", "art1", date);
    expect(a).toBe(b);
  });

  it("differs across days", () => {
    const a = dayHash("1.2.3.4", "Mozilla/5.0", "art1", date);
    const b = dayHash(
      "1.2.3.4",
      "Mozilla/5.0",
      "art1",
      new Date("2026-06-06T10:00:00Z")
    );
    expect(a).not.toBe(b);
  });

  it("differs across articles and visitors", () => {
    const a = dayHash("1.2.3.4", "UA", "art1", date);
    expect(dayHash("1.2.3.4", "UA", "art2", date)).not.toBe(a);
    expect(dayHash("5.6.7.8", "UA", "art1", date)).not.toBe(a);
  });
});
