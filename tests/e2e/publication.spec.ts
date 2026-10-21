import { expect, test } from "@playwright/test";

test.skip(
  !process.env.PUBLICATION_TEST,
  "Run against the compiled Hostinger package.",
);
const origin = process.env.PUBLICATION_ORIGIN || "http://127.0.0.1:1424";

test("public pages, sitemap and robots resolve with the expected indexing policy", async ({
  page,
  request,
}) => {
  const sitemap = await request.get(`${origin}/sitemap.xml`);
  expect(sitemap.ok()).toBe(true);
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]),
  );
  expect(urls).toHaveLength(8);
  for (const item of urls) {
    expect(item.origin).toBe("https://voztexto.com");
    const response = await page.goto(origin + item.pathname);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      item.href,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index,follow,max-image-preview:large",
    );
  }
  const robots = await request.get(`${origin}/robots.txt`);
  expect(await robots.text()).toContain(
    "Sitemap: https://voztexto.com/sitemap.xml",
  );
  expect((await request.get(`${origin}/pagina-que-no-existe/`)).status()).toBe(
    404,
  );
  const app = await request.get(`${origin}/app/`);
  expect(app.headers()["content-security-policy"]).toContain(
    "frame-src 'none'",
  );
  expect(await app.text()).toContain("noindex,follow");
});

test("the published editor exports all formats under its security policy", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const advertisingRequests: string[] = [];
  page.on("request", (request) => {
    if (/googlesyndication|doubleclick|google-analytics/.test(request.url()))
      advertisingRequests.push(request.url());
  });
  await page.goto(`${origin}/app/`);
  await page.getByRole("button", { name: "Explorar con un ejemplo" }).click();
  await page
    .getByRole("textbox")
    .first()
    .fill("Documento de prueba: café, canción y privacidad.");
  for (const format of ["txt", "docx", "pdf"]) {
    await page
      .getByRole("combobox", { name: "Formato de descarga" })
      .selectOption(format);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar", exact: true }).click();
    expect((await download).suggestedFilename()).toBe(
      `ejemplo-voxtexto.${format}`,
    );
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
  expect(advertisingRequests).toEqual([]);
});

test("landing page and editor fit a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/app/", "/privacidad/"]) {
    await page.goto(origin + route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("the installed app shell still works offline under /app/", async ({
  page,
  context,
}) => {
  await page.goto(`${origin}/app/`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dale espacio a tus palabras." }),
  ).toBeVisible();
});

test("publication transcribes Spanish speech under its deployed CSP", async ({
  page,
}) => {
  test.skip(!process.env.SPANISH_FIXTURE, "Public speech fixture needed.");
  test.setTimeout(300_000);
  page.on("console", (message) => {
    if (message.type() === "error")
      console.log("BROWSER_ERROR", message.text());
  });
  await page.addInitScript(() => {
    const BaseWorker = window.Worker;
    window.Worker = class extends BaseWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener("message", (event) => {
          if (event.data?.type === "error")
            console.error("WORKER_ERROR", event.data.message);
        });
      }
    };
  });
  await page.goto(`${origin}/app/`);
  await page.getByRole("button", { name: "Opciones de procesamiento" }).click();
  await page.getByLabel("Motor local").selectOption("wasm");
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
});
