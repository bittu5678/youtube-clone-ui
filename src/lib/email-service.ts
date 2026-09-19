/**
 * Facetube Welcome Email Service
 *
 * Subject:
 * Welcome to Facetube
 *
 * Email contains:
 * - User Name
 * - User ID (FT + 6 digits)
 * - Registered Email
 * - Password
 * - Login Link (https://youtube-clone-ui-8qmb.vercel.app/login)
 *
 * Real Delivery:
 * Dispatches to /api/send-welcome-email, which delivers via SMTP (Gmail) or Resend.
 * If sending fails, handles failure with: "Email delivery failed".
 */

export interface SentWelcomeEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  userId: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "delivered" | "failed" | "queued";
  provider?: "resend" | "smtp" | "none";
  error?: string;
}

export interface WelcomeEmailParams {
  name: string;
  email: string;
  userId: string;
  password?: string;
  loginLink?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider?: "resend" | "smtp" | "none";
  messageId?: string;
  error?: string;
}

const STORAGE_KEY_SENT_EMAILS = "facetube_sent_welcome_emails_v2";
export const OFFICIAL_LOGIN_LINK = "https://youtube-clone-ui-8qmb.vercel.app/login";

export function generateWelcomeEmailContent(
  name: string,
  email: string,
  userId: string,
  password: string = "••••••••",
  loginLink: string = OFFICIAL_LOGIN_LINK,
): {
  subject: string;
  body: string;
} {
  const subject = "Welcome to Facetube";
  const body = `Hello ${name}

Your Facetube account has been created successfully.

Account Details:
------------------------------------------
• User Name: ${name}
• User ID: ${userId}
• Registered Email: ${email}
• Password: ${password}
------------------------------------------

Login Link:
${loginLink}

You can log in using either your User ID or Email.`;

  return { subject, body };
}

/**
 * Dispatches real welcome email through the server endpoint.
 * Falls back to recording the failure gracefully if the server returns an error.
 */
export async function sendWelcomeEmail({
  name,
  email,
  userId,
  password,
  loginLink = OFFICIAL_LOGIN_LINK,
}: WelcomeEmailParams): Promise<EmailDispatchResult> {
  const { subject, body } = generateWelcomeEmailContent(name, email, userId, password, loginLink);

  let dispatchResult: EmailDispatchResult = {
    success: false,
    error: "Email delivery failed",
  };

  try {
    const response = await fetch("/api/send-welcome-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: name,
        userId,
        email,
        password: password || "",
        loginLink,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      dispatchResult = {
        success: true,
        provider: data.provider,
        messageId: data.messageId,
      };
    } else {
      dispatchResult = {
        success: false,
        provider: data.provider || "none",
        error: data.error || "Email delivery failed",
      };
    }
  } catch (netErr: unknown) {
    const msg = netErr instanceof Error ? netErr.message : String(netErr);
    console.error("[Email Client] Network error reaching email endpoint:", msg);
    dispatchResult = {
      success: false,
      error: "Email delivery failed",
    };
  }

  // Record into sent emails history
  const emailRecord: SentWelcomeEmail = {
    id: "email_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
    recipientEmail: email,
    recipientName: name,
    userId,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: dispatchResult.success ? "delivered" : "failed",
    provider: dispatchResult.provider,
    error: dispatchResult.error,
  };

  try {
    const existing = getSentWelcomeEmails();
    const updated = [emailRecord, ...existing.slice(0, 49)];
    localStorage.setItem(STORAGE_KEY_SENT_EMAILS, JSON.stringify(updated));
  } catch (_e) {
    // Storage quota or sandboxing
  }

  // Dispatch custom window event
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("facetube:welcome_email_sent", {
        detail: emailRecord,
      }),
    );
  }

  return dispatchResult;
}

export function getSentWelcomeEmails(): SentWelcomeEmail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SENT_EMAILS);
    if (!raw) return [];
    return JSON.parse(raw) as SentWelcomeEmail[];
  } catch {
    return [];
  }
}

export function getLatestWelcomeEmailForUser(userId: string): SentWelcomeEmail | undefined {
  const emails = getSentWelcomeEmails();
  return emails.find((e) => e.userId.toUpperCase() === userId.toUpperCase());
}
