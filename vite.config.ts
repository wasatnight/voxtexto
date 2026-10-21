import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "voxtexto-offline-shell",
      apply: "build",
      generateBundle(_options, bundle) {
        const assets = Object.keys(bundle).filter((name) =>
          /\.(js|css|woff2)$/.test(name),
        );
        const version = createHash("sha256")
          .update(assets.join("|"))
          .update(readFileSync(new URL("./public/theme.js", import.meta.url)))
          .digest("hex")
          .slice(0, 12);
        const source = readFileSync(
          new URL("./public/sw.js", import.meta.url),
          "utf8",
        )
          .replace("__VOXTEXTO_CACHE__", `voxtexto-shell-${version}`)
          .replace(
            "/*__PRECACHE__*/ []",
            JSON.stringify([
              "index.html",
              "theme.js",
              "favicon.svg",
              "manifest.webmanifest",
              "icons/icon-192.png",
              "icons/icon-512.png",
              "icons/maskable-512.png",
              "icons/apple-touch-icon.png",
              ...assets,
            ]),
          );
        this.emitFile({ type: "asset", fileName: "sw.js", source });
      },
    },
  ],
  base: "./",
  server: { port: 1420, strictPort: true },
  worker: { format: "es" },
});
