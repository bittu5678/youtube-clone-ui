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

function apiDevPlugin(): Plugin {
  return {
    name: "api-dev-server",
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

      server.middlewares.use("/api/send-certificate-email", async (req, res) => {
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
            const { sendCertificateEmailServer } = await import("./src/server/email");
            const result = await sendCertificateEmailServer(payload);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = result.success ? 200 : 500;
            res.end(JSON.stringify(result));
          } catch (err: unknown) {
            console.error("[Certificate Email Dev Server Error]", err);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: "Email delivery failed" }));
          }
        });
      });

      server.middlewares.use("/api/payment/create-order", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            const { createServerPaymentOrder } = await import("./src/server/payments");
            const result = createServerPaymentOrder(payload);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch (err: unknown) {
            console.error("[Payment Order Dev Server Error]", err);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to create payment order" }));
          }
        });
      });

      server.middlewares.use("/api/payment/verify", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            const { verifyServerPayment } = await import("./src/server/payments");
            const result = await verifyServerPayment(
              payload,
              ["FT483921", "FT900431"],
              payload.referrerUserId || null,
            );
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch (err: unknown) {
            console.error("[Payment Verify Dev Server Error]", err);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 500;
            res.end(JSON.stringify({ verified: false, error: "Payment verification failed" }));
          }
        });
      });

      server.middlewares.use("/api/payment/transactions", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }
        try {
          const { getPersistentTransactions, getPersistentPremiumTxNumber } =
            await import("./src/server/payments");
          const [lastTxNumber, transactions] = await Promise.all([
            getPersistentPremiumTxNumber(),
            getPersistentTransactions(),
          ]);
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              status: "ok",
              lastTxNumber,
              totalTransactions: transactions.length,
              transactions,
            }),
          );
        } catch (err: unknown) {
          console.error("[Transactions Dev Server Error]", err);
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 500;
          res.end(JSON.stringify({ status: "error", error: "Failed to load transactions" }));
        }
      });

      server.middlewares.use("/api/wallet/withdraw", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            const amount = Number(payload.amount);
            const userId = String(payload.userId || "")
              .trim()
              .toUpperCase();

            if (!userId) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: "User identity required" }));
              return;
            }

            if (isNaN(amount) || amount < 1000) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  success: false,
                  error:
                    "Minimum withdrawal amount is ₹1,000. You cannot withdraw less than ₹1,000.",
                }),
              );
              return;
            }

            if (amount > 10000) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  success: false,
                  error:
                    "Maximum daily withdrawal limit is ₹10,000. You cannot withdraw more than ₹10,000 per day.",
                }),
              );
              return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                message: `Withdrawal request for ₹${amount.toLocaleString("en-IN")} validated and approved.`,
                amount,
                userId,
              }),
            );
          } catch (_e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: "Withdrawal validation failed" }));
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
    },
    plugins: [apiDevPlugin()],
  },
});
