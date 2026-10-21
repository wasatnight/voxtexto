import { expect, test } from "@playwright/test";

test.use({ locale: "en-US" });

test("shows Spanish regional preferences and paragraph-based information", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Idioma del audio").selectOption("spanish-latam");
  await expect(
    page.getByText(
      "Latinoamérica y España usan el mismo reconocimiento de español.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ayuda y privacidad" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Se lee y procesa en tu dispositivo.", { exact: true }),
  ).toBeVisible();
  expect(
    await dialog
      .getByText(
        "El texto permanece en memoria hasta cerrar o reiniciar esta sesión.",
        { exact: true },
      )
      .evaluate((element) => element.tagName),
  ).toBe("P");
});

test("offers mobile install instructions without pretending to install", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Instalar app", exact: true }).click();
  // Some Chromium builds produce a native prompt; otherwise the app explains platform steps.
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible()) {
    await expect(
      dialog.getByRole("heading", { name: "iPhone y iPad" }),
    ).toBeVisible();
    await expect(
      dialog.getByText("Necesitas abrir una dirección HTTPS publicada."),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("production PWA keeps its shell available offline", async ({
  page,
  context,
}) => {
  test.skip(!process.env.PWA_TEST, "Run against the production preview.");
  await page.goto("/");
  page.on("pageerror", (error) => console.log("PWA_PAGE_ERROR", error.message));
  page.on("requestfailed", (request) =>
    console.log("PWA_REQUEST_FAILED", request.url(), request.failure()),
  );
  const manifest = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifest).toBe("./manifest.webmanifest");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  console.log(
    "CACHE_DIAGNOSTIC",
    await page.evaluate(async () => {
      const names = await window.caches.keys();
      const cache = await window.caches.open(
        names.find((name) => name.startsWith("voxtexto-shell-"))!,
      );
      const keys = await cache.keys();
      const js = keys.find(
        (key) => key.url.includes("/assets/index-") && key.url.endsWith(".js"),
      )!;
      const response = await cache.match(js);
      return {
        count: keys.length,
        vary: response?.headers.get("vary"),
        controller: Boolean(navigator.serviceWorker.controller),
      };
    }),
  );
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dale espacio a tus palabras." }),
  ).toBeVisible();
  const caches = await page.evaluate(async () => window.caches.keys());
  expect(caches.some((name) => name.startsWith("voxtexto-shell-"))).toBe(true);
});

test("detects Latin American Spanish speech automatically in an English browser", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.SPANISH_FIXTURE,
    "Provide a public Spanish speech fixture path.",
  );
  test.setTimeout(300_000);
  const fallbackWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("defaulting to English"))
      fallbackWarnings.push(message.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Opciones de procesamiento" }).click();
  await page
    .getByLabel("Motor local")
    .selectOption(process.env.ASR_ENGINE || "wasm");
  await page.getByLabel("Idioma del audio").selectOption("auto");
  await page
    .locator("#audio-input")
    .setInputFiles(process.env.SPANISH_FIXTURE!);
  await page
    .getByRole("button", { name: "Transcribir audio", exact: true })
    .click();
  await expect
    .poll(
      async () => {
        if (await page.getByRole("alert").count()) return "error";
        return (await page.getByRole("textbox").count()) ? "done" : "running";
      },
      { timeout: 270_000 },
    )
    .not.toBe("running");
  if (await page.getByRole("alert").count())
    console.log("ASR_ERROR", await page.getByRole("alert").innerText());
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByText("Idioma usado: español", { exact: true }),
  ).toBeVisible();
  const text = await page
    .getByRole("textbox")
    .evaluateAll((elements) =>
      elements
        .map((element) => (element as HTMLTextAreaElement).value)
        .join(" "),
    );
  expect(text.length).toBeGreaterThan(10);
  expect(fallbackWarnings).toEqual([]);
  console.log("SPANISH_AUTO", text);
  await page.screenshot({
    path: testInfo.outputPath("spanish-auto.png"),
    fullPage: true,
  });
});
