import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clapperboard,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { SHORTS_LIST } from "@/data/shorts";

export const Route = createFileRoute("/short-videos")({
  head: () => ({
    meta: [
      { title: "Short Videos — Your Videos — FaceTube" },
      {
        name: "description",
        content:
          "Manage vertical short videos, track viral view spikes, and monitor short-form monetization on FaceTube.",
      },
    ],
  }),
  component: ShortVideosPage,
});

function ShortVideosPage() {
  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Clapperboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Short Videos
              </h1>
              <p className="text-sm text-muted-foreground">
                Vertical 9:16 short-form reels, sound remix analytics, and Shorts Creator Fund
                earnings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/shorts"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              Watch Shorts Feed
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Upload Short
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Uploaded Shorts</span>
            <p className="text-2xl font-black text-brand">18</p>
            <p className="text-[11px] text-muted-foreground">Vertical reels</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Shorts Views</span>
            <p className="text-2xl font-black text-foreground">280.4K</p>
            <p className="text-[11px] text-emerald-400 font-semibold">+42% this week</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Likes</span>
            <p className="text-2xl font-black text-foreground">34.2K</p>
            <p className="text-[11px] text-muted-foreground">94.8% positive ratio</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Shorts Bonus Earned</span>
            <p className="text-2xl font-black text-emerald-400">$340.50</p>
            <p className="text-[11px] text-muted-foreground">Creator fund payout</p>
          </div>
        </div>

        {/* Shorts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {SHORTS_LIST.map((short) => (
            <div
              key={short.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40"
            >
              <div className="relative aspect-[9/16] w-full overflow-hidden bg-secondary">
                <img
                  src={short.thumbnail}
                  alt={short.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-2 left-2 right-2 space-y-1 text-white">
                  <p className="line-clamp-2 text-xs font-bold leading-tight">{short.title}</p>
                  <p className="text-[10px] text-white/80 font-medium">{short.views}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VideoHubLayout>
  );
}
