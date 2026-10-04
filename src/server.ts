import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/send-welcome-email") {
        if (request.method === "GET") {
          try {
            const { resolveSmtpConfig } = await import("./server/email");
            const conf = resolveSmtpConfig(
              undefined,
              env && typeof env === "object"
                ? (env as Record<string, string | undefined>)
                : undefined,
            );
            return new Response(
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
              {
                status: 200,
                headers: { "content-type": "application/json" },
              },
            );
          } catch (_e) {
            return new Response(JSON.stringify({ status: "ok" }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
        }

        if (request.method === "POST") {
          try {
            const payload = await request.json();
            const { sendWelcomeEmailServer } = await import("./server/email");
            const result = await sendWelcomeEmailServer(
              payload,
              env && typeof env === "object"
                ? (env as Record<string, string | undefined>)
                : undefined,
            );
            return new Response(JSON.stringify(result), {
              status: result.success ? 200 : 500,
              headers: { "content-type": "application/json" },
            });
          } catch (err: unknown) {
            console.error("[SSR Server] Error handling send-welcome-email:", err);
            return new Response(
              JSON.stringify({ success: false, error: "Email delivery failed" }),
              {
                status: 500,
                headers: { "content-type": "application/json" },
              },
            );
          }
        }
      }

      if (url.pathname === "/api/send-certificate-email" && request.method === "POST") {
        try {
          const payload = await request.json();
          const { sendCertificateEmailServer } = await import("./server/email");
          const result = await sendCertificateEmailServer(
            payload,
            env && typeof env === "object"
              ? (env as Record<string, string | undefined>)
              : undefined,
          );
          return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 500,
            headers: { "content-type": "application/json" },
          });
        } catch (err: unknown) {
          console.error("[SSR Server] Error handling send-certificate-email:", err);
          return new Response(
            JSON.stringify({ success: false, error: "Certificate email delivery failed" }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }
      }

      // Razorpay Payment Order Creation Route
      if (url.pathname === "/api/payment/create-order" && request.method === "POST") {
        try {
          const payload = await request.json();
          const { createServerPaymentOrder } = await import("./server/payments");
          const result = createServerPaymentOrder(
            payload,
            env && typeof env === "object"
              ? (env as Record<string, string | undefined>)
              : undefined,
          );
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err: unknown) {
          console.error("[SSR Server] Error creating payment order:", err);
          return new Response(JSON.stringify({ error: "Failed to create payment order" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      }

      // Razorpay Payment Verification & Distribution Route
      if (url.pathname === "/api/payment/verify" && request.method === "POST") {
        try {
          const payload = await request.json();
          const { verifyServerPayment } = await import("./server/payments");
          const result = await verifyServerPayment(
            payload,
            ["FT483921", "FT900431"], // Seed eligible creators
            payload.referrerUserId || null,
            env && typeof env === "object"
              ? (env as Record<string, string | undefined>)
              : undefined,
          );
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err: unknown) {
          console.error("[SSR Server] Error verifying payment:", err);
          return new Response(
            JSON.stringify({ verified: false, error: "Payment verification failed" }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }
      }

      // Query Persistent Premium Transactions & Sequence
      if (url.pathname === "/api/payment/transactions" && request.method === "GET") {
        try {
          const { getPersistentTransactions, getPersistentPremiumTxNumber } =
            await import("./server/payments");
          const [lastTxNumber, transactions] = await Promise.all([
            getPersistentPremiumTxNumber(),
            getPersistentTransactions(),
          ]);
          return new Response(
            JSON.stringify({
              status: "ok",
              lastTxNumber,
              totalTransactions: transactions.length,
              transactions,
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          );
        } catch (err: unknown) {
          return new Response(
            JSON.stringify({ status: "error", error: "Failed to load transactions" }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }
      }

      // Server-side Withdrawal Limits & Validation Route
      if (url.pathname === "/api/wallet/withdraw" && request.method === "POST") {
        try {
          const payload = await request.json();
          const amount = Number(payload.amount);
          const userId = String(payload.userId || "")
            .trim()
            .toUpperCase();

          if (!userId) {
            return new Response(
              JSON.stringify({ success: false, error: "User identity required" }),
              {
                status: 400,
                headers: { "content-type": "application/json" },
              },
            );
          }

          if (isNaN(amount) || amount < 1000) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Minimum withdrawal amount is ₹1,000. You cannot withdraw less than ₹1,000.",
              }),
              { status: 400, headers: { "content-type": "application/json" } },
            );
          }

          if (amount > 10000) {
            return new Response(
              JSON.stringify({
                success: false,
                error:
                  "Maximum daily withdrawal limit is ₹10,000. You cannot withdraw more than ₹10,000 per day.",
              }),
              { status: 400, headers: { "content-type": "application/json" } },
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: `Withdrawal request for ₹${amount.toLocaleString("en-IN")} validated and approved.`,
              amount,
              userId,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: "Withdrawal validation failed" }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
