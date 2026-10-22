import { env, pipeline, TextStreamer } from "@huggingface/transformers";
import type { Segment, WorkerRequest, WorkerResponse } from "./types";
import { detectLanguage } from "./detect-language";
import { recognitionLanguage } from "./lib/language-detection";

env.allowLocalModels = false;
env.useBrowserCache = true;
// Avoid cross-origin isolation requirements. Inference stays in this Worker.
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;

const send = (message: WorkerResponse) => self.postMessage(message);

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    const download = (event: {
      status: string;
      file?: string;
      progress?: number;
    }) => {
      if (event.status === "progress")
        send({
          type: "download",
          file: event.file ?? "modelo",
          progress: event.progress ?? 0,
        });
    };
    let device: "webgpu" | "wasm" = "wasm";
    if (data.engine === "auto") {
      try {
        const gpu = (
          self.navigator as Navigator & {
            gpu?: { requestAdapter: () => Promise<unknown> };
          }
        ).gpu;
        if (gpu && (await gpu.requestAdapter())) device = "webgpu";
      } catch {
        /* CPU remains available. */
      }
    }
    send({
      type: "status",
      message: "Preparando el modelo de voz…",
      engine: device === "webgpu" ? "GPU local" : "CPU local",
    });
    async function load(target: "webgpu" | "wasm") {
      return pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-base",
        {
          device: target,
          dtype: target === "webgpu" ? "fp32" : "q8",
          progress_callback: download,
        },
      );
    }
    let transcriber;
    try {
      transcriber = await load(device);
    } catch (error) {
      if (device === "wasm") throw error;
      device = "wasm";
      send({
        type: "status",
        message: "La GPU no está disponible. Preparando el modo CPU…",
        engine: "CPU local",
      });
      transcriber = await load("wasm");
    }
    let language = recognitionLanguage(data.language);
    let uncertain = false;
    if (language === "auto") {
      send({
        type: "status",
        message: "Detectando el idioma a partir de tu audio…",
      });
      const detected = await detectLanguage(transcriber, data.audio);
      language = detected.code;
      uncertain = detected.uncertain;
    }
    send({
      type: "language",
      language: data.language === "auto" ? language : data.language,
      automatic: data.language === "auto",
      uncertain,
    });
    send({
      type: "status",
      message: "Transcribiendo en tu dispositivo…",
      engine: device === "webgpu" ? "GPU local" : "CPU local",
    });
    // The pipeline uses overlapping windows and merges them, avoiding duplicate text at boundaries.
    // Each generation ends one audio window. Count completed windows, never a timer.
    let chunksDone = 0;
    const duration = data.audio.length / 16_000;
    const totalChunks = Math.max(1, Math.ceil((duration - 30) / 20) + 1);
    class ProgressStreamer extends TextStreamer {
      end() {
        super.end();
        chunksDone++;
        send({
          type: "progress",
          progress: Math.min(99, (chunksDone / totalChunks) * 100),
        });
      }
    }
    const streamer = new ProgressStreamer(transcriber.tokenizer, {
      skip_prompt: true,
      callback_function: () => {},
    });
    const result = await transcriber(data.audio, {
      language,
      task: "transcribe",
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
      streamer,
    });
    const output = (Array.isArray(result) ? result[0] : result) as {
      text: string;
      chunks?: { timestamp: [number | null, number | null]; text: string }[];
    };
    const segments: Segment[] =
      output.chunks
        ?.map((chunk, index) => ({
          id: `segment-${index}`,
          start: chunk.timestamp[0] ?? 0,
          end: chunk.timestamp[1],
          text: chunk.text.trim(),
        }))
        .filter((chunk) => chunk.text.length > 0) ?? [];
    if (!segments.length && output.text.trim())
      segments.push({
        id: "segment-0",
        start: 0,
        end: duration,
        text: output.text.trim(),
      });
    send({
      type: "complete",
      segments,
      engine: device === "webgpu" ? "GPU local" : "CPU local",
    });
    await transcriber.dispose();
  } catch (error) {
    send({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
