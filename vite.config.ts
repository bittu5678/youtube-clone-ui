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

function welcomeEmailDevPlugin(): Plugin {
  return {
    name: "welcome-email-dev-server",
    configureServer(server) {
      server.middlewares.use("/api/send-welcome-email", async (req, res) => {
        if (req.method === "GET") {
          try {
            const { resolveSmtpConfig } = await import("./src/server/email");
            const conf = resolveSmtpConfig();
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                status: "ok",
                smtpConfigured: conf.configured,
                host: conf.host,
                port: conf.port,
                secure: conf.secure,
                source: conf.source,
                sender: conf.from,
                user: conf.user ? `${conf.user.slice(0, 3)}***@***` : "NOT_SET",
              }),
            );
            return;
          } catch (_e) {
            res.statusCode = 200;
            res.end(JSON.stringify({ status: "ok" }));
            return;
          }
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: "Method Not Allowed" }));
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            const { sendWelcomeEmailServer } = await import("./src/server/email");
            const result = await sendWelcomeEmailServer(payload);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = result.success ? 200 : 500;
            res.end(JSON.stringify(result));
          } catch (err: unknown) {
            console.error("[Email Dev Server Error]", err);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: "Email delivery failed" }));
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
  vite: {
    plugins: [welcomeEmailDevPlugin()],
  },
});
