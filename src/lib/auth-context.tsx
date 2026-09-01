import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Profile,
  RoleType,
  AuthContextType,
  SignUpParams,
  SignInParams,
  UserWithRole,
} from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USERS_KEY = "facetube_demo_users_v1";
const LOCAL_STORAGE_SESSION_KEY = "facetube_demo_session_v1";

const initialDemoUsers: (UserWithRole & { password?: string })[] = [
  {
    id: "user_admin_01",
    username: "admin",
    full_name: "Facetube Administrator",
    email: "admin@facetube.com",
    role: "admin",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    password: "password123",
  },
  {
    id: "user_alex_02",
    username: "alex_creator",
    full_name: "Alex Rivera",
    email: "alex@facetube.com",
    role: "user",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    password: "password123",
  },
  {
    id: "user_maya_03",
    username: "maya_travels",
    full_name: "Maya Lin",
    email: "maya@facetube.com",
    role: "user",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    password: "password123",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [_session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<RoleType>("user");
  const [isLoading, setIsLoading] = useState(true);
  const [usersList, setUsersList] =
    useState<(UserWithRole & { password?: string })[]>(initialDemoUsers);

  // Initialize demo users list from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (stored) {
        setUsersList(JSON.parse(stored));
      } else {
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(initialDemoUsers));
      }
    } catch (_e) {
      // Storage unavailable in restricted sandbox
    }
  }, []);

  const saveDemoUsers = (list: typeof initialDemoUsers) => {
    setUsersList(list);
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(list));
    } catch (_e) {
      // Storage unavailable
    }
  };

  // Fetch profile and role from Supabase
  const fetchSupabaseProfileAndRole = useCallback(async (supabaseUser: User) => {
    if (!supabase) return;

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .maybeSingle();

      if (profileErr && profileErr.code !== "PGRST116") {
        console.warn("Error fetching profile:", profileErr);
      }

      if (profileData) {
        setProfile(profileData as Profile);
      } else {
        // Create profile if missing
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

        const { data: createdProf } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        setProfile((createdProf as Profile) || newProfile);
      }

      // 2. Fetch Role
      const { data: roleData, error: roleErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", supabaseUser.id)
        .maybeSingle();

      if (roleErr && roleErr.code !== "PGRST116") {
        console.warn("Error fetching role:", roleErr);
      }

      if (roleData && (roleData.role === "admin" || roleData.role === "user")) {
        setRole(roleData.role as RoleType);
      } else {
        // Default role is user
        setRole("user");
        await supabase
          .from("user_roles")
          .insert({ user_id: supabaseUser.id, role: "user" })
          .catch(() => {
            // Role may already exist
          });
      }
    } catch (e) {
      console.error("Error loading user profile & role:", e);
      setRole("user");
    }
  }, []);

  // Refresh all users list for admin dashboard
  const refreshUsers = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, email, created_at");

        const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");

        if (profilesData) {
          const combined: UserWithRole[] = profilesData.map((p) => {
            const userRole = rolesData?.find((r) => r.user_id === p.id)?.role || "user";
            return {
              id: p.id,
              username: p.username,
              full_name: p.full_name,
              email: p.email || "",
              role: userRole as RoleType,
              created_at: p.created_at || new Date().toISOString(),
            };
          });
          setUsersList(combined);
        }
      } catch (e) {
        console.error("Error refreshing users:", e);
      }
      return;
    }

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (stored) {
        setUsersList(JSON.parse(stored));
      }
    } catch (_e) {
      // Storage unavailable
    }
  }, []);

  // Initialization & Auth State Subscription
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session: initSession } }) => {
        setSession(initSession);
        setUser(initSession?.user ?? null);
        if (initSession?.user) {
          fetchSupabaseProfileAndRole(initSession.user).finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
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
          setRole("user");
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local demo mode
      try {
        const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          setUser(parsed.user);
          setProfile(parsed.profile);
          setRole(parsed.role || "user");
        }
      } catch (_e) {
        // Storage unavailable
      }
      setIsLoading(false);
    }
  }, [fetchSupabaseProfileAndRole]);

  // Sign Up method
  const signUp = async ({ username, email, password, fullName }: SignUpParams) => {
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Check if username is already taken in profiles table
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", trimmedUsername)
          .maybeSingle();

        if (existingUser) {
          return {
            error: new Error(`Username "${trimmedUsername}" is already in use.`),
            success: false,
          };
        }

        // 2. Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              username: trimmedUsername,
              full_name: fullName || trimmedUsername,
            },
          },
        });

        if (error) {
          return { error, success: false };
        }

        if (data.user) {
          // Explicitly ensure profile & default role records exist
          const profileRecord: Profile = {
            id: data.user.id,
            username: trimmedUsername,
            full_name: fullName || trimmedUsername,
            email: trimmedEmail,
            created_at: new Date().toISOString(),
          };

          await supabase
            .from("profiles")
            .upsert(profileRecord)
            .catch(() => {
              // Trigger may have created it
            });

          await supabase
            .from("user_roles")
            .upsert({
              user_id: data.user.id,
              role: "user",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .catch(() => {
              // Trigger may have created it
            });

          await fetchSupabaseProfileAndRole(data.user);
        }

        return { error: null, success: true };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err : new Error(String(err)), success: false };
      }
    }

    // Local Demo Sign Up Fallback
    const existing = usersList.find(
      (u) => u.username.toLowerCase() === trimmedUsername || u.email.toLowerCase() === trimmedEmail,
    );
    if (existing) {
      if (existing.username.toLowerCase() === trimmedUsername) {
        return {
          error: new Error(`Username "${trimmedUsername}" is already taken.`),
          success: false,
        };
      }
      return { error: new Error(`Email "${trimmedEmail}" is already registered.`), success: false };
    }

    const newId = "user_" + Math.random().toString(36).substring(2, 9);
    const newUserRecord = {
      id: newId,
      username: trimmedUsername,
      email: trimmedEmail,
      full_name: fullName || trimmedUsername,
      role: "user" as RoleType,
      created_at: new Date().toISOString(),
      password,
    };

    const updatedList = [newUserRecord, ...usersList];
    saveDemoUsers(updatedList);

    const mockUser = {
      id: newId,
      email: trimmedEmail,
      user_metadata: { username: trimmedUsername, full_name: fullName },
    } as unknown as User;

    const mockProfile: Profile = {
      id: newId,
      username: trimmedUsername,
      full_name: fullName || trimmedUsername,
      email: trimmedEmail,
      created_at: new Date().toISOString(),
    };

    setUser(mockUser);
    setProfile(mockProfile);
    setRole("user");

    try {
      localStorage.setItem(
        LOCAL_STORAGE_SESSION_KEY,
        JSON.stringify({ user: mockUser, profile: mockProfile, role: "user" }),
      );
    } catch (_e) {
      // Storage unavailable
    }

    return { error: null, success: true };
  };

  // Sign In method
  const signIn = async ({ email, password }: SignInParams) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          return { error, success: false };
        }

        if (data.user) {
          await fetchSupabaseProfileAndRole(data.user);
        }

        return { error: null, success: true };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err : new Error(String(err)), success: false };
      }
    }

    // Local Demo Sign In Fallback
    const foundUser = usersList.find(
      (u) =>
        (u.email.toLowerCase() === trimmedEmail || u.username.toLowerCase() === trimmedEmail) &&
        (u.password ? u.password === password : true),
    );

    if (!foundUser) {
      return {
        error: new Error(
          "Invalid email/username or password. Demo admin: admin@facetube.com / password123",
        ),
        success: false,
      };
    }

    const mockUser = {
      id: foundUser.id,
      email: foundUser.email,
      user_metadata: { username: foundUser.username, full_name: foundUser.full_name },
    } as unknown as User;

    const mockProfile: Profile = {
      id: foundUser.id,
      username: foundUser.username,
      full_name: foundUser.full_name,
      email: foundUser.email,
      created_at: foundUser.created_at,
    };

    setUser(mockUser);
    setProfile(mockProfile);
    setRole(foundUser.role);

    try {
      localStorage.setItem(
        LOCAL_STORAGE_SESSION_KEY,
        JSON.stringify({ user: mockUser, profile: mockProfile, role: foundUser.role }),
      );
    } catch (_e) {
      // Storage unavailable
    }

    return { error: null, success: true };
  };

  // Sign Out method
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setRole("user");
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } catch (_e) {
      // Storage unavailable
    }
  };

  // Update user role (admin action)
  const updateUserRole = async (targetUserId: string, newRole: RoleType): Promise<boolean> => {
    if (role !== "admin") {
      console.error("Only admins can update roles.");
      return false;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("user_roles")
          .upsert({ user_id: targetUserId, role: newRole, updated_at: new Date().toISOString() });

        if (error) {
          console.error("Error updating role:", error);
          return false;
        }
        await refreshUsers();
        return true;
      } catch (e) {
        console.error("Failed to update role:", e);
        return false;
      }
    }

    // Local demo update
    const updated = usersList.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u));
    saveDemoUsers(updated);

    if (user && user.id === targetUserId) {
      setRole(newRole);
      try {
        localStorage.setItem(
          LOCAL_STORAGE_SESSION_KEY,
          JSON.stringify({ user, profile, role: newRole }),
        );
      } catch (_e) {
        // Storage unavailable
      }
    }

    return true;
  };

  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
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

// Separate hook export
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
