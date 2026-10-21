import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../build",
);
const config = JSON.parse(
  await readFile(new URL("../site.config.json", import.meta.url), "utf8"),
);
const fail = [];
let htmlCount = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(filename);
    else if (entry.name.endsWith(".html")) {
      htmlCount++;
      const html = await readFile(filename, "utf8");
      const location = new URL(
        path
          .relative(root, filename)
          .replaceAll(path.sep, "/")
          .replace(/index\.html$/, ""),
        "https://local.test/",
      );
      for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const target = new URL(match[1], location);
        if (target.origin !== location.origin) continue;
        const local = path.join(root, decodeURIComponent(target.pathname));
        try {
          await stat(local);
        } catch {
          fail.push(`${location.pathname}: recurso ausente ${target.pathname}`);
        }
      }
      if (html.includes("googlesyndication.com/pagead"))
        fail.push(`${location.pathname}: publicidad activa no autorizada`);
      if (
        filename.endsWith(path.join("app", "index.html")) &&
        !html.includes("noindex,follow")
      )
        fail.push("El editor debe tener noindex.");
      if (!html.includes('rel="canonical"'))
        fail.push(`${location.pathname}: falta canonical`);
    }
  }
}
await visit(root);
const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
for (const value of urls) {
  const item = new URL(value);
  if (item.origin !== config.origin || item.pathname.startsWith("/app"))
    fail.push(`URL no indexable en sitemap: ${value}`);
  try {
    await stat(path.join(root, item.pathname, "index.html"));
  } catch {
    fail.push(`Página del sitemap ausente: ${value}`);
  }
}
if (
  !(await readFile(path.join(root, "robots.txt"), "utf8")).includes(
    `Sitemap: ${config.origin}/sitemap.xml`,
  )
)
  fail.push("Sitemap incorrecto en robots.txt.");
const sw = await readFile(path.join(root, "app/sw.js"), "utf8");
if (sw.includes("__VOXTEXTO_CACHE__") || sw.includes("/*__PRECACHE__*/ []"))
  fail.push("Service worker sin compilar.");
for (const match of sw.matchAll(/"(assets\/[^"\n]+)"/g)) {
  try {
    await stat(path.join(root, "app", match[1]));
  } catch {
    fail.push(`Precache ausente: ${match[1]}`);
  }
}
if (fail.length) {
  console.error(fail.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Verificado: ${htmlCount} HTML, ${urls.length} URLs en sitemap, enlaces y recursos locales presentes, anuncios desactivados y app separada.`,
  );
