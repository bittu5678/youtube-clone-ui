import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Settings,
  User,
  Moon,
  Volume2,
  Bell,
  Shield,
  Sliders,
  Check,
  LogOut,
  Sparkles,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FaceTube" },
      {
        name: "description",
        content: "Manage your FaceTube account, appearance theme, playback settings, and privacy preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [autoplay, setAutoplay] = useState(true);
  const [highQuality, setHighQuality] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [captions, setCaptions] = useState(false);

  return (
    <VideoHubLayout>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Customize your FaceTube experience, account, and playback preferences
            </p>
          </div>
        </div>

        {/* Account Section */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white font-bold">
                {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {profile?.username || user?.email || "FaceTube User"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {user ? user.email : "Signed in with local profile"}
                  {isAdmin && " · Administrator"}
                </p>
              </div>
            </div>

            <Link
              to="/profile"
              className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-brand hover:text-white transition"
            >
              View Profile
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {isAdmin && (
              <Link
                to="/admin"
                className="rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-bold text-brand hover:bg-brand hover:text-white transition"
              >
                Open Admin Portal
              </Link>
            )}
            <Link
              to="/auth"
              className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-secondary/80 transition"
            >
              Switch Account
            </Link>
            {user && (
              <button
                type="button"
                onClick={signOut}
                className="rounded-full text-red-500 bg-red-500/10 px-3 py-1 text-xs font-semibold hover:bg-red-500/20 transition"
              >
                Sign Out
              </button>
            )}
          </div>
        </section>

        {/* Appearance / Theme */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-brand" />
              <div>
                <h2 className="text-base font-bold text-foreground">Appearance & Theme</h2>
                <p className="text-xs text-muted-foreground">
                  Choose Dark, Light, or follow your System preferences
                </p>
              </div>
            </div>

            <ThemeToggle />
          </div>
        </section>

        {/* Playback & Performance */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Sliders className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-foreground">Playback & Audio</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-foreground">Autoplay Next Video</p>
                <p className="text-xs text-muted-foreground">
                  Automatically start playing recommended content when a video ends
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
                className="h-5 w-5 accent-brand rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-foreground">High Quality Streaming (1080p / 4K)</p>
                <p className="text-xs text-muted-foreground">
                  Prefer highest resolution bitrate on unmetered broadband connections
                </p>
              </div>
              <input
                type="checkbox"
                checked={highQuality}
                onChange={(e) => setHighQuality(e.target.checked)}
                className="h-5 w-5 accent-brand rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-foreground">Always Show Closed Captions</p>
                <p className="text-xs text-muted-foreground">
                  Display subtitles by default on supported video tracks
                </p>
              </div>
              <input
                type="checkbox"
                checked={captions}
                onChange={(e) => setCaptions(e.target.checked)}
                className="h-5 w-5 accent-brand rounded cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Notifications & Privacy */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Bell className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-foreground">Notifications & Activity</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-foreground">Channel Upload Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive alerts when channels you subscribe to upload fresh videos
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="h-5 w-5 accent-brand rounded cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Privacy & History Quick Access */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Shield className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-foreground">Data & Privacy</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/history"
              className="flex-1 rounded-2xl border border-border bg-secondary/50 p-3 hover:bg-secondary transition"
            >
              <h3 className="text-xs font-bold text-foreground">Manage Watch History</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Review viewed videos, pause history tracking, or clear records
              </p>
            </Link>

            <Link
              to="/liked-videos"
              className="flex-1 rounded-2xl border border-border bg-secondary/50 p-3 hover:bg-secondary transition"
            >
              <h3 className="text-xs font-bold text-foreground">Manage Liked Videos</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Organize playlist visibility and favorite video collections
              </p>
            </Link>
          </div>
        </section>
      </div>
    </VideoHubLayout>
  );
}
