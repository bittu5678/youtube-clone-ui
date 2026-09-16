/**
 * Facetube Welcome Email Service
 *
 * Subject:
 * Welcome to Facetube
 *
 * Body:
 * Hello {{name}}
 *
 * Your Facetube account has been created successfully.
 *
 * User ID: FT123456
 * Email: {{email}}
 *
 * You can log in using either your User ID or Email.
 */

export interface SentWelcomeEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  userId: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "delivered" | "queued";
}

const STORAGE_KEY_SENT_EMAILS = "facetube_sent_welcome_emails_v1";

export function generateWelcomeEmailContent(
  name: string,
  email: string,
  userId: string,
): {
  subject: string;
  body: string;
} {
  const subject = "Welcome to Facetube";
  const body = `Hello ${name}

Your Facetube account has been created successfully.

User ID: ${userId}
Email: ${email}

You can log in using either your User ID or Email.`;

  return { subject, body };
}

/**
 * Dispatches the welcome email upon user registration.
 */
export async function sendWelcomeEmail({
  name,
  email,
  userId,
}: {
  name: string;
  email: string;
  userId: string;
}): Promise<SentWelcomeEmail> {
  const { subject, body } = generateWelcomeEmailContent(name, email, userId);
  const emailRecord: SentWelcomeEmail = {
    id: "email_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
    recipientEmail: email,
    recipientName: name,
    userId,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: "delivered",
  };

  // 1. Console confirmation for development & audit
  console.info(
    `%c[FaceTube Welcome Email]%c Sent to ${email} (User ID: ${userId})\n\nSubject: ${subject}\n\n${body}`,
    "color: #e11d48; font-weight: bold;",
    "color: inherit;",
  );

  // 2. Persist in Sent Emails repository
  try {
    const existing = getSentWelcomeEmails();
    const updated = [emailRecord, ...existing.slice(0, 49)];
    localStorage.setItem(STORAGE_KEY_SENT_EMAILS, JSON.stringify(updated));
  } catch (_e) {
    // Storage quota or sandboxing
  }

  // 3. Dispatch custom window event so UI can react
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("facetube:welcome_email_sent", {
        detail: emailRecord,
      }),
    );
  }

  return emailRecord;
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
