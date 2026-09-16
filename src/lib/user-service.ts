import { supabase, isSupabaseConfigured } from "./supabase";
import type { DbUser, SignUpParams } from "@/types/auth";
import { getUniqueFTUserId, normalizeFTUserId, isValidFTUserId } from "./user-id";
import { hashPassword } from "./password";
import { sendWelcomeEmail } from "./email-service";

export const LOCAL_STORAGE_DB_USERS_KEY = "facetube_db_users_v2";

// Default Seed Users (Matches the Supabase schema.sql seed)
export const INITIAL_SEED_USERS: DbUser[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    user_id: "FT102857",
    name: "FaceTube Administrator",
    mobile: "+1 555-019-2834",
    email: "admin@facetube.com",
    // SHA-256 hash for 'password123'
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
 * Reads local cached/mock database users from localStorage
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
 * Checks whether an FT User ID already exists in either Supabase or local DB
 */
export async function checkUserIdExists(candidateUserId: string): Promise<boolean> {
  const normalized = normalizeFTUserId(candidateUserId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", normalized)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
    } catch {
      // fallback to local check
    }
  }

  const localUsers = getLocalDbUsers();
  return localUsers.some((u) => u.user_id.toUpperCase() === normalized.toUpperCase());
}

/**
 * Checks whether an email is already registered in the users table
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .ilike("email", normalized)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
    } catch {
      // fallback to local check
    }
  }

  const localUsers = getLocalDbUsers();
  return localUsers.some((u) => u.email.trim().toLowerCase() === normalized);
}

/**
 * Creates a new user record in the 'users' database table
 * Generates a unique FT User ID (FT + 6 digits), hashes the password, saves to DB,
 * and triggers the Welcome Email.
 */
export async function registerUserInDatabase({
  name,
  mobile,
  email,
  password,
  referralCode,
}: SignUpParams): Promise<{ user: DbUser; userId: string }> {
  const trimmedName = name.trim();
  const trimmedMobile = mobile.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check duplicate email in users table
  const emailTaken = await checkEmailExists(normalizedEmail);
  if (emailTaken) {
    throw new Error(`The email "${normalizedEmail}" is already registered. Please sign in.`);
  }

  // 2. Generate unique FT User ID (Rules: Prefix FT + 6 random digits, never duplicate)
  const generatedUserId = await getUniqueFTUserId(checkUserIdExists);

  // 3. Hash password using SHA-256
  const passwordHash = await hashPassword(password);

  // 4. Construct the DbUser object
  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "u_" + Math.random().toString(36).slice(2, 10);

  const newUser: DbUser = {
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

  // 5. Save to Supabase PostgreSQL 'users' table if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: newUser.id,
          user_id: newUser.user_id,
          name: newUser.name,
          mobile: newUser.mobile,
          email: newUser.email,
          password_hash: newUser.password_hash,
          referral_code: newUser.referral_code,
          created_at: newUser.created_at,
        })
        .select()
        .single();

      if (error) {
        console.warn("Supabase insert into users failed, falling back to local DB cache:", error);
      } else if (data) {
        newUser.id = data.id;
        newUser.user_id = data.user_id;
      }
    } catch (dbErr) {
      console.warn("Error calling Supabase users table:", dbErr);
    }
  }

  // 6. Always persist to local DB cache as well for offline resilience & fast demo loading
  const localList = getLocalDbUsers();
  saveLocalDbUsers([newUser, ...localList]);

  // 7. Send Welcome Email containing:
  // Subject: Welcome to Facetube
  // Body: Hello {{name}} ... User ID: FT123456 ... Email: {{email}}
  try {
    await sendWelcomeEmail({
      name: trimmedName,
      email: normalizedEmail,
      userId: generatedUserId,
    });
  } catch (emailErr) {
    console.error("Failed to send welcome email:", emailErr);
  }

  return { user: newUser, userId: generatedUserId };
}

/**
 * Searches for a user in the database by either:
 * - User ID (e.g. FT123456 or ft123456)
 * - OR Email (e.g. user@facetube.com)
 */
export async function findUserByIdentifier(identifier: string): Promise<DbUser | null> {
  if (!identifier) return null;
  const raw = identifier.trim();
  const isEmail = raw.includes("@");
  const isFT = isValidFTUserId(raw);

  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from("users").select("*");
      if (isEmail) {
        query = query.ilike("email", raw.toLowerCase());
      } else if (isFT) {
        query = query.eq("user_id", raw.toUpperCase());
      } else {
        // Could be either, try user_id or email
        query = query.or(`user_id.eq.${raw.toUpperCase()},email.ilike.${raw.toLowerCase()}`);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return data as DbUser;
      }
    } catch (e) {
      console.warn("Supabase lookup error:", e);
    }
  }

  // 2. Try Local DB storage
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
