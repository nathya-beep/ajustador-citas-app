import { describe, it, expect } from "vitest";
import { getDictionary, isValidLocale } from "@/lib/i18n";

describe("i18n", () => {
  it("returns the English dictionary for 'en'", () => {
    expect(getDictionary("en").scheduleCta).toBe("Schedule an inspection");
  });

  it("returns the Spanish dictionary for 'es'", () => {
    expect(getDictionary("es").scheduleCta).toBe("Agendar una inspección");
  });

  it("validates known locales", () => {
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("fr")).toBe(false);
  });
});
