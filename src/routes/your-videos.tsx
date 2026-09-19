import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Video,
  Plus,
  DollarSign,
  Eye,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Clapperboard,
  Radio,
  Tv,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { allVideos } from "@/data/videos";
import { useAuth } from "@/lib/auth-context";
import { DashboardSummaryCards } from "@/components/videohub/DashboardSummaryCards";

export const Route = createFileRoute("/your-videos")({
  head: () => ({
    meta: [
      { title: "Your Videos — Channel Studio — FaceTube" },
      {
        name: "description",
        content:
          "Manage Free Videos, Premium Videos, Short Videos, Live Streams, Ad Placements, and Uploaded Images on FaceTube.",
      },
    ],
  }),
  component: YourVideosPage,
});

const videoCategories = [
  {
    title: "Free Videos",
    count: "14 Videos",
    desc: "Public free-to-watch standard videos",
    icon: Video,
    color: "text-sky-400 bg-sky-500/10",
    link: "/free-videos",
  },
  {
    title: "Premium Videos",
    count: "6 Videos",
    desc: "Subscriber-gated & paywalled masterclasses",
    icon: Sparkles,
    color: "text-amber-400 bg-amber-500/10",
    link: "/premium-videos",
  },
  {
    title: "Short Videos",
    count: "18 Shorts",
    desc: "Vertical 9:16 reels with viral engagement",
    icon: Clapperboard,
    color: "text-brand bg-brand/10",
    link: "/short-videos",
  },
  {
    title: "Live Videos",
    count: "3 Streams",
    desc: "Live broadcasts, stream keys & superchats",
    icon: Radio,
    color: "text-emerald-400 bg-emerald-500/10",
    link: "/live-videos",
  },
  {
    title: "Advertisement Videos",
    count: "5 Campaigns",
    desc: "Brand deals, sponsor mid-rolls & spots",
    icon: Tv,
    color: "text-purple-400 bg-purple-500/10",
    link: "/advertisement-videos",
  },
  {
    title: "Images Uploaded",
    count: "32 Assets",
    desc: "Thumbnails, community art & banners",
    icon: ImageIcon,
    color: "text-teal-400 bg-teal-500/10",
    link: "/images-uploaded",
  },
];

function YourVideosPage() {
  const { user, profile } = useAuth();
  const channelName = profile?.username || user?.email?.split("@")[0] || "Creator";

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Quick Create */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Your Videos
              </h1>
              <p className="text-sm text-muted-foreground">
                Channel content hub, monetization metrics, and video categories for {channelName}
              </p>
            </div>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Upload New Video
          </Link>
        </div>

        {/* Video Content Summary Cards */}
        <DashboardSummaryCards filterCategory="videos" />

        {/* 6 Video Subcategory Hubs */}
        <div className="space-y-3 pt-2">
          <h2 className="text-base font-extrabold text-foreground">Content Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videoCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.title}
                  to={cat.link}
                  className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-xl transition-transform group-hover:scale-105 ${cat.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-foreground">
                      {cat.count}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-foreground group-hover:text-brand transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
