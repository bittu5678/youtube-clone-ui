// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import dotenv from "dotenv";
import path from "path";

try {
  dotenv.config();
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
} catch (_e) {
  // Ignore
}

if (process.argv.includes("build") && !process.argv.includes("development")) {
  process.env["NODE_ENV"] = "production";
}

function facetubeApiDevPlugin(): Plugin {
  return {
    name: "facetube-api-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api")) {
          return next();
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        req.on("end", async () => {
          try {
            const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
            const fullUrl = new URL(req.url!, `http://${req.headers.host || "localhost:3000"}`);
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) {
                if (Array.isArray(value)) {
                  value.forEach((v) => headers.append(key, v));
                } else {
                  headers.set(key, value);
                }
              }
            }

            const reqInit: RequestInit = {
              method: req.method || "GET",
              headers,
            };
            if (
              req.method !== "GET" &&
              req.method !== "HEAD" &&
              bodyBuffer &&
              bodyBuffer.length > 0
            ) {
              reqInit.body = bodyBuffer;
            }

            const webReq = new Request(fullUrl.toString(), reqInit);

            const { handleApiRequest } = await import("./src/server/api-handler");
            const response = await handleApiRequest(webReq);
            if (response) {
              res.statusCode = response.status;
              response.headers.forEach((val, key) => {
                res.setHeader(key, val);
              });
              const arrayBuf = await response.arrayBuffer();
              res.end(Buffer.from(arrayBuf));
              return;
            }
            next();
          } catch (err) {
            console.error("[API Dev Server Error]", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal Server Error in API Dev Handler" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      allowedHosts: true,
    },
    plugins: [facetubeApiDevPlugin()],
  },
});
