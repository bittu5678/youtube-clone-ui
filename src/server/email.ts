import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

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
  smtpUser?: string;
  smtpPass?: string;
  smtpHost?: string;
  smtpPort?: number | string;
  smtpSecure?: boolean | string;
  smtpFrom?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  provider?: "smtp" | "none";
  messageId?: string;
  error?: string;
}

const DEFAULT_LOGIN_LINK = "https://youtube-clone-ui-8qmb.vercel.app/login";

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
                        <td width="35%" style="color:#a1a1aa;padding:6px 0;">User ID:</td>
                        <td style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:700;color:#f43f5e;font-size:15px;padding:6px 0;">${payload.userId}</td>
                      </tr>
                      <tr>
                        <td width="35%" style="color:#a1a1aa;padding:6px 0;">Registered Email:</td>
                        <td style="font-weight:500;color:#ffffff;padding:6px 0;">${payload.email}</td>
                      </tr>
                      <tr>
                        <td width="35%" style="color:#a1a1aa;padding:6px 0;">Password:</td>
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

export interface ResolvedSmtpConfig {
  user: string | undefined;
  pass: string | undefined;
  host: string;
  port: number;
  secure: boolean;
  from: string;
  configured: boolean;
  source: string;
}

/**
 * Resolves Gmail / SMTP credentials from environment sources, .dev.env.json, or .env files.
 */
export function resolveSmtpConfig(
  payload?: Partial<WelcomeEmailPayload>,
  envOverride?: Record<string, string | undefined>,
): ResolvedSmtpConfig {
  let user: string | undefined;
  let pass: string | undefined;
  let rawHost: string | undefined;
  let rawPort: string | undefined;
  let rawSecure: string | undefined;
  let rawFrom: string | undefined;
  let source = "none";

  // 1. Explicit payload
  if (payload?.smtpUser) {
    user = payload.smtpUser.trim();
    source = "payload.smtpUser";
  }
  if (payload?.smtpPass) {
    pass = payload.smtpPass.trim();
  }
  if (payload?.smtpHost) rawHost = payload.smtpHost;
  if (payload?.smtpPort) rawPort = String(payload.smtpPort);
  if (payload?.smtpSecure !== undefined) rawSecure = String(payload.smtpSecure);
  if (payload?.smtpFrom) rawFrom = payload.smtpFrom;

  // 2. envOverride (passed from server handler or cloudflare worker context)
  if (!user && envOverride) {
    user = envOverride.SMTP_USER || envOverride.GMAIL_USER;
    if (user) source = "envOverride";
  }
  if (!pass && envOverride) {
    pass = envOverride.SMTP_PASS || envOverride.GMAIL_APP_PASSWORD;
  }
  if (!rawHost && envOverride?.SMTP_HOST) rawHost = envOverride.SMTP_HOST;
  if (!rawPort && envOverride?.SMTP_PORT) rawPort = envOverride.SMTP_PORT;
  if (!rawSecure && envOverride?.SMTP_SECURE) rawSecure = envOverride.SMTP_SECURE;
  if (!rawFrom && envOverride?.SMTP_FROM) rawFrom = envOverride.SMTP_FROM;

  // 3. process.env
  if (!user) {
    user = process.env.SMTP_USER || process.env.GMAIL_USER;
    if (user) source = "process.env";
  }
  if (!pass) {
    pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  }
  if (!rawHost) rawHost = process.env.SMTP_HOST;
  if (!rawPort) rawPort = process.env.SMTP_PORT;
  if (!rawSecure) rawSecure = process.env.SMTP_SECURE;
  if (!rawFrom) rawFrom = process.env.SMTP_FROM;

  // 4. AI Studio Settings (/app/.dev.env.json)
  if (!user || !pass) {
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
          if (!user && (data.SMTP_USER || data.GMAIL_USER)) {
            user = String(data.SMTP_USER || data.GMAIL_USER).trim();
            source = jp;
          }
          if (!pass && (data.SMTP_PASS || data.GMAIL_APP_PASSWORD)) {
            pass = String(data.SMTP_PASS || data.GMAIL_APP_PASSWORD).trim();
          }
          if (!rawHost && data.SMTP_HOST) rawHost = String(data.SMTP_HOST).trim();
          if (!rawPort && data.SMTP_PORT) rawPort = String(data.SMTP_PORT).trim();
          if (!rawSecure && data.SMTP_SECURE) rawSecure = String(data.SMTP_SECURE).trim();
          if (!rawFrom && data.SMTP_FROM) rawFrom = String(data.SMTP_FROM).trim();
        } catch (_e) {
          // ignore parse errors
        }
      }
    }
  }

  // 5. .env, .env.local, .env.development files
  if (!user || !pass) {
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
          if (!user && (parsed.SMTP_USER || parsed.GMAIL_USER)) {
            user = (parsed.SMTP_USER || parsed.GMAIL_USER).trim();
            source = p;
          }
          if (!pass && (parsed.SMTP_PASS || parsed.GMAIL_APP_PASSWORD)) {
            pass = (parsed.SMTP_PASS || parsed.GMAIL_APP_PASSWORD).trim();
          }
          if (!rawHost && parsed.SMTP_HOST) rawHost = parsed.SMTP_HOST.trim();
          if (!rawPort && parsed.SMTP_PORT) rawPort = parsed.SMTP_PORT.trim();
          if (!rawSecure && parsed.SMTP_SECURE) rawSecure = parsed.SMTP_SECURE.trim();
          if (!rawFrom && parsed.SMTP_FROM) rawFrom = parsed.SMTP_FROM.trim();
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  // Sanitize values
  if (user) {
    user = user.trim().replace(/^["']|["']$/g, "");
  }
  if (pass) {
    // Google App Passwords are 16 letters, often copied with spaces like "abcd efgh ijkl mnop".
    // Stripping spaces ensures authentication succeeds cleanly.
    pass = pass
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, "");
  }

  const host = rawHost ? rawHost.trim().replace(/^["']|["']$/g, "") : "smtp.gmail.com";
  const port = Number(rawPort ? rawPort.trim().replace(/^["']|["']$/g, "") : 465) || 465;
  const secure = rawSecure ? rawSecure.trim().toLowerCase() === "true" : port === 465;

  let from = rawFrom ? rawFrom.trim().replace(/^["']|["']$/g, "") : "";
  if (!from) {
    from = user ? `Facetube <${user}>` : "Facetube <no-reply@facetube.com>";
  }

  const configured = Boolean(user && pass);

  return {
    user,
    pass,
    host,
    port,
    secure,
    from,
    configured,
    source,
  };
}

/**
 * Server-side dispatch logic using Gmail SMTP with Google App Password.
 */
export async function sendWelcomeEmailServer(
  payload: WelcomeEmailPayload,
  envOverride?: Record<string, string | undefined>,
): Promise<EmailDeliveryResult> {
  const smtpConfig = resolveSmtpConfig(payload, envOverride);

  const text = generateWelcomeEmailText(payload);
  const html = generateWelcomeEmailHtml(payload);
  const subject = "Welcome to Facetube";

  // Check if Gmail / SMTP is configured
  if (!smtpConfig.configured || !smtpConfig.user || !smtpConfig.pass) {
    console.error("================== [GMAIL SMTP CONFIG ERROR] =================");
    console.error("Cannot dispatch welcome email: SMTP_USER or SMTP_PASS is missing.");
    console.error("Config resolution status:");
    console.error(`  • Source: ${smtpConfig.source}`);
    console.error(`  • SMTP User: ${smtpConfig.user || "NOT_SET"}`);
    console.error(`  • SMTP Pass: ${smtpConfig.pass ? "****** (configured)" : "NOT_SET"}`);
    console.error(`  • Host: ${smtpConfig.host}:${smtpConfig.port}`);
    console.error(`  • Intended Recipient: ${payload.email}`);
    console.error("");
    console.error("To enable automatic welcome emails from your Gmail account:");
    console.error("  1. In AI Studio Settings (or .env), add:");
    console.error("     SMTP_USER=<your-email@gmail.com>");
    console.error("     SMTP_PASS=<16-character Google App Password>");
    console.error("  2. (Optional):");
    console.error("     SMTP_HOST=smtp.gmail.com");
    console.error("     SMTP_PORT=465");
    console.error("     SMTP_SECURE=true");
    console.error('     SMTP_FROM="Facetube <your-email@gmail.com>"');
    console.error("==============================================================");

    return {
      success: false,
      provider: "none",
      error: "Email delivery failed",
    };
  }

  console.info("================== [GMAIL SMTP DISPATCH] =================");
  console.info(`[Gmail SMTP] Sending welcome email to: "${payload.email}"`);
  console.info(`[Gmail SMTP] Authenticating as: "${smtpConfig.user}"`);
  console.info(
    `[Gmail SMTP] Host: ${smtpConfig.host}:${smtpConfig.port} (secure: ${smtpConfig.secure})`,
  );
  console.info(`[Gmail SMTP] From header: "${smtpConfig.from}"`);
  console.info("==========================================================");

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to: payload.email,
      subject,
      text,
      html,
    });

    console.info(
      `[Gmail SMTP] Successfully delivered welcome email to ${payload.email}! Message ID: ${info.messageId}`,
    );

    return {
      success: true,
      provider: "smtp",
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    console.error("================= [GMAIL SMTP ERROR] =================");
    console.error("Failed to deliver welcome email to:", payload.email);
    console.error("Sender user:", smtpConfig.user);
    console.error("Error details:", err);
    console.error("======================================================");

    return {
      success: false,
      provider: "smtp",
      error: "Email delivery failed",
    };
  }
}
