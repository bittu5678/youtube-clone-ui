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

const DEFAULT_LOGIN_LINK = "https://facetube.online/login";

export function generateWelcomeEmailText(payload: WelcomeEmailPayload): string {
  const loginLink = payload.loginLink || DEFAULT_LOGIN_LINK;
  return `Hello ${payload.userName},

Welcome to Facetube! Your account has been created successfully.

Your Account Details:
------------------------------------------
• User Name: ${payload.userName}
• User ID: ${payload.userId}
• Registered Email: ${payload.email}
• Account Status: Active (Password Encrypted)
------------------------------------------

How to Access Your Account:
• Sign in at ${loginLink} using your User ID (${payload.userId}) or Registered Email (${payload.email}).
• Use the confidential password you created during signup.
• For your security, account passwords are encrypted and never transmitted via email.
• Keep your credentials private. If you ever forget your password, you can request a secure reset directly from the login page.

Production Login Link:
${loginLink}

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
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#27272a;border:1px solid #3f3f46;border-radius:12px;margin:20px 0 24px 0;">
                <tr>
                  <td style="padding:20px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#e11d48;margin-bottom:12px;">
                      Your Account Details
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
                        <td width="35%" style="color:#a1a1aa;padding:6px 0;">Account Status:</td>
                        <td style="font-weight:600;color:#34d399;padding:6px 0;">Active (Password Encrypted)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Safe Account Access Instructions -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1c1c20;border:1px dashed #3f3f46;border-radius:12px;margin:0 0 24px 0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:12px;font-weight:700;color:#f43f5e;margin-bottom:8px;">How to Access Your Account:</div>
                    <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#d4d4d8;">
                      <li>Log in at <strong>${loginLink}</strong> using your <strong>User ID (${payload.userId})</strong> or <strong>Registered Email (${payload.email})</strong>.</li>
                      <li>Use the confidential password you created during signup.</li>
                      <li>For your security, passwords are encrypted and never transmitted via email.</li>
                      <li>Keep your credentials private. If you ever forget your password, you can request a secure reset directly from the login page.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginLink}" target="_blank" rel="noopener noreferrer" style="background-color:#e11d48;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;display:inline-block;box-shadow:0 4px 14px rgba(225,29,72,0.4);">
                      Log In to FaceTube
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#71717a;text-align:center;">
                Production Login Link: <br>
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
                You can log in using either your <strong>User ID (${payload.userId})</strong> or <strong>Registered Email</strong>.<br>
                © 2026 FaceTube (facetube.online). All rights reserved.
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
    if (!k) continue;
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
    user = envOverride["SMTP_USER"] || envOverride["GMAIL_USER"];
    if (user) source = "envOverride";
  }
  if (!pass && envOverride) {
    pass = envOverride["SMTP_PASS"] || envOverride["GMAIL_APP_PASSWORD"];
  }
  if (!rawHost && envOverride?.["SMTP_HOST"]) rawHost = envOverride["SMTP_HOST"];
  if (!rawPort && envOverride?.["SMTP_PORT"]) rawPort = envOverride["SMTP_PORT"];
  if (!rawSecure && envOverride?.["SMTP_SECURE"]) rawSecure = envOverride["SMTP_SECURE"];
  if (!rawFrom && envOverride?.["SMTP_FROM"]) rawFrom = envOverride["SMTP_FROM"];

  // 3. process.env
  if (!user) {
    user = process.env["SMTP_USER"] || process.env["GMAIL_USER"];
    if (user) source = "process.env";
  }
  if (!pass) {
    pass = process.env["SMTP_PASS"] || process.env["GMAIL_APP_PASSWORD"];
  }
  if (!rawHost) rawHost = process.env["SMTP_HOST"];
  if (!rawPort) rawPort = process.env["SMTP_PORT"];
  if (!rawSecure) rawSecure = process.env["SMTP_SECURE"];
  if (!rawFrom) rawFrom = process.env["SMTP_FROM"];

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
          const data = JSON.parse(raw) as Record<string, unknown>;
          if (!user && (data["SMTP_USER"] || data["GMAIL_USER"])) {
            user = String(data["SMTP_USER"] || data["GMAIL_USER"]).trim();
            source = jp;
          }
          if (!pass && (data["SMTP_PASS"] || data["GMAIL_APP_PASSWORD"])) {
            pass = String(data["SMTP_PASS"] || data["GMAIL_APP_PASSWORD"]).trim();
          }
          if (!rawHost && data["SMTP_HOST"]) rawHost = String(data["SMTP_HOST"]).trim();
          if (!rawPort && data["SMTP_PORT"]) rawPort = String(data["SMTP_PORT"]).trim();
          if (!rawSecure && data["SMTP_SECURE"]) rawSecure = String(data["SMTP_SECURE"]).trim();
          if (!rawFrom && data["SMTP_FROM"]) rawFrom = String(data["SMTP_FROM"]).trim();
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
          if (!user && (parsed["SMTP_USER"] || parsed["GMAIL_USER"])) {
            user = (parsed["SMTP_USER"] || parsed["GMAIL_USER"] || "").trim();
            source = p;
          }
          if (!pass && (parsed["SMTP_PASS"] || parsed["GMAIL_APP_PASSWORD"])) {
            pass = (parsed["SMTP_PASS"] || parsed["GMAIL_APP_PASSWORD"] || "").trim();
          }
          if (!rawHost && parsed["SMTP_HOST"]) rawHost = (parsed["SMTP_HOST"] || "").trim();
          if (!rawPort && parsed["SMTP_PORT"]) rawPort = (parsed["SMTP_PORT"] || "").trim();
          if (!rawSecure && parsed["SMTP_SECURE"]) rawSecure = (parsed["SMTP_SECURE"] || "").trim();
          if (!rawFrom && parsed["SMTP_FROM"]) rawFrom = (parsed["SMTP_FROM"] || "").trim();
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

  const host = rawHost
    ? rawHost.trim().replace(/^["']|["']$/g, "")
    : user && user.toLowerCase().endsWith("@gmail.com")
      ? "smtp.gmail.com"
      : "smtp.hostinger.com";
  const port = Number(rawPort ? rawPort.trim().replace(/^["']|["']$/g, "") : 465) || 465;
  const secure = rawSecure ? rawSecure.trim().toLowerCase() === "true" : port === 465;

  let from = rawFrom ? rawFrom.trim().replace(/^["']|["']$/g, "") : "";
  if (!from) {
    from = user ? `FaceTube <${user}>` : "FaceTube <noreply@facetube.online>";
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

  // Check if SMTP is configured
  if (!smtpConfig.configured || !smtpConfig.user || !smtpConfig.pass) {
    const missing = [!smtpConfig.user ? "SMTP_USER" : null, !smtpConfig.pass ? "SMTP_PASS" : null]
      .filter(Boolean)
      .join(" and ");

    const maskedUser = smtpConfig.user ? `${smtpConfig.user.slice(0, 2)}***@***` : "NOT_SET";
    console.warn(
      `[FaceTube Email] SMTP not configured. Missing: ${missing}. Host: ${smtpConfig.host}:${smtpConfig.port}. User: ${maskedUser}`,
    );

    return {
      success: false,
      provider: "none",
      error: `SMTP configuration missing: ${missing} must be configured in server environment.`,
    };
  }

  const maskedRecipient = payload.email
    ? `${payload.email.split("@")[0]?.slice(0, 2)}***@${payload.email.split("@")[1] || ""}`
    : "NOT_SET";
  console.info(
    `[FaceTube Email] Dispatching welcome email via SMTP (${smtpConfig.host}:${smtpConfig.port}) to ${maskedRecipient}`,
  );

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
      `[FaceTube SMTP] Successfully delivered welcome email to ${maskedRecipient}! Message ID: ${info.messageId}`,
    );

    return {
      success: true,
      provider: "smtp",
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[FaceTube SMTP] Delivery failed to ${maskedRecipient}:`, errorMsg);

    return {
      success: false,
      provider: "smtp",
      error: `Email delivery failed: ${errorMsg}`,
    };
  }
}

export interface CertificateEmailPayload {
  userName: string;
  userId: string;
  email: string;
  rank: string;
  subscribers: string;
  certificateId: string;
  issueDate: string;
  pdfBase64?: string;
  reason?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpHost?: string;
  smtpPort?: number | string;
  smtpSecure?: boolean | string;
  smtpFrom?: string;
}

export function generateCertificateEmailText(payload: CertificateEmailPayload): string {
  return `Hello ${payload.userName},

Congratulations! Your official FaceTube Digital Certificate of Creator Excellence has been issued.

Certificate Details:
------------------------------------------
• User Name: ${payload.userName}
• FT User ID: ${payload.userId}
• Creator Rank Achieved: ${payload.rank}
• Subscriber Milestone: ${payload.subscribers}
• Certificate ID: ${payload.certificateId}
• Issue Date: ${payload.issueDate}
• Authorized By: FaceTube Global Creator Board
------------------------------------------

You can access and verify your certificate directly at:
https://facetube.online/my-certificate

Keep creating, inspiring, and growing on FaceTube!

Best regards,
FaceTube Creator Governance Board`;
}

export function generateCertificateEmailHtml(payload: CertificateEmailPayload): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FaceTube Creator Certificate</title>
</head>
<body style="margin:0;padding:0;background-color:#090a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#090a0f;padding:40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#12131a;border:1px solid #27272a;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          <!-- Gold & Red Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e11d48 0%,#be123c 50%,#b45309 100%);padding:32px 36px;text-align:left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display:inline-block;font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">Face<span style="color:#fef08a;">Tube</span></span>
                    <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fed7aa;margin-top:4px;">Official Creator Accreditation</div>
                  </td>
                  <td align="right">
                    <span style="background:rgba(0,0,0,0.3);border:1px solid rgba(254,240,138,0.4);border-radius:20px;padding:6px 14px;font-size:12px;font-weight:800;color:#fef08a;">
                      ${payload.rank}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Certificate Announcement -->
          <tr>
            <td style="padding:36px 36px 20px 36px;">
              <h1 style="margin:0 0 10px 0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
                Congratulations, ${payload.userName}! 🎉
              </h1>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                In recognition of your exceptional content creation, community engagement, and reaching the <strong style="color:#fef08a;">${payload.rank}</strong> milestone with <strong style="color:#ffffff;">${payload.subscribers}</strong>, FaceTube has officially issued your Digital Certificate of Creator Excellence.
              </p>

              <!-- Certificate Specs Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#181924;border:1px solid #2d2e3d;border-radius:14px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #272838;font-size:13px;color:#71717a;">Recipient</td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid #272838;font-size:14px;font-weight:700;color:#ffffff;">${payload.userName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #272838;font-size:13px;color:#71717a;">FT User ID</td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid #272838;font-size:13px;font-family:monospace;font-weight:700;color:#f43f5e;">${payload.userId}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #272838;font-size:13px;color:#71717a;">Creator Rank</td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid #272838;font-size:14px;font-weight:700;color:#f59e0b;">${payload.rank}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #272838;font-size:13px;color:#71717a;">Subscribers</td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid #272838;font-size:13px;font-weight:700;color:#ffffff;">${payload.subscribers}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #272838;font-size:13px;color:#71717a;">Certificate ID</td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid #272838;font-size:12px;font-family:monospace;color:#94a3b8;">${payload.certificateId}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#71717a;">Issue Date</td>
                  <td align="right" style="padding:8px 0;font-size:13px;font-weight:600;color:#ffffff;">${payload.issueDate}</td>
                </tr>
              </table>

              <!-- Call to Action -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:10px 0 24px 0;">
                    <a href="https://facetube.online/my-certificate" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;box-shadow:0 8px 20px rgba(225,29,72,0.35);">
                      View & Print Certificate Online →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;line-height:1.5;color:#52525b;text-align:center;">
                This certificate has been cryptographically registered and authorized by the FaceTube Creator Governance Board.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0c0d12;padding:20px 36px;border-top:1px solid #1f2029;text-align:center;">
              <p style="margin:0;font-size:11px;color:#71717a;">
                © 2026 FaceTube Inc. · Creator Milestone Rewards Program · All rights reserved.
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

export async function sendCertificateEmailServer(
  payload: CertificateEmailPayload,
  envOverride?: Record<string, string | undefined>,
): Promise<EmailDeliveryResult> {
  const smtpConfig = resolveSmtpConfig(payload, envOverride);

  const text = generateCertificateEmailText(payload);
  const html = generateCertificateEmailHtml(payload);
  const subject = `🏆 FaceTube Digital Certificate: ${payload.rank} Achieved (${payload.userName})`;

  if (!smtpConfig.configured || !smtpConfig.user || !smtpConfig.pass) {
    const missing = [!smtpConfig.user ? "SMTP_USER" : null, !smtpConfig.pass ? "SMTP_PASS" : null]
      .filter(Boolean)
      .join(" and ");

    const maskedUser = smtpConfig.user ? `${smtpConfig.user.slice(0, 2)}***@***` : "NOT_SET";
    console.warn(
      `[FaceTube Email] Certificate email cannot be sent: SMTP not configured. Missing: ${missing}. Host: ${smtpConfig.host}:${smtpConfig.port}. User: ${maskedUser}`,
    );

    return {
      success: false,
      provider: "none",
      error: `SMTP configuration missing: ${missing} must be configured in server environment.`,
    };
  }

  const maskedRecipient = payload.email
    ? `${payload.email.split("@")[0]?.slice(0, 2)}***@${payload.email.split("@")[1] || ""}`
    : "NOT_SET";

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

    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    if (payload.pdfBase64) {
      const cleanBase64 = payload.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      attachments.push({
        filename: `FaceTube_Certificate_${payload.userId}_${payload.certificateId}.pdf`,
        content: Buffer.from(cleanBase64, "base64"),
        contentType: "application/pdf",
      });
    }

    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to: payload.email,
      subject,
      text,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.info(
      `[FaceTube SMTP] Successfully delivered certificate email to ${maskedRecipient}! Message ID: ${info.messageId}`,
    );
    return {
      success: true,
      provider: "smtp",
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(
      `[FaceTube SMTP] Failed to deliver certificate email to ${maskedRecipient}:`,
      errorMsg,
    );
    return {
      success: false,
      provider: "smtp",
      error: `Email delivery failed: ${errorMsg}`,
    };
  }
}

export interface PasswordResetEmailPayload {
  userName: string;
  userId: string;
  email: string;
  resetLink: string;
}

export async function sendPasswordResetEmailServer(
  payload: PasswordResetEmailPayload,
): Promise<EmailDeliveryResult> {
  const smtpConfig = resolveSmtpConfig();
  const maskedRecipient = maskEmail(payload.email);

  if (!smtpConfig.configured) {
    return {
      success: false,
      provider: "none",
      error: "SMTP credentials missing on server.",
    };
  }

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

    const subject = "Reset Your FaceTube Password";
    const text = `Hello ${payload.userName},\n\nWe received a request to reset your FaceTube password.\nClick the link below to set a new password:\n${payload.resetLink}\n\nThis link expires in 1 hour.\nIf you did not make this request, you can safely ignore this email.\n\nBest regards,\nFaceTube Security Team`;
    const html = `
      <div style="background-color:#0f0f12;padding:30px;font-family:sans-serif;color:#ffffff;">
        <div style="max-width:600px;margin:auto;background:#18181f;border:1px solid #2a2a38;border-radius:12px;padding:30px;">
          <h2 style="color:#ffffff;margin-top:0;">Face<span style="color:#f40600;">Tube</span> Security</h2>
          <h3 style="color:#ffffff;">Password Reset Request</h3>
          <p style="color:#a0a0b2;line-height:1.6;">Hello <strong>${payload.userName}</strong> (User ID: <span style="color:#f40600;font-family:monospace;">${payload.userId}</span>),</p>
          <p style="color:#a0a0b2;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new password. This link is single-use and will expire in 1 hour.</p>
          <p style="margin:25px 0;"><a href="${payload.resetLink}" style="background:#f40600;color:#ffffff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:bold;display:inline-block;">Reset Password &rarr;</a></p>
          <p style="color:#7e7e94;font-size:12px;word-break:break-all;">Link: ${payload.resetLink}</p>
          <hr style="border:none;border-top:1px solid #2a2a38;margin:20px 0;" />
          <p style="color:#606075;font-size:11px;margin:0;">If you did not request this password reset, please ignore this email.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to: payload.email,
      subject,
      text,
      html,
    });

    console.info(
      `[FaceTube SMTP] Delivered password reset email to ${maskedRecipient}! Message ID: ${info.messageId}`,
    );
    return {
      success: true,
      provider: "smtp",
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[FaceTube SMTP] Failed to send password reset email to ${maskedRecipient}:`, errorMsg);
    return {
      success: false,
      provider: "smtp",
      error: errorMsg,
    };
  }
}

