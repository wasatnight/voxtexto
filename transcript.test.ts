import { describe, expect, it } from "vitest";
import {
  fileStem,
  formatTime,
  MAX_FILE_BYTES,
  transcriptText,
  validateDuration,
  validateFile,
  wordCount,
} from "./transcript";
import type { Segment } from "../types";

const segments: Segment[] = [
  { id: "1", start: 65, end: 70, text: " Hola, mundo. " },
  { id: "2", start: 3600, end: null, text: "Segunda línea." },
];
describe("Audio admission", () => {
  it("accepts exactly one hour and rejects anything longer or unknown", () => {
    expect(() => validateDuration(3600)).not.toThrow();
    for (const value of [3600.001, Infinity, NaN, 0, -1])
      expect(() => validateDuration(value)).toThrow();
  });
  it("rejects empty, oversized and non-audio files before decoding", () => {
    expect(() =>
      validateFile({ name: "a.mp3", size: 10, type: "" }),
    ).not.toThrow();
    expect(() =>
      validateFile({ name: "a.mp3", size: 0, type: "audio/mp3" }),
    ).toThrow();
    expect(() =>
      validateFile({
        name: "a.wav",
        size: MAX_FILE_BYTES + 1,
        type: "audio/wav",
      }),
    ).toThrow();
    expect(() =>
      validateFile({
        name: "a.exe",
        size: 10,
        type: "application/octet-stream",
      }),
    ).toThrow();
  });
});
describe("Transcript exports", () => {
  it("exports the edited text with optional timestamps", () => {
    expect(transcriptText(segments)).toBe("Hola, mundo.\n\nSegunda línea.");
    expect(transcriptText(segments, true)).toBe(
      "[01:05] Hola, mundo.\n\n[1:00:00] Segunda línea.",
    );
  });
  it("handles time boundaries and unsafe filenames", () => {
    expect(formatTime(59.9)).toBe("00:59");
    expect(formatTime(3600)).toBe("1:00:00");
    expect(fileStem("entrevista: edición.mp3")).toBe("entrevista_ edición");
  });
  it("counts Unicode words and accepts an empty transcript", () => {
    expect(wordCount(segments)).toBe(4);
    expect(wordCount([])).toBe(0);
    expect(
      wordCount([{ id: "cjk", start: 0, end: 2, text: "你好世界" }]),
    ).toBeGreaterThan(0);
  });
});
