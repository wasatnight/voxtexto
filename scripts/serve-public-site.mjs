import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../build",
);
const port = Number(process.env.VOX_SITE_PORT || 1424);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
http
  .createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      let filename = path.resolve(root, "." + pathname);
      if (filename !== root && !filename.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      let details;
      try {
        details = await stat(filename);
      } catch {
        details = null;
      }
      if (details?.isDirectory()) {
        if (!pathname.endsWith("/")) {
          response.writeHead(301, { Location: pathname + "/" }).end();
          return;
        }
        filename = path.join(filename, "index.html");
      }
      const headers = {
        "Content-Type":
          types[path.extname(filename)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      };
      if (pathname.startsWith("/app/")) {
        const appHeaders = await readFile(
          path.join(root, "app/.htaccess"),
          "utf8",
        );
        const csp = appHeaders.match(/Content-Security-Policy "([^"]+)"/)?.[1];
        if (csp) headers["Content-Security-Policy"] = csp;
      }
      try {
        const body = await readFile(filename);
        response
          .writeHead(200, headers)
          .end(request.method === "HEAD" ? undefined : body);
      } catch {
        response
          .writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
          .end(await readFile(path.join(root, "404.html")));
      }
    } catch {
      response.writeHead(400).end("Solicitud no válida");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(
      `Publicación de prueba: http://127.0.0.1:${port}/ · App: /app/ (incluye CSP de publicación)`,
    ),
  );
