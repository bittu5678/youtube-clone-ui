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
  Trash2,
  Edit3,
  TrendingUp,
  DollarSign,
  Eye,
  ListVideo,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/videohub/Logo";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { BottomNav } from "@/components/videohub/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { recommended, recent, type Video as VideoType } from "@/data/videos";
import { SHORTS_LIST } from "@/data/shorts";

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
  const [activeTab, setActiveTab] = useState<"videos" | "shorts" | "playlists">("videos");
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Editable Profile State
  const [channelName, setChannelName] = useState(
    profile?.full_name || profile?.username || "Aria Studio",
  );
  const [channelHandle, setChannelHandle] = useState(profile?.username || "ariakapoor");
  const [channelBio, setChannelBio] = useState(
    "Building full-stack web applications, modern UI kits, and sharing creative tutorials weekly.",
  );

  // User's own videos list with deletion capability
  const [userVideos, setUserVideos] = useState<VideoType[]>([
    {
      id: "uv-1",
      title: "Building a Full-Stack YouTube Clone with React 19 & Tailwind CSS",
      channel: channelName,
      views: "142K views",
      age: "3 days ago",
      duration: "34:20",
      category: "Coding",
      thumb:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      description: "Full guide covering real-time chat, video player, and dark mode.",
      initials: "AS",
      tint: "#e11d48",
    },
    {
      id: "uv-2",
      title: "Clean Code Architecture: How to Structure High-Growth React Apps",
      channel: channelName,
      views: "89K views",
      age: "2 weeks ago",
      duration: "21:15",
      category: "Coding",
      thumb:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      description: "State management, modular routing, and clean architectural patterns.",
      initials: "AS",
      tint: "#2563eb",
    },
    {
      id: "uv-3",
      title: "Next-Gen CSS Tips & Tricks: Typography, Grid, and Fluid Scaling",
      channel: channelName,
      views: "54K views",
      age: "1 month ago",
      duration: "18:40",
      category: "Design",
      thumb:
        "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
      description: "Advanced CSS layout tricks to elevate modern web interfaces.",
      initials: "AS",
      tint: "#10b981",
    },
    {
      id: "uv-4",
      title: "Mastering Database Schemas & Authentication Security Rules",
      channel: channelName,
      views: "36K views",
      age: "2 months ago",
      duration: "28:10",
      category: "Tech",
      thumb:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
      description: "Step-by-step security guidelines and robust database modeling.",
      initials: "AS",
      tint: "#8b5cf6",
    },
  ]);

  const historyVideos: VideoType[] = recent.slice(0, 4);

  const handleSwitchUser = async (email: string) => {
    try {
      await signIn({ email, password: "password123" });
      setDemoSwitchOpen(false);
    } catch {
      // ignore
    }
  };

  const handleDeleteVideo = (id: string, title: string) => {
    setUserVideos((prev) => prev.filter((v) => v.id !== id));
    toast.success(`Deleted "${title.slice(0, 24)}..."`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileOpen(false);
    toast.success("Profile updated successfully!");
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
              to="/settings"
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
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand via-brand-dark to-black text-2xl font-bold text-white ring-4 ring-brand/20 shadow-md">
                {(channelName || "A").charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                    {channelName}
                  </h1>
                  {isAdmin && (
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-brand-foreground shadow-sm">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  @{channelHandle} · {user ? user.email : "creator@facetube.app"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground">12.4K</strong> subscribers
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-foreground">1.8M</strong> total views
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-foreground">{userVideos.length}</strong> videos
                  </span>
                </div>
                <p className="mt-2 text-xs text-foreground/80 line-clamp-2 max-w-xl">
                  {channelBio}
                </p>
              </div>
            </div>

            {/* Actions: Edit Profile, Switch account, Sign out */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setEditProfileOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Profile
              </button>

              <button
                type="button"
                onClick={() => setDemoSwitchOpen((o) => !o)}
                className="rounded-full border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
              >
                Switch User
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

        {/* Analytics Summary Card */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />
              Channel Analytics (Last 28 Days)
            </h2>
            <Link to="/your-videos" className="text-xs font-semibold text-brand hover:underline">
              Full Studio
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Views</span>
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-foreground">1.8M</p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-500">
                +14.2% vs previous period
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Watch Time</span>
                <Clock className="h-4 w-4 text-purple-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-foreground">84.2K hrs</p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-500">
                +9.8% vs previous period
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Estimated Revenue</span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-foreground">$4,280.50</p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-500">+$520.20 this month</p>
            </div>
          </div>
        </section>

        {/* Profile Tabs: Videos | Shorts | Playlists */}
        <section className="space-y-4">
          <div className="flex border-b border-border">
            {(
              [
                { id: "videos", label: "Videos", count: userVideos.length },
                { id: "shorts", label: "Shorts", count: SHORTS_LIST.length },
                { id: "playlists", label: "Playlists", count: 3 },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "text-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab 1: Videos Grid with Delete video option */}
          {activeTab === "videos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {userVideos.length} uploaded videos
                </p>
                <Link
                  to="/upload"
                  className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark shadow-sm"
                >
                  Upload New
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {userVideos.map((v) => (
                  <div
                    key={v.id}
                    className="group relative rounded-2xl border border-border bg-card p-2.5 transition-all hover:border-brand/40 hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <Link to="/watch/$videoId" params={{ videoId: v.id }} className="block">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-2.5">
                          <img
                            src={v.thumb}
                            alt={v.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-90"
                          />
                          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {v.duration}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-brand transition-colors">
                          {v.title}
                        </h3>
                      </Link>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {v.views} · {v.age}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                        Monetized
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(v.id, v.title)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-destructive transition hover:bg-destructive/10 active:scale-95"
                        title="Delete video"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {userVideos.length === 0 && (
                <div className="py-12 text-center rounded-2xl border border-dashed border-border p-6">
                  <p className="text-sm font-semibold text-foreground">No videos uploaded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your first video to grow your channel audience.
                  </p>
                  <Link
                    to="/upload"
                    className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-xs font-bold text-white"
                  >
                    Upload Video
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Shorts Tab */}
          {activeTab === "shorts" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {SHORTS_LIST.map((short) => (
                <Link
                  key={short.id}
                  to="/shorts"
                  className="group relative rounded-2xl overflow-hidden border border-border bg-black aspect-[9/16] shadow-sm transition hover:scale-[1.02]"
                >
                  <img
                    src={short.thumb}
                    alt={short.title}
                    className="h-full w-full object-cover opacity-85 transition group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-bold line-clamp-2">{short.title}</p>
                    <p className="mt-1 text-[10px] text-white/80">{short.likes} likes</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Tab 3: Playlists Tab */}
          {activeTab === "playlists" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/watch-later"
                className="group rounded-2xl border border-border bg-card p-4 transition hover:border-brand/50 shadow-sm"
              >
                <div className="aspect-video rounded-xl bg-blue-500/10 flex flex-col items-center justify-center text-blue-500 mb-3 group-hover:bg-blue-500/20 transition">
                  <Clock className="h-8 w-8" />
                  <span className="mt-1 text-xs font-bold">Watch Later</span>
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-brand">
                  Watch Later
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Updated recently · Private</p>
              </Link>

              <Link
                to="/liked-videos"
                className="group rounded-2xl border border-border bg-card p-4 transition hover:border-brand/50 shadow-sm"
              >
                <div className="aspect-video rounded-xl bg-amber-500/10 flex flex-col items-center justify-center text-amber-500 mb-3 group-hover:bg-amber-500/20 transition">
                  <ThumbsUp className="h-8 w-8" />
                  <span className="mt-1 text-xs font-bold">Liked Videos</span>
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-brand">
                  Liked Videos
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All favorited videos · Private
                </p>
              </Link>

              <Link
                to="/history"
                className="group rounded-2xl border border-border bg-card p-4 transition hover:border-brand/50 shadow-sm"
              >
                <div className="aspect-video rounded-xl bg-brand/10 flex flex-col items-center justify-center text-brand mb-3 group-hover:bg-brand/20 transition">
                  <History className="h-8 w-8" />
                  <span className="mt-1 text-xs font-bold">Watch History</span>
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-brand">
                  Watch History
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Continuous stream · You only</p>
              </Link>
            </div>
          )}
        </section>

        {/* History shelf */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-brand" />
              <h2 className="text-base font-bold text-foreground">Recently Watched</h2>
            </div>
            <Link to="/history" className="text-xs font-semibold text-brand hover:underline">
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
      </main>

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Edit Channel Profile</h3>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Channel Name</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Handle</label>
                <div className="mt-1.5 flex items-center rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs text-foreground">
                  <span className="text-muted-foreground mr-1">@</span>
                  <input
                    type="text"
                    value={channelHandle}
                    onChange={(e) => setChannelHandle(e.target.value)}
                    required
                    className="w-full bg-transparent outline-none text-foreground text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Channel Description</label>
                <textarea
                  rows={3}
                  value={channelBio}
                  onChange={(e) => setChannelBio(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs text-foreground outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-5 py-2 text-xs font-bold text-white shadow-lift hover:bg-brand-dark transition active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation with 5 tabs */}
      <BottomNav />
    </div>
  );
}
