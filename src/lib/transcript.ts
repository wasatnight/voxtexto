import type { Segment } from "../types";

export const MAX_DURATION = 60 * 60;
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const SAMPLE_RATE = 16_000;

export function validateDuration(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error(
      "No pudimos leer la duración de este audio. Prueba con WAV o MP3.",
    );
  if (duration > MAX_DURATION)
    throw new Error(
      "Este audio supera los 60 minutos. Recórtalo antes de continuar.",
    );
}

export function validateFile(file: Pick<File, "name" | "size" | "type">) {
  if (file.size === 0)
    throw new Error("El archivo está vacío. Selecciona otro audio.");
  if (file.size > MAX_FILE_BYTES)
    throw new Error(
      "El archivo supera los 100 MB. Comprímelo o divídelo antes de continuar.",
    );
  if (
    !file.type.startsWith("audio/") &&
    !/\.(mp3|wav|m4a|ogg|opus|flac|aac|webm)$/i.test(file.name)
  ) {
    throw new Error(
      "Selecciona un archivo de audio: MP3, WAV, M4A, OGG, FLAC, AAC o WebM.",
    );
  }
}

export function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
    : `${String(minutes).padStart(2, "0")}:${secs}`;
}

export function transcriptText(segments: Segment[], timestamps = false) {
  return segments
    .map(
      (s) => `${timestamps ? `[${formatTime(s.start)}] ` : ""}${s.text.trim()}`,
    )
    .join("\n\n");
}

export function fileStem(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .trim() || "transcripcion"
  );
}

export function wordCount(segments: Segment[]) {
  const text = transcriptText(segments).trim();
  if (!text) return 0;
  return [
    ...new Intl.Segmenter(undefined, { granularity: "word" }).segment(text),
  ].filter((s) => s.isWordLike).length;
}
