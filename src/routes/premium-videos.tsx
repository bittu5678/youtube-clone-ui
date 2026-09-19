import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Plus, Lock, Eye, DollarSign, TrendingUp, ShieldCheck } from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { allVideos } from "@/data/videos";

export const Route = createFileRoute("/premium-videos")({
  head: () => ({
    meta: [
      { title: "Premium Videos — Your Videos — FaceTube" },
      {
        name: "description",
        content: "Manage members-only, gated, and paywalled premium videos on FaceTube.",
      },
    ],
  }),
  component: PremiumVideosPage,
});

function PremiumVideosPage() {
  const premiumVideosList = allVideos.slice(4, 10).map((v, i) => ({
    ...v,
    price: ["$4.99", "$9.99", "$14.99", "$4.99", "$19.99", "$9.99"][i],
    subscribersOnly: i % 2 === 0,
    earnings: ["$420.00", "$180.00", "$890.50", "$210.00", "$640.00", "$320.00"][i],
  }));

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Premium Videos
              </h1>
              <p className="text-sm text-muted-foreground">
                Gated subscriber-exclusive content, pay-per-view courses, and high-tier
                masterclasses
              </p>
            </div>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Publish Premium Video
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Premium Uploads</span>
            <p className="text-2xl font-black text-amber-400">6</p>
            <p className="text-[11px] text-muted-foreground">Subscriber gated</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Premium Revenue</span>
            <p className="text-2xl font-black text-emerald-400">$2,660.50</p>
            <p className="text-[11px] text-emerald-400 font-semibold">+32% vs last month</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Subscribers Unlocked</span>
            <p className="text-2xl font-black text-foreground">1,840</p>
            <p className="text-[11px] text-muted-foreground">Active tier memberships</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Average Price</span>
            <p className="text-2xl font-black text-foreground">$9.99</p>
            <p className="text-[11px] text-muted-foreground">Per gated course</p>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {premiumVideosList.map((video) => (
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
                <span className="absolute top-2 left-2 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black shadow-sm flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />{" "}
                  {video.subscribersOnly ? "Members Only" : video.price}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="line-clamp-2 text-xs font-bold text-foreground leading-snug group-hover:text-brand transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span className="font-bold text-emerald-400">Earned: {video.earnings}</span>
                  <span>{video.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VideoHubLayout>
  );
}
