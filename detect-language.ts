import {
  LogitsProcessor,
  LogitsProcessorList,
  Tensor,
  type AutomaticSpeechRecognitionPipeline,
} from "@huggingface/transformers";
import {
  detectionSamples,
  languageProbabilities,
  rankLanguages,
} from "./lib/language-detection";

export async function detectLanguage(
  transcriber: AutomaticSpeechRecognitionPipeline,
  audio: Float32Array,
) {
  const config = transcriber.model.generation_config as unknown as {
    lang_to_id: Record<string, number>;
    decoder_start_token_id: number;
  };
  if (!config.lang_to_id || !config.decoder_start_token_id)
    throw new Error(
      "El modelo no admite detección de idioma. Selecciona el idioma manualmente.",
    );
  const predictions: ReturnType<typeof languageProbabilities>[] = [];
  // One next-token step starting only with <|startoftranscript|> predicts a language.
  // Explicit decoder_input_ids bypasses v4.3.1's English fallback in _retrieve_init_tokens.
  for (const sample of detectionSamples(audio)) {
    let prediction: ReturnType<typeof languageProbabilities> | undefined;
    class LanguageLogits extends LogitsProcessor {
      _call(_ids: bigint[][], logits: Tensor) {
        prediction = languageProbabilities(
          logits.data as Float32Array,
          config.lang_to_id,
        );
        const allowed = new Set(Object.values(config.lang_to_id));
        const scores = logits.data as Float32Array;
        for (let i = 0; i < scores.length; i++)
          if (!allowed.has(i)) scores[i] = -Infinity;
        return logits;
      }
    }
    const processors = new LogitsProcessorList();
    processors.push(new LanguageLogits());
    const features = (await transcriber.processor(sample)) as {
      input_features: Tensor;
    };
    try {
      const output = await transcriber.model.generate({
        inputs: features.input_features,
        decoder_input_ids: [config.decoder_start_token_id],
        max_new_tokens: 1,
        return_timestamps: false,
        suppress_tokens: [],
        begin_suppress_tokens: [],
        logits_processor: processors,
      });
      if (output instanceof Tensor) output.dispose();
      if (!prediction)
        throw new Error(
          "No pudimos detectar el idioma. Selecciónalo manualmente.",
        );
      predictions.push(prediction);
    } finally {
      features.input_features.dispose();
    }
  }
  return rankLanguages(predictions);
}
