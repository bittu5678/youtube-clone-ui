import type { User } from "@supabase/supabase-js";

export type RoleType = "admin" | "user";

/**
 * Real database table 'users' schema (Supabase PostgreSQL)
 */
export interface DbUser {
  id: string; // UUID primary key
  user_id: string; // UNIQUE User ID with 'FT' prefix + 6 digits (e.g. FT123456)
  name: string; // Full Name
  mobile: string; // Mobile Number
  email: string; // UNIQUE Email
  password_hash: string; // Secure SHA-256 password hash
  referral_code: string | null; // Optional referral code
  created_at: string; // Timestamp
  role?: RoleType;
}

export interface Profile {
  id: string;
  user_id?: string;
  username: string;
  full_name?: string | null;
  name?: string | null;
  mobile?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  referral_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: RoleType;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser {
  id: string;
  user_id?: string;
  email?: string;
  username: string;
  full_name?: string;
  mobile?: string;
  avatar_url?: string;
  role: RoleType;
}

export interface UserWithRole {
  id: string;
  user_id?: string;
  username: string;
  full_name?: string | null;
  name?: string | null;
  mobile?: string;
  email: string;
  role: RoleType;
  referral_code?: string | null;
  created_at: string;
}

export interface SignUpParams {
  name: string;
  mobile: string;
  email: string;
  password: string;
  referralCode?: string;
  // Legacy / fallback support
  username?: string;
  fullName?: string;
}

export interface SignUpResult {
  success: boolean;
  user?: DbUser;
  userId?: string; // FT######
  error?: Error | null;
  emailDelivery?: {
    success: boolean;
    provider?: "resend" | "smtp" | "none";
    error?: string;
    messageId?: string;
  };
}

export interface SignInParams {
  identifier: string; // User ID (FT123456) OR Email
  password: string;
  // Backward compatibility alias for email
  email?: string;
}

export interface SignInResult {
  success: boolean;
  error?: Error | null;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  dbUser: DbUser | null;
  role: RoleType;
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  signIn: (params: SignInParams) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  updateUserRole: (targetUserId: string, newRole: RoleType) => Promise<boolean>;
  allUsers: (UserWithRole & { password?: string; user_id?: string })[];
  refreshUsers: () => Promise<void>;
}
