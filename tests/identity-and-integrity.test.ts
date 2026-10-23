import { describe, it, expect } from "vitest";
import { calculateTitleSimilarity, normalizeTitle } from "@/lib/crossref";
import { isInstitutionalEmail } from "@/components/common/InstitutionalBadge";
import { cleanEmailText } from "@/lib/email";

describe("Identity and Research Integrity Mechanisms", () => {
  describe("Crossref Title Similarity & Duplicate Detection", () => {
    it("normalizes titles cleanly", () => {
      const normalized = normalizeTitle("Youth Citizenship: Digital Activism & Electoral Mobilisation (2023)!");
      expect(normalized).toBe("youth citizenship digital activism electoral mobilisation 2023");
    });

    it("detects exact duplicate titles (score 1.0)", () => {
      const score = calculateTitleSimilarity(
        "Digital Media and Political Participation in Nigeria",
        "Digital Media and Political Participation in Nigeria"
      );
      expect(score).toBe(1.0);
    });

    it("detects near-duplicate titles with punctuation or casing differences", () => {
      const score = calculateTitleSimilarity(
        "Digital media and political participation in Nigeria: A critical analysis",
        "Digital Media & Political Participation in Nigeria: A Critical Analysis"
      );
      expect(score).toBeGreaterThan(0.85);
    });

    it("scores completely distinct research titles low", () => {
      const score = calculateTitleSimilarity(
        "Climate Change Adaptation in the Niger Delta",
        "Social Media Algorithmic Governance and Fake News"
      );
      expect(score).toBeLessThan(0.35);
    });
  });

  describe("Verified Institutional Researcher Email Badging", () => {
    it("verifies Nigerian university domains (.edu.ng)", () => {
      expect(isInstitutionalEmail("giyath@unilag.edu.ng")).toBe(true);
      expect(isInstitutionalEmail("prof.adebayo@ui.edu.ng")).toBe(true);
      expect(isInstitutionalEmail("researcher@lasu.edu.ng")).toBe(true);
    });

    it("verifies international academic institutions (.edu, .ac.uk, .ac.za, etc.)", () => {
      expect(isInstitutionalEmail("scholar@harvard.edu")).toBe(true);
      expect(isInstitutionalEmail("faculty@ox.ac.uk")).toBe(true);
      expect(isInstitutionalEmail("dr.smith@cam.ac.uk")).toBe(true);
      expect(isInstitutionalEmail("dean@uct.ac.za")).toBe(true);
      expect(isInstitutionalEmail("editor@ug.edu.gh")).toBe(true);
    });

    it("rejects generic public commercial email providers", () => {
      expect(isInstitutionalEmail("lawalgiyath200716@gmail.com")).toBe(false);
      expect(isInstitutionalEmail("researcher@yahoo.com")).toBe(false);
      expect(isInstitutionalEmail("author@hotmail.com")).toBe(false);
      expect(isInstitutionalEmail("student@outlook.com")).toBe(false);
      expect(isInstitutionalEmail("company@business.com")).toBe(false);
      expect(isInstitutionalEmail("")).toBe(false);
      expect(isInstitutionalEmail(null)).toBe(false);
    });
  });

  describe("Strict Email Integrity (No Emojis, No Em Dashes)", () => {
    it("converts em-dashes and en-dashes to standard hyphens", () => {
      const input = "UNILAG Communication Review — Special Issue – 2026";
      const cleaned = cleanEmailText(input);
      expect(cleaned).toBe("UNILAG Communication Review - Special Issue - 2026");
      expect(cleaned).not.toContain("—");
      expect(cleaned).not.toContain("–");
    });

    it("strips emojis completely from outgoing emails", () => {
      const input = "Welcome to the journal! 🎉📚 Congratulations on your paper 🚀";
      const cleaned = cleanEmailText(input);
      expect(cleaned).toBe("Welcome to the journal!  Congratulations on your paper ");
      expect(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}]/u.test(cleaned)).toBe(false);
    });
  });
});
