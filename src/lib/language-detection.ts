export function recognitionLanguage(value: string) {
  return value === "spanish-latam" ? "spanish" : value;
}

export function languageCode(token: string) {
  return token.replace(/^<\|/, "").replace(/\|>$/, "");
}

export function languageProbabilities(
  scores: ArrayLike<number>,
  languages: Record<string, number>,
) {
  const entries = Object.entries(languages).map(([token, id]) => ({
    code: languageCode(token),
    score: Number(scores[id]),
  }));
  const max = Math.max(...entries.map((entry) => entry.score));
  if (!Number.isFinite(max))
    throw new Error(
      "No se pudo identificar el idioma. Selecciónalo manualmente.",
    );
  const weights = entries.map((entry) => Math.exp(entry.score - max));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return entries.map((entry, index) => ({
    code: entry.code,
    probability: weights[index] / total,
  }));
}

export function rankLanguages(
  predictions: { code: string; probability: number }[][],
) {
  const totals = new Map<string, number>();
  for (const prediction of predictions)
    for (const entry of prediction)
      totals.set(
        entry.code,
        (totals.get(entry.code) ?? 0) + entry.probability / predictions.length,
      );
  const ranked = [...totals]
    .map(([code, probability]) => ({ code, probability }))
    .sort((a, b) => b.probability - a.probability);
  if (!ranked.length)
    throw new Error(
      "No se pudo identificar el idioma. Selecciónalo manualmente.",
    );
  return {
    code: ranked[0].code,
    uncertain:
      ranked[0].probability < 0.55 ||
      ranked[0].probability - (ranked[1]?.probability ?? 0) < 0.2,
  };
}

export function detectionSamples(audio: Float32Array, rate = 16_000) {
  const windowSize = Math.min(audio.length, rate * 15);
  if (!windowSize) throw new Error("El audio está vacío.");
  // Find the first non-quiet second without treating the OS/browser locale as evidence.
  let onset = 0;
  let found = false;
  for (let start = 0; start < audio.length; start += rate) {
    let energy = 0;
    const end = Math.min(start + rate, audio.length);
    for (let i = start; i < end; i += 4) energy += audio[i] ** 2;
    if (Math.sqrt(energy / Math.max(1, (end - start) / 4)) > 0.003) {
      onset = Math.max(0, start - rate);
      found = true;
      break;
    }
  }
  if (!found)
    throw new Error(
      "No encontramos suficiente sonido para detectar el idioma. Selecciónalo manualmente o prueba otro audio.",
    );
  const offsets = [
    onset,
    Math.floor(audio.length / 2 - windowSize / 2),
    audio.length - windowSize,
  ];
  const unique = [
    ...new Set(
      offsets.map((offset) =>
        Math.max(0, Math.min(audio.length - windowSize, offset)),
      ),
    ),
  ];
  return unique.map((offset) => audio.subarray(offset, offset + windowSize));
}
