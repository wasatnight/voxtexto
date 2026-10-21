import { describe, expect, it } from "vitest";
import { isRtl, needsSystemFont } from "./pdf-pages";

describe("Multilingual export routing", () => {
  it("keeps Latin, Greek and Cyrillic searchable", () => {
    expect(needsSystemFont("Español: canción. Ελληνικά. Привет.")).toBe(false);
  });
  it("uses system fonts for other scripts and emoji", () => {
    for (const text of ["你好世界", "こんにちは", "مرحبا", "नमस्ते", "🙂"])
      expect(needsSystemFont(text)).toBe(true);
  });
  it("recognizes right-to-left paragraphs including timestamp prefixes", () => {
    expect(isRtl("[00:00] مرحبا بالعالم")).toBe(true);
    expect(isRtl("Hola mundo")).toBe(false);
  });
});
