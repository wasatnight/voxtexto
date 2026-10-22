import type { Content } from "pdfmake/interfaces";

export function needsSystemFont(text: string) {
  // Roboto covers these Latin, Greek, Cyrillic and punctuation blocks.
  // Other scripts use the browser's system fallback fonts to avoid missing-glyph boxes.
  return /[^\u0000-\u024f\u0300-\u052f\u1e00-\u1eff\u2000-\u206f\u20a0-\u20cf]/u.test(
    text,
  );
}

export function isRtl(text: string) {
  return /^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(text);
}

export async function renderSystemFontPages(
  title: string,
  paragraphs: string[],
): Promise<Content[]> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1191;
  canvas.height = 1684;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error(
      "Tu navegador no permite generar este PDF. Prueba con Word o TXT.",
    );
  const pages: Content[] = [];
  const margin = 96;
  const maxWidth = canvas.width - margin * 2;
  let y = margin;
  function newPage() {
    context!.fillStyle = "#ffffff";
    context!.fillRect(0, 0, canvas.width, canvas.height);
    context!.fillStyle = "#252935";
    y = margin;
  }
  function finish() {
    pages.push({
      image: canvas.toDataURL("image/png"),
      width: 595.28,
      ...(pages.length ? { pageBreak: "before" as const } : {}),
    });
  }
  newPage();
  for (const [index, paragraph] of [title, ...paragraphs].entries()) {
    const size = index === 0 ? 40 : 23;
    const lineHeight = index === 0 ? 58 : 38;
    context.font = `${index === 0 ? "600" : "400"} ${size}px Arial, "Noto Sans", sans-serif`;
    const rtl = isRtl(paragraph);
    context.direction = rtl ? "rtl" : "ltr";
    context.textAlign = rtl ? "right" : "left";
    context.textBaseline = "top";
    function draw(line: string) {
      if (y + lineHeight > canvas.height - margin) {
        finish();
        newPage();
      }
      context!.fillText(line, rtl ? canvas.width - margin : margin, y);
      y += lineHeight;
    }
    let line = "";
    // Word-aware wrapping retains shaping; grapheme fallback handles long unbroken strings.
    const tokens = [
      ...new Intl.Segmenter(undefined, { granularity: "word" }).segment(
        paragraph,
      ),
    ].map((token) => token.segment);
    for (const token of tokens) {
      if (token.includes("\n")) {
        const parts = token.split("\n");
        for (let i = 0; i < parts.length; i++) {
          line += parts[i];
          if (i < parts.length - 1) {
            draw(line);
            line = "";
          }
        }
      } else if (context.measureText(line + token).width <= maxWidth)
        line += token;
      else {
        if (line.trim()) draw(line.trimEnd());
        line = token.trimStart();
        if (context.measureText(line).width > maxWidth) {
          const graphemes = [
            ...new Intl.Segmenter(undefined, {
              granularity: "grapheme",
            }).segment(line),
          ];
          line = "";
          for (const { segment } of graphemes) {
            if (context.measureText(line + segment).width > maxWidth) {
              draw(line);
              line = "";
            }
            line += segment;
          }
        }
      }
    }
    if (line.trim()) draw(line.trimEnd());
    y += 18;
  }
  finish();
  return pages;
}
