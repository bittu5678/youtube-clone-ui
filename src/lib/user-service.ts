import { api } from "./api";
import type { DbUser, SignUpParams } from "@/types/auth";
import { getUniqueFTUserId, normalizeFTUserId, isValidFTUserId } from "./user-id";
import { hashPassword } from "./password";
import { sendWelcomeEmail } from "./email-service";

export const LOCAL_STORAGE_DB_USERS_KEY = "facetube_db_users_v2";

// Default Seed Users (Matches the Hostinger MySQL schema.sql seed)
export const INITIAL_SEED_USERS: DbUser[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    user_id: "FT102857",
    name: "FaceTube Administrator",
    mobile: "+1 555-019-2834",
    email: "admin@facetube.com",
    password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    referral_code: "FTVIP",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    role: "admin",
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    user_id: "FT483921",
    name: "Alex Rivera",
    mobile: "+1 555-014-8392",
    email: "alex@facetube.com",
    password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    referral_code: "CREATOR50",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    role: "user",
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    user_id: "FT900431",
    name: "Maya Lin",
    mobile: "+1 555-019-0043",
    email: "maya@facetube.com",
    password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    referral_code: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    role: "user",
  },
];

/**
 * Reads local cached database users from localStorage
 */
export function getLocalDbUsers(): DbUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DB_USERS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(LOCAL_STORAGE_DB_USERS_KEY, JSON.stringify(INITIAL_SEED_USERS));
    return INITIAL_SEED_USERS;
  } catch (_e) {
    return INITIAL_SEED_USERS;
  }
}

export function saveLocalDbUsers(users: DbUser[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DB_USERS_KEY, JSON.stringify(users));
  } catch (_e) {
    // quota error
  }
}

/**
 * Checks whether an FT User ID already exists in MySQL or local cache
 */
export async function checkUserIdExists(candidateUserId: string): Promise<boolean> {
  const normalized = normalizeFTUserId(candidateUserId);

  try {
    const res = await api.users.getProfile(normalized);
    if (res && res.profile) {
      return true;
    }
  } catch {
    // fallback to local check
  }

  const localUsers = getLocalDbUsers();
  return localUsers.some((u) => u.user_id.toUpperCase() === normalized.toUpperCase());
}

/**
 * Checks whether an email is already registered in the users table
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  try {
    const res = await api.users.getProfile(normalized);
    if (res && res.profile) {
      return true;
    }
  } catch {
    // fallback to local check
  }

  const localUsers = getLocalDbUsers();
  return localUsers.some((u) => u.email.trim().toLowerCase() === normalized);
}

/**
 * Creates a new user record in the MySQL 'users' database table via PHP API
 */
export async function registerUserInDatabase({
  name,
  mobile,
  email,
  password,
  referralCode,
}: SignUpParams): Promise<{
  user: DbUser;
  userId: string;
  emailDelivery?: {
    success: boolean;
    provider?: "resend" | "smtp" | "none";
    error?: string;
    messageId?: string;
  };
}> {
  const trimmedName = name.trim();
  const trimmedMobile = mobile.trim();
  const normalizedEmail = email.trim().toLowerCase();

  let generatedUserId = "";
  let newUser: DbUser | null = null;

  // 1. Call PHP MySQL backend register API
  try {
    const apiRes = await api.auth.register({
      name: trimmedName,
      mobile: trimmedMobile,
      email: normalizedEmail,
      password,
      referralCode: referralCode?.trim() || undefined,
    });

    if (apiRes && apiRes.user) {
      newUser = {
        id: apiRes.user.id,
        user_id: apiRes.user.user_id,
        name: apiRes.user.name,
        mobile: apiRes.user.mobile,
        email: apiRes.user.email,
        password_hash: "SECURED_BY_PHP_BCRYPT",
        referral_code: apiRes.user.referral_code || null,
        created_at: apiRes.user.created_at || new Date().toISOString(),
        role: apiRes.user.role || "user",
      };
      generatedUserId = apiRes.user.user_id;
    }
  } catch (apiErr) {
    console.warn("PHP Register API call note:", apiErr);
  }

  // 2. Fallback local generation if offline or initial dev boot
  if (!newUser) {
    const emailTaken = await checkEmailExists(normalizedEmail);
    if (emailTaken) {
      throw new Error(`The email "${normalizedEmail}" is already registered. Please sign in.`);
    }

    generatedUserId = await getUniqueFTUserId(checkUserIdExists);
    const passwordHash = await hashPassword(password);
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "u_" + Math.random().toString(36).slice(2, 10);

    newUser = {
      id: newId,
      user_id: generatedUserId,
      name: trimmedName,
      mobile: trimmedMobile,
      email: normalizedEmail,
      password_hash: passwordHash,
      referral_code: referralCode?.trim() || null,
      created_at: new Date().toISOString(),
      role: "user",
    };
  }

  // 3. Persist to local cache for fast offline resilience
  const localList = getLocalDbUsers();
  saveLocalDbUsers([newUser, ...localList.filter((u) => u.id !== newUser!.id)]);

  // 4. Send Welcome Email
  let emailDelivery = {
    success: false,
    provider: "none" as "resend" | "smtp" | "none",
    error: "Email delivery failed",
    messageId: undefined as string | undefined,
  };

  try {
    const res = await sendWelcomeEmail({
      name: trimmedName,
      email: normalizedEmail,
      userId: generatedUserId,
      password: password,
      loginLink: "https://facetube.online/login",
    });
    emailDelivery = {
      success: res.success,
      provider: res.provider || "none",
      error: res.error,
      messageId: res.messageId,
    };
  } catch (emailErr: unknown) {
    const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
    emailDelivery = {
      success: false,
      provider: "none",
      error: `Email delivery failed: ${msg}`,
      messageId: undefined,
    };
  }

  return { user: newUser, userId: generatedUserId, emailDelivery };
}

/**
 * Searches for a user in MySQL / local cache by either:
 * - User ID (e.g. FT123456)
 * - OR Email (e.g. user@facetube.com)
 */
export async function findUserByIdentifier(identifier: string): Promise<DbUser | null> {
  if (!identifier) return null;
  const raw = identifier.trim();

  // 1. Try PHP API
  try {
    const res = await api.users.getProfile(raw);
    if (res && res.profile) {
      const p = res.profile;
      return {
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        mobile: p.mobile,
        email: p.email,
        password_hash: p.password_hash || "SECURED_BY_PHP_BCRYPT",
        referral_code: p.referral_code,
        created_at: p.created_at,
        role: p.role,
      };
    }
  } catch (e) {
    // fallback to local cache
  }

  // 2. Try Local DB cache
  const localUsers = getLocalDbUsers();
  const searchUpper = raw.toUpperCase();
  const searchLower = raw.toLowerCase();

  const match = localUsers.find(
    (u) =>
      u.user_id.toUpperCase() === searchUpper ||
      u.email.toLowerCase() === searchLower ||
      (u.name && u.name.toLowerCase() === searchLower),
  );

  return match || null;
}
