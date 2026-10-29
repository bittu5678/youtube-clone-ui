import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  User,
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
  INITIAL_SEED_USERS,
} from "./user-service";
import { verifyPassword } from "./password";
import { api, setStoredAuthToken } from "./api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = "facetube_session_v2";

function getCachedSession(): {
  user: User | null;
  profile: Profile | null;
  dbUser: DbUser | null;
  role: RoleType;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (savedSession) {
      return JSON.parse(savedSession);
    }
  } catch {
    // Storage unavailable
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cached = getCachedSession();
  const [user, setUser] = useState<User | null>(cached?.user || null);
  const [dbUser, setDbUser] = useState<DbUser | null>(cached?.dbUser || null);
  const [profile, setProfile] = useState<Profile | null>(cached?.profile || null);
  const [role, setRole] = useState<RoleType>(cached?.role || "user");
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
      channel_logo_url: u.channel_logo_url || null,
      channel_name: u.channel_name || null,
      referral_code: u.referral_code,
      created_at: u.created_at,
    }));
    setUsersList(formatted);
  }, []);

  // Refresh all users list from PHP MySQL API
  const refreshUsers = useCallback(async () => {
    try {
      const res = await api.users.listUsers();
      if (res && res.users && res.users.length > 0) {
        const combined: (UserWithRole & { password?: string; user_id?: string })[] = res.users.map(
          (u: any) => ({
            id: u.id,
            user_id: u.user_id,
            username: (u.user_id || "").toLowerCase(),
            name: u.name,
            full_name: u.name,
            mobile: u.mobile,
            email: u.email,
            role: u.role === "admin" || u.email === "admin@facetube.com" ? "admin" : "user",
            channel_logo_url: u.channel_logo_url || null,
            channel_name: u.channel_name || null,
            referral_code: u.referral_code,
            created_at: u.created_at,
          }),
        );
        setUsersList(combined);
        return;
      }
    } catch {
      // fallback to local list
    }
    syncUsersList();
  }, [syncUsersList]);

  const restoreLocalSession = useCallback(() => {
    try {
      const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        setUser(parsed.user || null);
        setProfile(parsed.profile || null);
        setDbUser(parsed.dbUser || null);
        setRole(parsed.role || "user");
        return parsed;
      }
    } catch (_e) {
      // Storage unavailable
    }
    return null;
  }, []);

  // Initialization & Auth Verification from PHP backend
  useEffect(() => {
    syncUsersList();
    const restored = restoreLocalSession();

    // Check current active session with PHP backend
    api.auth
      .me()
      .then((res) => {
        if (res && res.authenticated && res.user) {
          const u = res.user;
          const resolvedRole: RoleType =
            u.role === "admin" || u.email === "admin@facetube.com" ? "admin" : "user";
          const newProfile: Profile = {
            id: u.id,
            user_id: u.user_id,
            username: u.user_id,
            name: u.name,
            full_name: u.name,
            mobile: u.mobile,
            email: u.email,
            avatar_url: u.avatar_url,
            channel_logo_url: u.channel_logo_url || null,
            channel_name: u.channel_name || null,
            referral_code: u.referral_code,
            created_at: u.created_at,
          };
          const authUser: User = {
            id: u.id,
            email: u.email,
            user_metadata: {
              name: u.name,
              full_name: u.name,
              mobile: u.mobile,
              user_id: u.user_id,
              avatar_url: u.avatar_url,
              channel_logo_url: u.channel_logo_url,
              channel_name: u.channel_name,
            },
          };
          const newDbUser: DbUser = {
            id: u.id,
            user_id: u.user_id,
            name: u.name,
            mobile: u.mobile,
            email: u.email,
            password_hash: "SECURED_BY_PHP_BCRYPT",
            referral_code: u.referral_code,
            created_at: u.created_at,
            role: resolvedRole,
          };
          setUser(authUser);
          setProfile(newProfile);
          setDbUser(newDbUser);
          setRole(resolvedRole);

          try {
            localStorage.setItem(
              LOCAL_STORAGE_SESSION_KEY,
              JSON.stringify({
                user: authUser,
                profile: newProfile,
                dbUser: newDbUser,
                role: resolvedRole,
              }),
            );
          } catch (_e) {
            // Storage unavailable
          }
        } else {
          // Server explicitly responded that session is not authenticated (HTTP 200 with authenticated: false)
          setUser(null);
          setProfile(null);
          setDbUser(null);
          setRole("user");
          setStoredAuthToken(null);
          try {
            localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
          } catch (_e) {
            // Ignore storage removal errors
          }
        }
      })
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 403) {
          // Explicit unauthenticated or unauthorized status from server
          setUser(null);
          setProfile(null);
          setDbUser(null);
          setRole("user");
          setStoredAuthToken(null);
          try {
            localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
          } catch (_e) {
            // Ignore storage removal errors
          }
        } else {
          // Transient network failure, timeout, HTTP 5xx, or temporary server unavailability:
          // Do NOT erase stored token or cached user session. If a restored session is present, keep it.
          if (restored) {
            setUser(restored.user || null);
            setProfile(restored.profile || null);
            setDbUser(restored.dbUser || null);
            setRole(restored.role || "user");
          }
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [syncUsersList, restoreLocalSession]);

  /**
   * Database-backed User Registration via PHP MySQL Backend
   */
  const signUp = async (params: SignUpParams): Promise<SignUpResult> => {
    try {
      const registerParams: SignUpParams = {
        name: params.name || params.fullName || "FaceTube User",
        mobile: params.mobile,
        email: params.email,
        password: params.password,
      };
      if (params.referralCode !== undefined) {
        registerParams.referralCode = params.referralCode;
      }

      const {
        user: newDbUser,
        userId,
        emailDelivery,
      } = await registerUserInDatabase(registerParams);

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

      const authUser: User = {
        id: newDbUser.id,
        email: newDbUser.email,
        user_metadata: {
          name: newDbUser.name,
          full_name: newDbUser.name,
          mobile: newDbUser.mobile,
          user_id: userId,
        },
      };

      setDbUser(newDbUser);
      setProfile(newProfile);
      setUser(authUser);
      setRole(newDbUser.role || "user");

      // Save active session
      try {
        localStorage.setItem(
          LOCAL_STORAGE_SESSION_KEY,
          JSON.stringify({
            user: authUser,
            profile: newProfile,
            dbUser: newDbUser,
            role: newDbUser.role || "user",
          }),
        );
      } catch (_e) {
        // storage disabled
      }

      syncUsersList();

      let cleanEmailDelivery: SignUpResult["emailDelivery"] | undefined = undefined;
      if (emailDelivery) {
        cleanEmailDelivery = {
          success: emailDelivery.success,
        };
        if (emailDelivery.provider !== undefined) {
          cleanEmailDelivery.provider = emailDelivery.provider;
        }
        if (emailDelivery.error !== undefined) {
          cleanEmailDelivery.error = emailDelivery.error;
        }
        if (emailDelivery.messageId !== undefined) {
          cleanEmailDelivery.messageId = emailDelivery.messageId;
        }
      }

      const signUpResult: SignUpResult = {
        success: true,
        user: newDbUser,
        userId,
        error: null,
      };
      if (cleanEmailDelivery !== undefined) {
        signUpResult.emailDelivery = cleanEmailDelivery;
      }

      return signUpResult;
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  };

  /**
   * Database-backed Login: Supports login using User ID (FT123456) OR Email via PHP API
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
      // 1. Authenticate with Hostinger PHP MySQL backend
      let loginRes;
      try {
        loginRes = await api.auth.login({
          identifier: rawIdentifier,
          password,
        });
      } catch (apiErr: unknown) {
        const msg =
          apiErr instanceof Error
            ? apiErr.message
            : "Database authentication error. Please verify your connection.";
        return {
          success: false,
          error: new Error(msg),
        };
      }

      if (!loginRes || !loginRes.success || !loginRes.user) {
        return {
          success: false,
          error: new Error(
            loginRes?.message ||
              "Authentication failed. Please verify your User ID or Email and password.",
          ),
        };
      }

      const authenticatedUser = loginRes.user;

      // 3. Set authenticated state
      const resolvedRole: RoleType =
        authenticatedUser.role ||
        (authenticatedUser.email === "admin@facetube.com" ? "admin" : "user");

      const authProfile: Profile = {
        id: authenticatedUser.id,
        user_id: authenticatedUser.user_id,
        username: authenticatedUser.user_id,
        name: authenticatedUser.name,
        full_name: authenticatedUser.name,
        mobile: authenticatedUser.mobile,
        email: authenticatedUser.email,
        channel_logo_url: authenticatedUser.channel_logo_url || null,
        channel_name: authenticatedUser.channel_name || null,
        referral_code: authenticatedUser.referral_code,
        created_at: authenticatedUser.created_at,
      };

      const authUser: User = {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        user_metadata: {
          user_id: authenticatedUser.user_id,
          name: authenticatedUser.name,
          full_name: authenticatedUser.name,
          mobile: authenticatedUser.mobile,
          channel_logo_url: authenticatedUser.channel_logo_url,
          channel_name: authenticatedUser.channel_name,
        },
      };

      const dbUserRecord: DbUser = {
        id: authenticatedUser.id,
        user_id: authenticatedUser.user_id,
        name: authenticatedUser.name,
        mobile: authenticatedUser.mobile,
        email: authenticatedUser.email,
        password_hash: "SECURED_BY_PHP_BCRYPT",
        channel_logo_url: authenticatedUser.channel_logo_url || null,
        channel_name: authenticatedUser.channel_name || null,
        referral_code: authenticatedUser.referral_code,
        created_at: authenticatedUser.created_at,
        role: resolvedRole,
      };

      setDbUser(dbUserRecord);
      setProfile(authProfile);
      setUser(authUser);
      setRole(resolvedRole);

      try {
        localStorage.setItem(
          LOCAL_STORAGE_SESSION_KEY,
          JSON.stringify({
            user: authUser,
            profile: authProfile,
            dbUser: dbUserRecord,
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
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    setStoredAuthToken(null);
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

    try {
      await api.admin.updateRole(targetUserId, newRole);
    } catch (e) {
      console.warn("API role update error:", e);
    }

    // Update in local usersList
    setUsersList((prev) =>
      prev.map((u) => {
        if (
          u.id === targetUserId ||
          u.user_id?.toUpperCase() === targetUserId.toUpperCase() ||
          u.username.toUpperCase() === targetUserId.toUpperCase()
        ) {
          return { ...u, role: newRole };
        }
        return u;
      }),
    );

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        dbUser,
        role,
        isAdmin: role === "admin",
        isLoading,
        isConfigured: true,
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
