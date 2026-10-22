import { describe, expect, it } from "vitest";
import {
  detectionSamples,
  languageProbabilities,
  rankLanguages,
  recognitionLanguage,
} from "./language-detection";

describe("Language identification", () => {
  it("chooses a language from audio logits instead of an English or OS default", () => {
    const probabilities = languageProbabilities(
      new Float32Array([100, -2, 7]),
      { "<|en|>": 1, "<|es|>": 2 },
    );
    expect(rankLanguages([probabilities])).toEqual({
      code: "es",
      uncertain: false,
    });
  });
  it("marks disagreement between audio samples as uncertain", () => {
    expect(
      rankLanguages([
        [
          { code: "es", probability: 0.8 },
          { code: "en", probability: 0.2 },
        ],
        [
          { code: "es", probability: 0.2 },
          { code: "en", probability: 0.8 },
        ],
      ]).uncertain,
    ).toBe(true);
  });
  it("does not invent a language for silence", () => {
    expect(() => detectionSamples(new Float32Array(32000))).toThrow(
      /manualmente/,
    );
  });
  it("skips initial silence and selects distinct bounded samples", () => {
    const audio = new Float32Array(16_000 * 40);
    audio.fill(0.1, 16_000 * 12);
    const samples = detectionSamples(audio);
    expect(samples.length).toBeGreaterThan(1);
    expect(samples.every((sample) => sample.length <= 16_000 * 15)).toBe(true);
    expect(samples[0].some((value) => value !== 0)).toBe(true);
  });
  it("maps the Latin American preference to the shared Spanish recognition model", () => {
    expect(recognitionLanguage("spanish-latam")).toBe("spanish");
    expect(recognitionLanguage("english")).toBe("english");
  });
});
