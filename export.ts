import type { Segment } from "../types";
import { fileStem, formatTime, transcriptText } from "./transcript";
import { isRtl, needsSystemFont, renderSystemFontPages } from "./pdf-pages";

export type ExportFormat = "txt" | "docx" | "pdf";

export async function makeExport(
  format: ExportFormat,
  segments: Segment[],
  title: string,
  timestamps: boolean,
): Promise<Blob> {
  if (format === "txt")
    return new Blob(["\uFEFF", transcriptText(segments, timestamps)], {
      type: "text/plain;charset=utf-8",
    });
  if (format === "docx") {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } =
      await import("docx");
    const document = new Document({
      creator: "VoxTexto",
      title,
      sections: [
        {
          children: [
            new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
            ...segments.map(
              (s) =>
                new Paragraph({
                  bidirectional: isRtl(s.text),
                  spacing: { after: 200 },
                  children: [
                    ...(timestamps
                      ? [
                          new TextRun({
                            text: `[${formatTime(s.start)}] `,
                            color: "6258B9",
                            bold: true,
                          }),
                        ]
                      : []),
                    ...s.text.split(/\r?\n/).map(
                      (line, index) =>
                        new TextRun({
                          text: line,
                          ...(index ? { break: 1 } : {}),
                        }),
                    ),
                  ],
                }),
            ),
          ],
        },
      ],
    });
    return Packer.toBlob(document);
  }
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.vfs = fonts;
  const useSystemFonts = needsSystemFont(title + transcriptText(segments));
  const content = useSystemFonts
    ? await renderSystemFontPages(
        title,
        segments.map(
          (s) => `${timestamps ? `[${formatTime(s.start)}] ` : ""}${s.text}`,
        ),
      )
    : [
        {
          text: title,
          fontSize: 22,
          bold: true,
          margin: [0, 0, 0, 24] as [number, number, number, number],
        },
        ...segments.map((s) => ({
          text: `${timestamps ? `[${formatTime(s.start)}] ` : ""}${s.text}`,
          margin: [0, 0, 0, 12] as [number, number, number, number],
        })),
      ];
  const document = pdfMake.createPdf({
    info: { title, author: "VoxTexto" },
    pageSize: "A4",
    pageMargins: useSystemFonts ? [0, 0, 0, 0] : [48, 54, 48, 54],
    defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.35 },
    content,
    footer: (page: number, pages: number) => ({
      text: `${page} / ${pages}`,
      alignment: "center",
      fontSize: 9,
      color: "#666666",
    }),
  });
  return new Promise((resolve) => document.getBlob(resolve));
}

export async function saveExport(
  format: ExportFormat,
  segments: Segment[],
  sourceName: string,
  timestamps: boolean,
) {
  const name = fileStem(sourceName);
  const blob = await makeExport(format, segments, name, timestamps);
  if (window.voxDesktop) {
    return window.voxDesktop.saveFile(`${name}.${format}`, new Uint8Array(await blob.arrayBuffer()));
  }
  if ("__TAURI_INTERNALS__" in window) {
    const [{ save }, { writeFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    const path = await save({
      defaultPath: `${name}.${format}`,
      filters: [{ name: format.toUpperCase(), extensions: [format] }],
    });
    if (!path) return false;
    await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    return true;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.${format}`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return true;
}
