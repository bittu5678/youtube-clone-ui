import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  Film,
  Activity,
  UserCheck,
  UserX,
  Copy,
  Check,
  ArrowLeft,
  Database,
  Search,
  Sparkles,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Navbar } from "@/components/videohub/Navbar";
import { Sidebar } from "@/components/videohub/Sidebar";
import { BottomNav } from "@/components/videohub/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { allVideos } from "@/data/videos";
import type { RoleType } from "@/types/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — FaceTube" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "FaceTube Admin Dashboard and Role-Based Access Control." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    role,
    isAdmin,
    isLoading,
    isConfigured,
    allUsers,
    updateUserRole,
    refreshUsers,
  } = useAuth();

  const [railOpen, setRailOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // REDIRECT RULE: Only admin can access /admin. Users trying to open /admin are redirected to Home (/).
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate({ to: "/" });
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Verifying admin permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div className="max-w-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Access Restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only users with the <strong className="text-foreground">admin</strong> role are
            permitted to view the Admin Console. Redirecting to home...
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-lift"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const adminCount = allUsers.filter((u) => u.role === "admin").length;
  const standardUserCount = allUsers.filter((u) => u.role === "user").length;

  const handleRoleToggle = async (targetId: string, currentRole: RoleType) => {
    const nextRole: RoleType = currentRole === "admin" ? "user" : "admin";
    setUpdatingId(targetId);
    await updateUserRole(targetId, nextRole);
    setUpdatingId(null);
  };

  const sqlMigrationCode = `-- Run this in Supabase SQL Editor to initialize tables & RLS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar
        onToggleSidebar={() => {
          setRailOpen((v) => !v);
          setDrawerOpen((v) => !v);
        }}
      />

      <div className="flex">
        <Sidebar open={railOpen} drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
          {/* Header Banner */}
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/15 text-brand">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-brand">
                  FaceTube Admin Portal
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Platform & Role Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage user access levels, examine security policies, and monitor system metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refreshUsers()}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/70 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lift transition hover:bg-brand-dark"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Feed
              </Link>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Users
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{allUsers.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Registered accounts</p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Administrators
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{adminCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Active admin privileges</p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Standard Users
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <UserCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{standardUserCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Role = 'user' (default)</p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Published Videos
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Film className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{allVideos.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">FaceTube stream catalog</p>
            </div>
          </div>

          {/* User & Role Management Table */}
          <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold">User Directory & Role Assignments</h2>
                <p className="text-xs text-muted-foreground">
                  Change role between <strong className="text-foreground">user</strong> and{" "}
                  <strong className="text-foreground">admin</strong> in real time.
                </p>
              </div>

              <div className="flex h-10 w-full max-w-xs items-center rounded-xl border border-border bg-secondary/50 px-3 transition focus-within:border-brand">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Filter by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-full w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pl-2 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Registered</th>
                    <th className="pb-3 pr-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((u) => {
                    const isTargetAdmin = u.role === "admin";
                    const isSelf = u.id === user?.id;
                    return (
                      <tr key={u.id} className="transition hover:bg-secondary/30">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                                isTargetAdmin
                                  ? "bg-gradient-to-br from-brand to-brand-dark"
                                  : "bg-slate-700"
                              }`}
                            >
                              {u.username.substring(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground flex items-center gap-1.5">
                                {u.user_id && (
                                  <span className="font-mono text-xs font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                                    {u.user_id}
                                  </span>
                                )}
                                <span>{u.name || u.full_name || `@${u.username}`}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-normal text-muted-foreground">
                                    (You)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {u.mobile ? `${u.mobile} · ` : ""}@{u.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-xs text-muted-foreground">{u.email}</td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                              isTargetAdmin
                                ? "bg-brand/15 text-brand"
                                : "bg-secondary text-foreground/80"
                            }`}
                          >
                            {isTargetAdmin ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <button
                            type="button"
                            disabled={updatingId === u.id}
                            onClick={() => handleRoleToggle(u.id, u.role)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              isTargetAdmin
                                ? "border border-border bg-secondary text-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                : "bg-brand text-brand-foreground shadow-lift hover:bg-brand-dark"
                            }`}
                          >
                            {updatingId === u.id
                              ? "Updating..."
                              : isTargetAdmin
                                ? "Demote to User"
                                : "Promote to Admin"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Database & RLS Migration Information */}
          <section className="mt-8 rounded-2xl border border-border bg-secondary/20 p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-brand" />
                <h3 className="text-base font-bold">Supabase Schema & RLS Policies</h3>
              </div>
              <button
                type="button"
                onClick={copySql}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
              >
                {copiedSql ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiedSql ? "Copied SQL" : "Copy SQL Migration"}
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              All tables (<code className="text-foreground">profiles</code>,{" "}
              <code className="text-foreground">user_roles</code>) and Row Level Security policies
              have been generated in{" "}
              <code className="text-foreground">/supabase/migrations/20260901_init_schema.sql</code>
              .
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/80 p-4 text-[11px] leading-relaxed text-white/90">
              <code>{sqlMigrationCode}</code>
            </pre>
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
