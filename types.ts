export type Segment = {
  id: string;
  start: number;
  end: number | null;
  text: string;
};
export type Phase =
  | "empty"
  | "reading"
  | "ready"
  | "decoding"
  | "loading"
  | "detecting"
  | "transcribing"
  | "done";
export type Engine = "auto" | "wasm";
export type WorkerRequest = {
  audio: Float32Array;
  language: string;
  engine: Engine;
};
export type WorkerResponse =
  | {
      type: "language";
      language: string;
      automatic: boolean;
      uncertain: boolean;
    }
  | { type: "status"; message: string; engine?: string }
  | { type: "download"; file: string; progress: number }
  | { type: "progress"; progress: number }
  | { type: "complete"; segments: Segment[]; engine: string }
  | { type: "error"; message: string };
