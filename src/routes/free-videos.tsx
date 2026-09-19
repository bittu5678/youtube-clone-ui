import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Video,
  Plus,
  Eye,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Lock,
  Globe,
  Share2,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { allVideos } from "@/data/videos";

export const Route = createFileRoute("/free-videos")({
  head: () => ({
    meta: [
      { title: "Free Videos — Your Videos — FaceTube" },
      {
        name: "description",
        content:
          "Manage public, free-to-watch video uploads and standard channel content on FaceTube.",
      },
    ],
  }),
  component: FreeVideosPage,
});

function FreeVideosPage() {
  const freeVideosList = allVideos.slice(0, 8);

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Free Videos
              </h1>
              <p className="text-sm text-muted-foreground">
                Public videos available to all viewers without subscription or paywall requirements
              </p>
            </div>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Upload Free Video
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Free Videos</span>
            <p className="text-2xl font-black text-sky-400">14</p>
            <p className="text-[11px] text-muted-foreground">Public videos</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Lifetime Views</span>
            <p className="text-2xl font-black text-foreground">142.5K</p>
            <p className="text-[11px] text-emerald-400 font-semibold">+18.2% this month</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Avg Watch Time</span>
            <p className="text-2xl font-black text-foreground">8m 42s</p>
            <p className="text-[11px] text-muted-foreground">58% retention rate</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Access Status</span>
            <p className="text-2xl font-black text-emerald-400">100% Free</p>
            <p className="text-[11px] text-muted-foreground">All viewers worldwide</p>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {freeVideosList.map((video) => (
            <div
              key={video.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 right-2 rounded-md bg-black/85 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                  {video.duration}
                </span>
                <span className="absolute top-2 left-2 rounded-md bg-sky-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                  <Globe className="h-2.5 w-2.5" /> Free
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="line-clamp-2 text-xs font-bold text-foreground leading-snug group-hover:text-brand transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span>{video.views}</span>
                  <span>{video.uploadedAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VideoHubLayout>
  );
}
