import { SAMPLE_RATE, validateDuration } from "./transcript";

export async function readDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const timer = window.setTimeout(
      () =>
        finish(
          new Error("La lectura tardó demasiado. Prueba con otro formato."),
        ),
      15_000,
    );
    function finish(error?: Error) {
      clearTimeout(timer);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.removeAttribute("src");
      audio.load();
      if (error) reject(error);
    }
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      try {
        validateDuration(duration);
        finish();
        resolve(duration);
      } catch (error) {
        finish(error as Error);
      }
    };
    audio.onerror = () =>
      finish(
        new Error("El navegador no reconoce este audio. Prueba con MP3 o WAV."),
      );
    audio.src = url;
  });
}

export async function decodeAudio(
  file: File,
  signal: AbortSignal,
): Promise<Float32Array> {
  const context = new AudioContext({ sampleRate: SAMPLE_RATE });
  try {
    signal.throwIfAborted();
    const bytes = await file.arrayBuffer();
    signal.throwIfAborted();
    const decoded = await context.decodeAudioData(bytes);
    signal.throwIfAborted();
    validateDuration(decoded.duration);
    const mono = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const samples = decoded.getChannelData(channel);
      for (let i = 0; i < mono.length; i++)
        mono[i] += samples[i] / decoded.numberOfChannels;
    }
    if (decoded.sampleRate === SAMPLE_RATE) return mono;
    const offline = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * SAMPLE_RATE),
      SAMPLE_RATE,
    );
    const buffer = offline.createBuffer(1, mono.length, decoded.sampleRate);
    buffer.copyToChannel(mono, 0);
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start();
    const resampled = await offline.startRendering();
    signal.throwIfAborted();
    return resampled.getChannelData(0).slice();
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(
      "No pudimos decodificar el audio. Prueba con WAV o MP3 y verifica que no esté dañado.",
    );
  } finally {
    await context.close();
  }
}
