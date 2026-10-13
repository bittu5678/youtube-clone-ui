import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  Zap,
  Tag,
  Calendar,
  CreditCard,
  Megaphone,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import { DashboardSummaryCards } from "@/components/videohub/DashboardSummaryCards";
import {
  fetchUploadedVideos,
  calculateUserVideoCounts,
  type UploadedVideo,
  type VideoCategoryCounts,
} from "@/lib/video-service";
import { resolveVideoThumbnail, SVG_FALLBACK_THUMBNAIL } from "@/lib/thumbnail-service";

export const Route = createFileRoute("/your-videos")({
  head: () => ({
    meta: [
      { title: "Your Videos — Channel Studio — FaceTube" },
      {
        name: "description",
        content:
          "Manage Free Short Videos, Free Long Videos, Premium Short Videos, and Premium Long Videos on FaceTube.",
      },
    ],
  }),
  component: YourVideosPage,
});

function YourVideosPage() {
  const { user, profile, dbUser } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";
  const channelName = profile?.name || dbUser?.name || "Creator";

  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [videoFilter, setVideoFilter] = useState<
    "all" | "free_short" | "free_long" | "premium_short" | "premium_long"
  >("all");
  const [counts, setCounts] = useState<VideoCategoryCounts>({
    freeShort: 0,
    freeLong: 0,
    premiumShort: 0,
    premiumLong: 0,
    totalFree: 0,
    totalPremium: 0,
    totalUploaded: 0,
  });

  useEffect(() => {
    fetchUploadedVideos(userId).then((list) => {
      setVideos(list);
    });
    calculateUserVideoCounts(userId).then((c) => {
      setCounts(c);
    });
  }, [userId]);

  const filteredVideos = videos.filter((v) => {
    if (videoFilter === "free_short") return v.videoType === "free" && v.contentType === "short";
    if (videoFilter === "free_long") return v.videoType === "free" && v.contentType === "long";
    if (videoFilter === "premium_short")
      return v.videoType === "premium" && v.contentType === "short";
    if (videoFilter === "premium_long")
      return v.videoType === "premium" && v.contentType === "long";
    return true;
  });

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
                Channel content hub, metadata records, and upload table for {channelName} ({userId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/upload"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Upload New Video
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* REQUIREMENT 5 & 11: DEDICATED 4-TYPE VIDEO SUMMARY PILLS           */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setVideoFilter(videoFilter === "free_short" ? "all" : "free_short")}
            className={`rounded-2xl border p-4 text-left transition ${
              videoFilter === "free_short"
                ? "border-sky-500 bg-sky-500/15 ring-1 ring-sky-500/50"
                : "border-border bg-card hover:border-sky-500/40"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              FREE
            </span>
            <div className="text-2xl font-black text-foreground mt-0.5">{counts.freeShort}</div>
            <div className="text-xs font-semibold text-sky-300">1. Free Short Video</div>
          </button>

          <button
            type="button"
            onClick={() => setVideoFilter(videoFilter === "free_long" ? "all" : "free_long")}
            className={`rounded-2xl border p-4 text-left transition ${
              videoFilter === "free_long"
                ? "border-sky-500 bg-sky-500/15 ring-1 ring-sky-500/50"
                : "border-border bg-card hover:border-sky-500/40"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              FREE
            </span>
            <div className="text-2xl font-black text-foreground mt-0.5">{counts.freeLong}</div>
            <div className="text-xs font-semibold text-sky-300">2. Free Long Video</div>
          </button>

          <button
            type="button"
            onClick={() =>
              setVideoFilter(videoFilter === "premium_short" ? "all" : "premium_short")
            }
            className={`rounded-2xl border p-4 text-left transition ${
              videoFilter === "premium_short"
                ? "border-amber-400 bg-amber-400/15 ring-1 ring-amber-400/50"
                : "border-border bg-card hover:border-amber-400/40"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              PREMIUM (₹6)
            </span>
            <div className="text-2xl font-black text-foreground mt-0.5">{counts.premiumShort}</div>
            <div className="text-xs font-bold text-amber-300">3. Premium Short Video</div>
          </button>

          <button
            type="button"
            onClick={() => setVideoFilter(videoFilter === "premium_long" ? "all" : "premium_long")}
            className={`rounded-2xl border p-4 text-left transition ${
              videoFilter === "premium_long"
                ? "border-amber-400 bg-amber-400/15 ring-1 ring-amber-400/50"
                : "border-border bg-card hover:border-amber-400/40"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              PREMIUM (₹6)
            </span>
            <div className="text-2xl font-black text-foreground mt-0.5">{counts.premiumLong}</div>
            <div className="text-xs font-bold text-amber-300">4. Premium Long Video</div>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* REQUIREMENT 11: UPLOADED VIDEOS TABLE                              */}
        {/* Identifies Free Short, Free Long, Premium Short, Premium Long      */}
        {/* Metadata: Video ID, User ID, Video Type, Content Type, Date, etc.  */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Channel Uploads Ledger ({filteredVideos.length} Videos)
              </h2>
              <p className="text-xs text-muted-foreground">
                Verified database records with video type, content format, and payment verification
                status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVideoFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  videoFilter === "all"
                    ? "bg-brand text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                All Videos
              </button>
              <button
                type="button"
                onClick={() => setVideoFilter("free_short")}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  videoFilter === "free_short"
                    ? "bg-sky-500 text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Free Short
              </button>
              <button
                type="button"
                onClick={() => setVideoFilter("free_long")}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  videoFilter === "free_long"
                    ? "bg-sky-500 text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Free Long
              </button>
              <button
                type="button"
                onClick={() => setVideoFilter("premium_short")}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  videoFilter === "premium_short"
                    ? "bg-amber-500 text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Premium Short
              </button>
              <button
                type="button"
                onClick={() => setVideoFilter("premium_long")}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  videoFilter === "premium_long"
                    ? "bg-amber-500 text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Premium Long
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Video Title & ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">User ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Classification</th>
                  <th className="px-4 py-3 whitespace-nowrap">Content Format</th>
                  <th className="px-4 py-3 whitespace-nowrap">Upload Date</th>
                  <th className="px-4 py-3 whitespace-nowrap">Payment Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Promotion</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredVideos.map((vid) => {
                  const isPremium = vid.videoType === "premium";
                  const isShort = vid.contentType === "short";

                  return (
                    <tr key={vid.id} className="transition hover:bg-secondary/20">
                      {/* Video Title & Thumbnail */}
                      <td className="px-4 py-3.5">
                        <Link
                          to="/watch/$videoId"
                          params={{ videoId: vid.id }}
                          className="flex items-center gap-3 group/link"
                        >
                          <img
                            src={resolveVideoThumbnail(vid)}
                            alt={vid.title}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== SVG_FALLBACK_THUMBNAIL) {
                                target.src = SVG_FALLBACK_THUMBNAIL;
                              }
                            }}
                            className="h-10 w-16 rounded-lg object-cover shrink-0 bg-secondary"
                          />
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-foreground truncate group-hover/link:text-brand transition-colors">
                              {vid.title}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {vid.id}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* User ID */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-rose-400 whitespace-nowrap">
                        {vid.userId}
                      </td>

                      {/* Video Type (Free vs Premium) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPremium ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-black text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                            <Zap className="h-3 w-3 fill-amber-400 text-amber-300" />
                            Premium Video
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-400">
                            <Video className="h-3 w-3" />
                            Free Video
                          </span>
                        )}
                      </td>

                      {/* Content Type (Short vs Long) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isShort
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {isShort ? "Short Video (9:16)" : "Long Video (16:9)"}
                        </span>
                      </td>

                      {/* Upload Date */}
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {new Date(vid.createdAt).toLocaleDateString()}
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPremium ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            Paid (₹6)
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            Not Required (₹0)
                          </span>
                        )}
                      </td>

                      {/* Promotion Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {vid.isPromoted ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                            <Megaphone className="h-3 w-3" />
                            Promoted
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-foreground whitespace-nowrap">
                        {vid.views.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
