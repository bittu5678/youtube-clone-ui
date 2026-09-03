import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  Settings,
  History,
  Clock,
  ThumbsUp,
  Video,
  ShieldCheck,
  LogOut,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Play,
  Share2,
} from "lucide-react";
import { Logo } from "@/components/videohub/Logo";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { BottomNav } from "@/components/videohub/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { recommended, recent, type Video as VideoType } from "@/data/videos";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "You — FaceTube" },
      {
        name: "description",
        content:
          "Your FaceTube channel profile, watch history, saved playlists, and account settings.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, role: _role, isAdmin, signOut, signIn, allUsers } = useAuth();
  const [demoSwitchOpen, setDemoSwitchOpen] = useState(false);

  const historyVideos: VideoType[] = recent.slice(0, 4);
  const savedVideos: VideoType[] = recommended.slice(0, 4);

  const handleSwitchUser = async (email: string) => {
    try {
      await signIn({ email, password: "password123" });
      setDemoSwitchOpen(false);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-brand selection:text-white pb-24 md:pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={30} />
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-brand">
              You
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle showLabelsOnWide={false} />
            <Link
              to="/auth"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              aria-label="Account settings"
              title="Account settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Profile Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 space-y-8">
        {/* User Identity Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="grid h-18 w-18 place-items-center rounded-full bg-gradient-to-br from-brand via-brand-dark to-black text-2xl font-bold text-white ring-4 ring-brand/20 shadow-md">
                {(profile?.username || user?.email || "Guest").charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-foreground">
                    {profile?.full_name || user?.email?.split("@")[0] || "Guest Viewer"}
                  </h1>
                  {isAdmin && (
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-brand-foreground shadow-sm">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  @{profile?.username || "guest"} · {user ? user.email : "Not signed in"}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    <strong>12.4K</strong> subscribers
                  </span>
                  <span>•</span>
                  <span>
                    <strong>86</strong> videos
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Switch account, Edit, Sign out */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDemoSwitchOpen((o) => !o)}
                className="rounded-full border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
              >
                Switch Account
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-500/20"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="rounded-full bg-brand px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Quick Demo Switcher Drawer */}
          {demoSwitchOpen && (
            <div className="mt-5 pt-5 border-t border-border/70 space-y-2 animate-in fade-in">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick switch to demo user profile:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(allUsers || []).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSwitchUser(u.email)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs text-left transition ${
                      user?.email === u.email
                        ? "border-brand bg-brand/10 font-bold text-brand ring-1 ring-brand"
                        : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{u.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        @{u.username} · {u.role}
                      </p>
                    </div>
                    {user?.email === u.email && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Hub Navigation Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/upload"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand/50 hover:shadow-sm"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
              <Video className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Your Videos</span>
            <span className="text-[10px] text-muted-foreground">Creator Studio</span>
          </Link>

          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand/50 hover:shadow-sm"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/10 text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Watch Later</span>
            <span className="text-[10px] text-muted-foreground">14 saved</span>
          </Link>

          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand/50 hover:shadow-sm"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/10 text-amber-500">
              <ThumbsUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Liked Videos</span>
            <span className="text-[10px] text-muted-foreground">48 items</span>
          </Link>

          {isAdmin ? (
            <Link
              to="/admin"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand/50 hover:shadow-sm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-purple-500/10 text-purple-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-foreground">Admin Portal</span>
              <span className="text-[10px] text-muted-foreground">Manage platform</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand/50 hover:shadow-sm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Settings className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-foreground">Settings</span>
              <span className="text-[10px] text-muted-foreground">Preferences</span>
            </Link>
          )}
        </div>

        {/* History Section (horizontal scroll shelf) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-brand" />
              <h2 className="text-base font-bold text-foreground">History</h2>
            </div>
            <Link to="/" className="text-xs font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {historyVideos.map((v) => (
              <Link
                key={v.id}
                to="/watch/$videoId"
                params={{ videoId: v.id }}
                className="group rounded-xl border border-border bg-card p-2 transition-all hover:border-brand/40"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-2">
                  <img
                    src={v.thumb}
                    alt={v.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-90"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white">
                    {v.duration}
                  </span>
                  {/* Progress watched bar */}
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-red-600 w-3/4" />
                </div>
                <h3 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-brand transition-colors">
                  {v.title}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{v.channel}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Playlists & Saved shelf */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" />
              <h2 className="text-base font-bold text-foreground">Playlists & Saved</h2>
            </div>
            <Link to="/" className="text-xs font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {savedVideos.map((v) => (
              <Link
                key={v.id}
                to="/watch/$videoId"
                params={{ videoId: v.id }}
                className="group rounded-xl border border-border bg-card p-2 transition-all hover:border-brand/40"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-2">
                  <img
                    src={v.thumb}
                    alt={v.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-90"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white">
                    {v.duration}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-brand transition-colors">
                  {v.title}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {v.channel} · {v.views}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Fixed Bottom Navigation with 5 tabs */}
      <BottomNav />
    </div>
  );
}
