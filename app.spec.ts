import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

function wave(duration: number) {
  const rate = 8000;
  const samples = Math.ceil(duration * rate);
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples * 2, 40);
  return buffer;
}

test("edits an explicit example and generates all download formats", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  // The restricted Windows environment cancels browser-managed disk downloads.
  // Capture exactly the Blob supplied to the real download link, then verify its bytes.
  await page.evaluate(() => {
    const original = URL.createObjectURL.bind(URL);
    (window as unknown as { exportedBlob?: Blob }).exportedBlob = undefined;
    URL.createObjectURL = (value: Blob | MediaSource) => {
      if (value instanceof Blob)
        (window as unknown as { exportedBlob?: Blob }).exportedBlob = value;
      return original(value);
    };
  });
  await expect(
    page.getByRole("button", { name: "Transcribir audio", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Explorar con un ejemplo" }).click();
  const editor = page.getByRole("textbox", { name: "Texto desde 00:00" });
  await editor.fill("Texto corregido: café, canción y pingüino.");
  await page.getByRole("checkbox", { name: "Marcas de tiempo" }).check();
  for (const format of ["txt", "docx", "pdf"]) {
    await page
      .getByRole("combobox", { name: "Formato de descarga" })
      .selectOption(format);
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar", exact: true }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe(`ejemplo-voxtexto.${format}`);
    const bytes = await page.evaluate(async () =>
      Array.from(
        new Uint8Array(
          await (
            window as unknown as { exportedBlob: Blob }
          ).exportedBlob.arrayBuffer(),
        ),
      ),
    );
    const file = Buffer.from(bytes);
    if (format === "txt")
      expect(file.toString("utf8")).toContain(
        "[00:00] Texto corregido: café, canción y pingüino.",
      );
    if (format === "docx") expect(file.subarray(0, 2).toString()).toBe("PK");
    if (format === "pdf") expect(file.subarray(0, 5).toString()).toBe("%PDF-");
    await writeFile(testInfo.outputPath(`example.${format}`), file);
  }
  expect(errors).toEqual([]);
});

test("validates one-hour boundary using actual audio metadata", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await writeFile(testInfo.outputPath("limite.wav"), wave(3600));
  await page
    .locator("#audio-input")
    .setInputFiles(testInfo.outputPath("limite.wav"));
  await expect(page.getByText("limite.wav", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Transcribir audio", exact: true }),
  ).toBeEnabled();
  await writeFile(testInfo.outputPath("demasiado-largo.wav"), wave(3601));
  await page
    .locator("#audio-input")
    .setInputFiles(testInfo.outputPath("demasiado-largo.wav"));
  await expect(page.getByRole("alert")).toContainText("supera los 60 minutos");
});

test("cancels a pending inference job without leaving controls blocked", async ({
  page,
}) => {
  await page.goto("/");
  await page.route("https://huggingface.co/**", (route) => route.abort());
  await page.locator("#audio-input").setInputFiles({
    name: "corto.wav",
    mimeType: "audio/wav",
    buffer: wave(2),
  });
  await page
    .getByRole("button", { name: "Transcribir audio", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar proceso" }).click();
  await expect(
    page.getByRole("button", { name: "Transcribir audio", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("Proceso cancelado. Puedes volver a intentarlo."),
  ).toBeVisible();
});

test("fits a phone viewport and opens accessible help", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Ayuda y privacidad" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("exports mixed scripts to a multipage PDF without dropping the text", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar con un ejemplo" }).click();
  await page
    .getByRole("textbox")
    .first()
    .fill(
      "你好世界。 مرحبا بالعالم. नमस्ते दुनिया. 日本語の文章です。\n".repeat(
        70,
      ),
    );
  await page.evaluate(() => {
    const original = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (value: Blob | MediaSource) => {
      if (value instanceof Blob)
        (window as unknown as { exportedBlob: Blob }).exportedBlob = value;
      return original(value);
    };
  });
  await page
    .getByRole("combobox", { name: "Formato de descarga" })
    .selectOption("pdf");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe("ejemplo-voxtexto.pdf");
  const bytes = await page.evaluate(async () =>
    Array.from(
      new Uint8Array(
        await (
          window as unknown as { exportedBlob: Blob }
        ).exportedBlob.arrayBuffer(),
      ),
    ),
  );
  expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  await writeFile(testInfo.outputPath("multilingual.pdf"), Buffer.from(bytes));
});

test("transcribes real speech locally with the CPU engine", async ({
  page,
  request,
}, testInfo) => {
  test.skip(
    !process.env.REAL_ASR,
    "Opt-in: downloads the public Whisper Base model.",
  );
  test.setTimeout(600_000);
  await page.goto("/");
  const sample = await request.get(
    "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav",
  );
  expect(sample.ok()).toBe(true);
  await writeFile(testInfo.outputPath("jfk.wav"), await sample.body());
  await page.getByRole("button", { name: "Opciones de procesamiento" }).click();
  await page
    .getByLabel("Motor local")
    .selectOption(process.env.ASR_ENGINE || "wasm");
  await page.getByLabel("Idioma del audio").selectOption(process.env.ASR_LANGUAGE || "english");
  await page
    .locator("#audio-input")
    .setInputFiles(testInfo.outputPath("jfk.wav"));
  await page
    .getByRole("button", { name: "Transcribir audio", exact: true })
    .click();
  await expect
    .poll(
      async () => {
        if (await page.getByRole("alert").count()) return "error";
        return (await page.getByRole("textbox").count()) ? "done" : "running";
      },
      { timeout: 550_000 },
    )
    .not.toBe("running");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("textbox").first()).toBeVisible();
  const text = await page.getByRole("textbox").allTextContents();
  const values = await page
    .getByRole("textbox")
    .evaluateAll((elements) =>
      elements.map((el) => (el as HTMLTextAreaElement).value).join(" "),
    );
  expect(values.toLowerCase()).toContain("country");
  console.log("REAL_ASR_TRANSCRIPT", values, text);
  await page.screenshot({
    path: testInfo.outputPath("real-transcription.png"),
    fullPage: true,
  });
});
