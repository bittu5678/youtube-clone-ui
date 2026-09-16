import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  DbUser,
  Profile,
  RoleType,
  AuthContextType,
  SignUpParams,
  SignInParams,
  UserWithRole,
  SignUpResult,
  SignInResult,
} from "@/types/auth";
import {
  registerUserInDatabase,
  findUserByIdentifier,
  getLocalDbUsers,
  saveLocalDbUsers,
  INITIAL_SEED_USERS,
} from "./user-service";
import { verifyPassword } from "./password";
import { isValidFTUserId, normalizeFTUserId } from "./user-id";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = "facetube_session_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [_session, setSession] = useState<Session | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<RoleType>("user");
  const [isLoading, setIsLoading] = useState(true);
  const [usersList, setUsersList] = useState<
    (UserWithRole & { password?: string; user_id?: string })[]
  >([]);

  // Sync usersList from database / storage
  const syncUsersList = useCallback(() => {
    const dbs = getLocalDbUsers();
    const formatted: (UserWithRole & { password?: string; user_id?: string })[] = dbs.map((u) => ({
      id: u.id,
      user_id: u.user_id,
      username: u.user_id.toLowerCase(),
      name: u.name,
      full_name: u.name,
      mobile: u.mobile,
      email: u.email,
      role: u.role || (u.email === "admin@facetube.com" ? "admin" : "user"),
      referral_code: u.referral_code,
      created_at: u.created_at,
    }));
    setUsersList(formatted);
  }, []);

  // Fetch profile and role from Supabase if connected
  const fetchSupabaseProfileAndRole = useCallback(async (supabaseUser: User) => {
    if (!supabase) return;

    try {
      // 1. Fetch from 'users' table
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("email", supabaseUser.email?.toLowerCase() || "")
        .maybeSingle();

      if (userData) {
        setDbUser(userData as DbUser);
        const resolvedRole: RoleType =
          userData.role === "admin" || supabaseUser.email === "admin@facetube.com"
            ? "admin"
            : "user";
        setRole(resolvedRole);

        const prof: Profile = {
          id: userData.id,
          user_id: userData.user_id,
          username: userData.user_id,
          name: userData.name,
          full_name: userData.name,
          mobile: userData.mobile,
          email: userData.email,
          referral_code: userData.referral_code,
          created_at: userData.created_at,
        };
        setProfile(prof);
        return;
      }

      // 2. Fallback to profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      } else {
        const newProfile: Profile = {
          id: supabaseUser.id,
          username:
            supabaseUser.user_metadata?.username ||
            supabaseUser.email?.split("@")[0] ||
            "user_" + supabaseUser.id.substring(0, 6),
          full_name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split("@")[0],
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
          email: supabaseUser.email,
          created_at: new Date().toISOString(),
        };
        setProfile(newProfile);
      }

      // 3. Fetch Role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", supabaseUser.id)
        .maybeSingle();

      if (roleData && (roleData.role === "admin" || roleData.role === "user")) {
        setRole(roleData.role as RoleType);
      } else {
        setRole(supabaseUser.email === "admin@facetube.com" ? "admin" : "user");
      }
    } catch (e) {
      console.error("Error loading user profile & role:", e);
      setRole("user");
    }
  }, []);

  // Refresh all users list
  const refreshUsers = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, user_id, name, mobile, email, referral_code, created_at");

        if (usersData && usersData.length > 0) {
          const combined: (UserWithRole & { password?: string; user_id?: string })[] =
            usersData.map((u) => ({
              id: u.id,
              user_id: u.user_id,
              username: u.user_id.toLowerCase(),
              name: u.name,
              full_name: u.name,
              mobile: u.mobile,
              email: u.email,
              role: u.email === "admin@facetube.com" ? "admin" : "user",
              referral_code: u.referral_code,
              created_at: u.created_at,
            }));
          setUsersList(combined);
          return;
        }
      } catch (e) {
        console.warn("Failed fetching users from supabase, using local:", e);
      }
    }

    syncUsersList();
  }, [syncUsersList]);

  // Initialization & Auth State Subscription
  useEffect(() => {
    syncUsersList();

    if (isSupabaseConfigured && supabase) {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session: initSession } }) => {
        setSession(initSession);
        setUser(initSession?.user ?? null);
        if (initSession?.user) {
          fetchSupabaseProfileAndRole(initSession.user).finally(() => setIsLoading(false));
        } else {
          // Check local stored session as backup
          restoreLocalSession();
        }
      });

      // 2. Subscribe to auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchSupabaseProfileAndRole(newSession.user);
        } else {
          setProfile(null);
          setDbUser(null);
          setRole("user");
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local Database Session Mode
      restoreLocalSession();
    }
  }, [fetchSupabaseProfileAndRole, syncUsersList]);

  const restoreLocalSession = () => {
    try {
      const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        setUser(parsed.user);
        setProfile(parsed.profile);
        setDbUser(parsed.dbUser || null);
        setRole(parsed.role || "user");
      }
    } catch (_e) {
      // Storage unavailable
    }
    setIsLoading(false);
  };

  /**
   * Database-backed User Registration
   * - Validates all fields
   * - Generates unique FT User ID (FT######)
   * - Stores user into Supabase PostgreSQL 'users' table
   * - Sends Welcome Email
   */
  const signUp = async (params: SignUpParams): Promise<SignUpResult> => {
    try {
      const { user: newDbUser, userId } = await registerUserInDatabase({
        name: params.name || params.fullName || "FaceTube User",
        mobile: params.mobile,
        email: params.email,
        password: params.password,
        referralCode: params.referralCode,
      });

      // Prepare profile representation
      const newProfile: Profile = {
        id: newDbUser.id,
        user_id: userId,
        username: userId,
        name: newDbUser.name,
        full_name: newDbUser.name,
        mobile: newDbUser.mobile,
        email: newDbUser.email,
        referral_code: newDbUser.referral_code,
        created_at: newDbUser.created_at,
      };

      const mockUser = {
        id: newDbUser.id,
        email: newDbUser.email,
        user_metadata: {
          name: newDbUser.name,
          full_name: newDbUser.name,
          mobile: newDbUser.mobile,
          user_id: userId,
        },
      } as unknown as User;

      setDbUser(newDbUser);
      setProfile(newProfile);
      setUser(mockUser);
      setRole(newDbUser.role || "user");

      // Save active session
      try {
        localStorage.setItem(
          LOCAL_STORAGE_SESSION_KEY,
          JSON.stringify({
            user: mockUser,
            profile: newProfile,
            dbUser: newDbUser,
            role: newDbUser.role || "user",
          }),
        );
      } catch (_e) {
        // storage disabled
      }

      // Refresh users list
      syncUsersList();

      return {
        success: true,
        user: newDbUser,
        userId,
        error: null,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  };

  /**
   * Database-backed Login: Supports login using User ID (FT123456) OR Email
   * Both work with the same password!
   */
  const signIn = async (params: SignInParams): Promise<SignInResult> => {
    const rawIdentifier = (params.identifier || params.email || "").trim();
    const password = params.password;

    if (!rawIdentifier) {
      return {
        success: false,
        error: new Error("Please enter your User ID or Email."),
      };
    }

    if (!password) {
      return {
        success: false,
        error: new Error("Please enter your password."),
      };
    }

    try {
      // 1. Look up user in database by User ID (FT######) OR Email
      const foundUser = await findUserByIdentifier(rawIdentifier);

      if (!foundUser) {
        // Helpful message
        return {
          success: false,
          error: new Error(
            "Account not found. Please check your User ID (e.g. FT123456) or Email, or sign up.",
          ),
        };
      }

      // 2. Verify password hash
      const isValid = await verifyPassword(password, foundUser.password_hash);
      if (!isValid) {
        return {
          success: false,
          error: new Error("Incorrect password. Please try again."),
        };
      }

      // 3. User authenticated successfully!
      const resolvedRole: RoleType =
        foundUser.role || (foundUser.email === "admin@facetube.com" ? "admin" : "user");

      const authProfile: Profile = {
        id: foundUser.id,
        user_id: foundUser.user_id,
        username: foundUser.user_id,
        name: foundUser.name,
        full_name: foundUser.name,
        mobile: foundUser.mobile,
        email: foundUser.email,
        referral_code: foundUser.referral_code,
        created_at: foundUser.created_at,
      };

      const authUser = {
        id: foundUser.id,
        email: foundUser.email,
        user_metadata: {
          user_id: foundUser.user_id,
          name: foundUser.name,
          full_name: foundUser.name,
          mobile: foundUser.mobile,
        },
      } as unknown as User;

      setDbUser(foundUser);
      setProfile(authProfile);
      setUser(authUser);
      setRole(resolvedRole);

      try {
        localStorage.setItem(
          LOCAL_STORAGE_SESSION_KEY,
          JSON.stringify({
            user: authUser,
            profile: authProfile,
            dbUser: foundUser,
            role: resolvedRole,
          }),
        );
      } catch (_e) {
        // storage disabled
      }

      return {
        success: true,
        error: null,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  };

  /**
   * Sign Out method
   */
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    setProfile(null);
    setDbUser(null);
    setRole("user");
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } catch (_e) {
      // Storage unavailable
    }
  };

  /**
   * Update User Role (Admin action)
   */
  const updateUserRole = async (targetUserId: string, newRole: RoleType): Promise<boolean> => {
    if (role !== "admin") {
      console.error("Only admins can update roles.");
      return false;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("users").update({ role: newRole }).eq("id", targetUserId);
      } catch (e) {
        console.warn("Supabase role update error:", e);
      }
    }

    const localDb = getLocalDbUsers();
    const updated = localDb.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u));
    saveLocalDbUsers(updated);
    syncUsersList();

    if (user && user.id === targetUserId) {
      setRole(newRole);
    }

    return true;
  };

  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        dbUser,
        role,
        isAdmin,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        updateUserRole,
        allUsers: usersList,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
