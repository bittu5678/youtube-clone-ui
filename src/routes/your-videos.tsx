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
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { allVideos } from "@/data/videos";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/your-videos")({
  head: () => ({
    meta: [
      { title: "Your Videos — Channel Content — FaceTube" },
      {
        name: "description",
        content:
          "Manage your uploaded videos, track monetization revenue, and publish new content on FaceTube.",
      },
    ],
  }),
  component: YourVideosPage,
});

function YourVideosPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"Uploads" | "Shorts" | "Live">("Uploads");

  const channelName = profile?.username || user?.email?.split("@")[0] || "Creator";
  const channelVideos = allVideos.slice(0, 5).map((v, i) => ({
    ...v,
    revenue: ["$1,420.50", "$890.20", "$3,120.00", "$450.80", "$670.00"][i],
    monetized: true,
    visibility: "Public",
    comments: [48, 12, 114, 29, 34][i],
    likesPct: "98.4%",
  }));

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
                Channel content, analytics, and monetization management for {channelName}
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

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Published Videos</span>
              <Video className="h-4 w-4 text-brand" />
            </div>
            <p className="text-2xl font-black text-foreground mt-2">{channelVideos.length}</p>
            <span className="text-[11px] text-emerald-500 font-semibold">100% active</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Lifetime Views</span>
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-foreground mt-2">4.8M</p>
            <span className="text-[11px] text-emerald-500 font-semibold">+18.2% this month</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Est. Ads Earnings ($)</span>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-500 mt-2">$6,551.50</p>
            <span className="text-[11px] text-amber-500 font-semibold">70% revenue share</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Channel Status</span>
              <Sparkles className="h-4 w-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-foreground mt-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Verified Partner
            </p>
            <span className="text-[11px] text-muted-foreground">Good standing</span>
          </div>
        </div>

        {/* Channel Videos Table / List */}
        <div className="rounded-3xl border border-border bg-card overflow-hidden">
          {/* Table Tabs */}
          <div className="flex items-center gap-2 border-b border-border px-5 py-3 bg-secondary/30">
            {(["Uploads", "Shorts", "Live"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  activeTab === tab
                    ? "bg-brand text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="divide-y divide-border overflow-x-auto">
            {channelVideos.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-secondary/20 transition"
              >
                {/* Thumbnail + Title */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0 w-32 aspect-video rounded-xl overflow-hidden bg-black">
                    <img src={item.thumb} alt={item.title} className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white">
                      {item.duration}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <Link
                      to="/watch/$videoId"
                      params={{ videoId: item.id }}
                      className="text-xs sm:text-sm font-bold text-foreground hover:text-brand transition-colors line-clamp-1 flex items-center gap-1.5"
                    >
                      {item.title}
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      Uploaded {item.age} · Category: {item.category}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Monetized ({item.revenue})
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {item.visibility}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0 pl-3 sm:pl-0">
                  <div className="text-right">
                    <span className="block font-bold text-foreground">{item.views}</span>
                    <span className="text-[10px]">views</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-foreground">{item.likesPct}</span>
                    <span className="text-[10px] flex items-center gap-1 justify-end">
                      <ThumbsUp className="h-2.5 w-2.5" /> likes
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-foreground">{item.comments}</span>
                    <span className="text-[10px] flex items-center gap-1 justify-end">
                      <MessageSquare className="h-2.5 w-2.5" /> comments
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
