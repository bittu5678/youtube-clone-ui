import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { Resend } from "resend";

// Ensure local environment files are loaded into process.env if available
try {
  dotenv.config();
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
  dotenv.config({ path: "/app/.env" });
  dotenv.config({ path: "/app/applet/.env" });
} catch (_e) {
  // Ignore dotenv errors
}

export interface WelcomeEmailPayload {
  userName: string;
  userId: string;
  email: string;
  password: string;
  loginLink?: string;
  resendApiKey?: string;
  resendFrom?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  provider?: "resend" | "smtp" | "none";
  messageId?: string;
  error?: string;
}

const DEFAULT_LOGIN_LINK = "https://youtube-clone-ui-8qmb.vercel.app/login";
export const DEFAULT_RESEND_FROM = process.env.RESEND_FROM || "Facetube <welcome@yourdomain.com>";

export function generateWelcomeEmailText(payload: WelcomeEmailPayload): string {
  const loginLink = payload.loginLink || DEFAULT_LOGIN_LINK;
  return `Hello ${payload.userName},

Welcome to Facetube! Your account has been created successfully.

Your Account Details:
------------------------------------------
• User Name: ${payload.userName}
• User ID: ${payload.userId}
• Registered Email: ${payload.email}
• Password: ${payload.password}
------------------------------------------

Login Link:
${loginLink}

You can log in using either your User ID (${payload.userId}) or Registered Email (${payload.email}) with your password.

Best regards,
The Facetube Team`;
}

export function generateWelcomeEmailHtml(payload: WelcomeEmailPayload): string {
  const loginLink = payload.loginLink || DEFAULT_LOGIN_LINK;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Facetube</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f0f12;padding:40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
          
          <!-- Header with FaceTube Brand Red -->
          <tr>
            <td style="background:linear-gradient(135deg,#e11d48,#be123c);padding:28px 32px;text-align:left;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;text-transform:none;">
                    FaceTube
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
                Welcome to Facetube!
              </h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Hello <strong style="color:#ffffff;">${payload.userName}</strong>,<br>
                Your Facetube account has been created successfully and is ready to use.
              </p>

              <!-- Credentials Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#27272a;border:1px solid #3f3f46;border-radius:12px;margin:20px 0 28px 0;">
                <tr>
                  <td style="padding:20px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#e11d48;margin-bottom:12px;">
                      Your Account Credentials
                    </div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:14px;color:#e4e4e7;">
                      <tr>
                        <td width="35%" style="color:#a1a1aa;padding:6px 0;">User Name:</td>
                        <td style="font-weight:600;color:#ffffff;padding:6px 0;">${payload.userName}</td>
                      </tr>
                      <tr>
                        <td style="color:#a1a1aa;padding:6px 0;">User ID:</td>
                        <td style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:700;color:#f43f5e;font-size:15px;padding:6px 0;">${payload.userId}</td>
                      </tr>
                      <tr>
                        <td style="color:#a1a1aa;padding:6px 0;">Registered Email:</td>
                        <td style="font-weight:500;color:#ffffff;padding:6px 0;">${payload.email}</td>
                      </tr>
                      <tr>
                        <td style="color:#a1a1aa;padding:6px 0;">Password:</td>
                        <td style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;background:#18181b;padding:4px 8px;border-radius:6px;display:inline-block;color:#facc15;font-weight:600;margin-top:2px;">${payload.password}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginLink}" target="_blank" rel="noopener noreferrer" style="background-color:#e11d48;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;display:inline-block;box-shadow:0 4px 14px rgba(225,29,72,0.4);">
                      Log In to FaceTube
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#71717a;text-align:center;">
                Direct Login Link: <br>
                <a href="${loginLink}" target="_blank" rel="noopener noreferrer" style="color:#f43f5e;text-decoration:underline;word-break:break-all;">
                  ${loginLink}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#121215;padding:20px 32px;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                You can log in using either your <strong>User ID (${payload.userId})</strong> or <strong>Registered Email</strong> with your password.<br>
                © 2026 FaceTube. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function parseEnvString(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [k, ...vParts] = trimmed.split("=");
    const key = k.trim();
    let val = vParts.join("=").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function isValidApiKey(val?: string): boolean {
  if (!val) return false;
  const cleaned = val.trim().replace(/^["']|["']$/g, "");
  if (!cleaned || cleaned === "re_xxxxxxxxxxxxxxxxxxxx" || cleaned === "your_resend_api_key") {
    return false;
  }
  return cleaned.startsWith("re_") && cleaned.length > 5;
}

export interface ResolvedResendConfig {
  apiKey: string | undefined;
  from: string;
  source: string;
}

export function resolveResendConfig(
  payload?: Partial<WelcomeEmailPayload>,
  envOverride?: Record<string, string | undefined>,
): ResolvedResendConfig {
  let apiKey: string | undefined;
  let source = "none";

  // 1. Explicit payload from caller
  if (payload?.resendApiKey && isValidApiKey(payload.resendApiKey)) {
    apiKey = payload.resendApiKey.trim().replace(/^["']|["']$/g, "");
    source = "payload.resendApiKey";
  }

  // 2. envOverride
  if (!apiKey && envOverride?.RESEND_API_KEY && isValidApiKey(envOverride.RESEND_API_KEY)) {
    apiKey = envOverride.RESEND_API_KEY.trim().replace(/^["']|["']$/g, "");
    source = "envOverride.RESEND_API_KEY";
  }

  // 3. process.env
  if (!apiKey && process.env.RESEND_API_KEY && isValidApiKey(process.env.RESEND_API_KEY)) {
    apiKey = process.env.RESEND_API_KEY.trim().replace(/^["']|["']$/g, "");
    source = "process.env.RESEND_API_KEY";
  }
  if (
    !apiKey &&
    process.env.VITE_RESEND_API_KEY &&
    isValidApiKey(process.env.VITE_RESEND_API_KEY)
  ) {
    apiKey = process.env.VITE_RESEND_API_KEY.trim().replace(/^["']|["']$/g, "");
    source = "process.env.VITE_RESEND_API_KEY";
  }

  // 4. AI Studio Settings (/app/.dev.env.json)
  if (!apiKey) {
    const jsonPaths = [
      "/app/.dev.env.json",
      path.resolve(process.cwd(), ".dev.env.json"),
      path.resolve(process.cwd(), "../.dev.env.json"),
    ];
    for (const jp of jsonPaths) {
      if (fs.existsSync(jp)) {
        try {
          const raw = fs.readFileSync(jp, "utf-8");
          const data = JSON.parse(raw);
          if (data.RESEND_API_KEY && isValidApiKey(data.RESEND_API_KEY)) {
            apiKey = String(data.RESEND_API_KEY)
              .trim()
              .replace(/^["']|["']$/g, "");
            source = jp;
            break;
          }
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  // 5. Check .env and .env.local files
  if (!apiKey) {
    const envFiles = [
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), ".env.production"),
      path.resolve(process.cwd(), ".env.development"),
      "/app/.env",
      "/app/applet/.env",
    ];
    for (const p of envFiles) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, "utf-8");
          const parsed = parseEnvString(content);
          if (parsed.RESEND_API_KEY && isValidApiKey(parsed.RESEND_API_KEY)) {
            apiKey = parsed.RESEND_API_KEY.trim().replace(/^["']|["']$/g, "");
            source = p;
            break;
          }
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  // Resolve RESEND_FROM environment variable (supports verified Resend domain)
  let rawFrom =
    payload?.resendFrom ||
    envOverride?.RESEND_FROM ||
    process.env.RESEND_FROM ||
    process.env.VITE_RESEND_FROM;

  if (!rawFrom) {
    // Check .dev.env.json
    const jsonPaths = [
      "/app/.dev.env.json",
      path.resolve(process.cwd(), ".dev.env.json"),
      path.resolve(process.cwd(), "../.dev.env.json"),
    ];
    for (const jp of jsonPaths) {
      if (fs.existsSync(jp)) {
        try {
          const raw = fs.readFileSync(jp, "utf-8");
          const data = JSON.parse(raw);
          if (data.RESEND_FROM && typeof data.RESEND_FROM === "string" && data.RESEND_FROM.trim()) {
            rawFrom = data.RESEND_FROM.trim();
            break;
          }
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  if (!rawFrom) {
    // Check .env files
    const envFiles = [
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), ".env.production"),
      path.resolve(process.cwd(), ".env.development"),
      "/app/.env",
      "/app/applet/.env",
    ];
    for (const p of envFiles) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, "utf-8");
          const parsed = parseEnvString(content);
          if (parsed.RESEND_FROM && parsed.RESEND_FROM.trim()) {
            rawFrom = parsed.RESEND_FROM.trim();
            break;
          }
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  let from = rawFrom ? rawFrom.trim().replace(/^["']|["']$/g, "") : DEFAULT_RESEND_FROM;
  if (!from || !from.includes("@")) {
    from = DEFAULT_RESEND_FROM;
  }

  return { apiKey, from, source };
}

/**
 * Server-side dispatch logic using Resend (prioritized) or SMTP.
 */
export async function sendWelcomeEmailServer(
  payload: WelcomeEmailPayload,
  envOverride?: Record<string, string | undefined>,
): Promise<EmailDeliveryResult> {
  const {
    apiKey: resendApiKey,
    from: resendFrom,
    source: apiKeySource,
  } = resolveResendConfig(payload, envOverride);

  const text = generateWelcomeEmailText(payload);
  const html = generateWelcomeEmailHtml(payload);
  const subject = "Welcome to Facetube";

  // 1. Prioritize Resend with verified RESEND_API_KEY and RESEND_FROM
  if (resendApiKey) {
    console.info(
      `[Resend Server] Using RESEND_API_KEY from source: "${apiKeySource}" (prefix: ${resendApiKey.slice(0, 5)}...len: ${resendApiKey.length})`,
    );
    console.info(`[Resend Server] Sender configured: "${resendFrom}"`);
    console.info(`[Resend Server] Sending welcome email to: "${payload.email}"`);

    try {
      const resend = new Resend(resendApiKey);

      let sendResult = await resend.emails.send({
        from: resendFrom,
        to: payload.email,
        subject,
        text,
        html,
      });

      // If the configured sender domain is not verified in Resend (such as @gmail.com),
      // gracefully attempt delivery using the pre-verified Resend sender so the user's welcome email is delivered!
      if (
        sendResult.error &&
        sendResult.error.message &&
        sendResult.error.message.toLowerCase().includes("domain is not verified") &&
        resendFrom !== "Facetube <onboarding@resend.dev>"
      ) {
        console.warn(
          `[Resend Server] Sender "${resendFrom}" failed because the domain is not verified in Resend. Attempting delivery with pre-verified sender "Facetube <onboarding@resend.dev>"...`,
        );
        const retryResult = await resend.emails.send({
          from: "Facetube <onboarding@resend.dev>",
          to: payload.email,
          subject,
          text,
          html,
        });

        if (!retryResult.error) {
          sendResult = retryResult;
          console.info(
            `[Resend Server] Successfully delivered welcome email to ${payload.email} via pre-verified sender! Message ID: ${retryResult.data?.id}`,
          );
        }
      }

      const { data, error } = sendResult;

      if (error) {
        // Requirement: Log the exact Resend API error in the server console
        console.error("=================== [RESEND API ERROR] ===================");
        console.error("Failed to send Welcome Email to:", payload.email);
        console.error("Sender Used:", resendFrom);
        console.error("API Key Source:", apiKeySource);
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Exact Resend Error Object:", JSON.stringify(error, null, 2));
        console.error("==========================================================");

        // Requirement: If email fails, show "Email delivery failed"
        return {
          success: false,
          provider: "resend",
          error: "Email delivery failed",
        };
      }

      console.info(
        `[Resend Server] Welcome email successfully sent to ${payload.email}! Message ID: ${data?.id}`,
      );

      return {
        success: true,
        provider: "resend",
        messageId: data?.id,
      };
    } catch (err: unknown) {
      // Requirement: Log the exact Resend API error in the server console
      console.error("================= [RESEND API EXCEPTION] =================");
      console.error("Failed to execute Resend email dispatch to:", payload.email);
      console.error("Exception details:", err);
      console.error("==========================================================");

      return {
        success: false,
        provider: "resend",
        error: "Email delivery failed",
      };
    }
  }

  // 2. Check SMTP fallback
  const smtpUser = process.env.SMTP_USER || envOverride?.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || envOverride?.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || envOverride?.SMTP_HOST || "smtp.gmail.com";
  const smtpPort =
    Number(process.env.SMTP_PORT || envOverride?.SMTP_PORT) ||
    (smtpHost === "smtp.gmail.com" ? 465 : 587);
  const smtpSecure =
    (process.env.SMTP_SECURE || envOverride?.SMTP_SECURE) === "true" || smtpPort === 465;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const from = process.env.SMTP_FROM || envOverride?.SMTP_FROM || `Facetube <${smtpUser}>`;

      const info = await transporter.sendMail({
        from,
        to: payload.email,
        subject,
        text,
        html,
      });

      console.info(
        `[Email Server] Successfully sent welcome email to ${payload.email} via SMTP. ID: ${info.messageId}`,
      );
      return {
        success: true,
        provider: "smtp",
        messageId: info.messageId,
      };
    } catch (err: unknown) {
      console.error("[Email Server] SMTP exception:", err);
      return {
        success: false,
        provider: "smtp",
        error: "Email delivery failed",
      };
    }
  }

  // 3. Neither configured: log clearly why Resend failed to dispatch
  console.error("================== [RESEND CONFIG ERROR] =================");
  console.error("Cannot dispatch email: RESEND_API_KEY is not defined or is empty.");
  console.error("Checked sources:");
  console.error("  • process.env.RESEND_API_KEY");
  console.error("  • process.env.VITE_RESEND_API_KEY");
  console.error("  • /app/.dev.env.json");
  console.error("  • .env, .env.local");
  console.error("  • client-provided payload");
  console.error(`Sender configured: "${resendFrom}"`);
  console.error(
    "To resolve: provide RESEND_API_KEY and RESEND_FROM (your verified domain) in the Settings menu or .env",
  );
  console.error("==========================================================");

  return {
    success: false,
    provider: "resend",
    error: "Email delivery failed",
  };
}
