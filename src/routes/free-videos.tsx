import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Video,
  Plus,
  Eye,
  Globe,
  RefreshCw,
  Clapperboard,
  Sparkles,
  Play,
  Filter,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { allVideos, type Video as CatalogVideo } from "@/data/videos";
import {
  fetchUploadedVideos,
  convertUploadedToCatalogVideo,
  getStoredVideos,
  type UploadedVideo,
} from "@/lib/video-service";
import { resolveVideoThumbnail, SVG_FALLBACK_THUMBNAIL } from "@/lib/thumbnail-service";

export interface FreeVideosSearch {
  mode?: string | undefined;
  refresh?: number | undefined;
}

export const Route = createFileRoute("/free-videos")({
  validateSearch: (search: Record<string, unknown>): FreeVideosSearch => ({
    mode: typeof search["mode"] === "string" ? search["mode"] : undefined,
    refresh: typeof search["refresh"] === "number" ? search["refresh"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Free Videos — Video Hub — FaceTube" },
      {
        name: "description",
        content:
          "Browse public Free Short and Long Videos streamed on FaceTube without subscriptions or paywalls.",
      },
    ],
  }),
  component: FreeVideosPage,
});

export function FreeVideosPage() {
  const searchParams = Route.useSearch();
  const [uploadedFreeVideos, setUploadedFreeVideos] = useState<UploadedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState<"all" | "short" | "long">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const loadData = async () => {
    setLoading(true);
    try {
      const vids = await fetchUploadedVideos({ videoType: "free" });
      // Merge with any freshly recorded session uploads to ensure zero-latency appearance
      const stored = getStoredVideos().filter((v) => v.videoType === "free");
      const map = new Map<string, UploadedVideo>();
      // Stored local session videos first for immediate visibility
      stored.forEach((v) => map.set(v.id, v));
      // API results overwrite with server-authoritative data
      vids.forEach((v) => map.set(v.id, v));
      setUploadedFreeVideos(Array.from(map.values()));
    } catch (err) {
      console.warn("Failed to fetch free videos from API, reading cache:", err);
      const stored = getStoredVideos().filter((v) => v.videoType === "free");
      setUploadedFreeVideos(stored);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams.refresh]);

  // Merge uploaded videos (priority) with baseline catalog free videos
  const mergedFreeVideos: CatalogVideo[] = useMemo(() => {
    const uploadedConverted = uploadedFreeVideos.map(convertUploadedToCatalogVideo);

    // Standard static catalog free videos (excluding any items marked premium)
    const catalogFree = allVideos.map((v) => ({
      ...v,
      thumb: resolveVideoThumbnail(v),
      thumbnail: resolveVideoThumbnail(v),
      thumbnailUrl: resolveVideoThumbnail(v),
      videoType: "free" as const,
      contentType: (v.duration && v.duration.startsWith("0:") ? "short" : "long") as
        "short" | "long",
    }));

    // Deduplicate by ID
    const seenIds = new Set<string>();
    const combined: CatalogVideo[] = [];

    for (const v of uploadedConverted) {
      if (!seenIds.has(v.id)) {
        seenIds.add(v.id);
        combined.push(v);
      }
    }

    for (const v of catalogFree) {
      if (!seenIds.has(v.id)) {
        seenIds.add(v.id);
        combined.push(v);
      }
    }

    return combined;
  }, [uploadedFreeVideos]);

  // Apply format and category filters
  const filteredList = useMemo(() => {
    return mergedFreeVideos.filter((v) => {
      if (formatFilter !== "all") {
        if (formatFilter === "short" && v.contentType !== "short") return false;
        if (formatFilter === "long" && v.contentType !== "long") return false;
      }
      if (selectedCategory !== "All") {
        if ((v.category || "General").toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [mergedFreeVideos, formatFilter, selectedCategory]);

  const shortCount = useMemo(
    () => mergedFreeVideos.filter((v) => v.contentType === "short").length,
    [mergedFreeVideos],
  );
  const longCount = useMemo(
    () => mergedFreeVideos.filter((v) => v.contentType === "long").length,
    [mergedFreeVideos],
  );

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  Free Videos
                </h1>
                <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-xs font-bold text-sky-400">
                  Live MySQL Database
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Public Free Short &amp; Long videos available to all viewers without subscription
                fees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition disabled:opacity-50"
              title="Refresh video listing"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/upload"
              search={{ mode: "free" }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Upload Free Video
            </Link>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Free Videos</span>
            <p className="text-2xl font-black text-sky-400">{mergedFreeVideos.length}</p>
            <p className="text-[11px] text-muted-foreground">Public videos in library</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Free Short Videos</span>
            <p className="text-2xl font-black text-foreground">{shortCount}</p>
            <p className="text-[11px] text-sky-400 font-semibold">Vertical short reels</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Free Long Videos</span>
            <p className="text-2xl font-black text-foreground">{longCount}</p>
            <p className="text-[11px] text-muted-foreground">Horizontal full videos</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Access Status</span>
            <p className="text-2xl font-black text-emerald-400">100% Free</p>
            <p className="text-[11px] text-muted-foreground">Zero fee (₹0)</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground ml-1" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Format:
            </span>
            <button
              type="button"
              onClick={() => setFormatFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                formatFilter === "all"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({mergedFreeVideos.length})
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter("short")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                formatFilter === "short"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Short Videos ({shortCount})
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter("long")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                formatFilter === "long"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Long Videos ({longCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-border bg-secondary/60 px-3 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Categories</option>
              <option value="Cartoon">Cartoon</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Coding">Coding</option>
              <option value="Motivational">Motivational</option>
              <option value="Comedy">Comedy</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Finance">Finance</option>
              <option value="Share Market">Share Market</option>
              <option value="Cooking">Cooking</option>
            </select>
          </div>
        </div>

        {/* Video Grid */}
        {filteredList.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
            <Video className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">No free videos found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              There are currently no free videos matching the selected format or category. Upload a
              free video to get started.
            </p>
            <Link
              to="/upload"
              search={{ mode: "free" }}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload Free Video Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredList.map((video) => {
              const thumbUrl = resolveVideoThumbnail(video);
              const isNewlyUploaded = video.id.startsWith("vid-") || video.id.startsWith("vid_");

              return (
                <article
                  key={video.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift hover:border-sky-500/40"
                >
                  {/* Thumbnail area: strictly constrained aspect-video container with badges */}
                  <Link
                    to="/watch/$videoId"
                    params={{ videoId: video.id }}
                    className="relative aspect-video w-full overflow-hidden bg-secondary block shrink-0"
                  >
                    <img
                      src={thumbUrl}
                      alt={video.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== SVG_FALLBACK_THUMBNAIL) {
                          target.src = SVG_FALLBACK_THUMBNAIL;
                        }
                      }}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Badges on top of thumbnail */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      {video.isPromoted && (
                        <span className="rounded-md bg-emerald-500/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                          Ads
                        </span>
                      )}
                      {video.contentType === "short" && (
                        <span className="rounded-md bg-rose-500/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          Short
                        </span>
                      )}
                      {isNewlyUploaded && (
                        <span className="rounded-md bg-emerald-500/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          New
                        </span>
                      )}
                    </div>

                    {/* Duration badge */}
                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/85 backdrop-blur-sm px-1.5 py-0.5 font-mono text-[10px] font-bold text-white z-10">
                      {video.duration || "0:00"}
                    </span>

                    {/* Centered Play button on hover */}
                    <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white shadow-lift">
                        <Play className="h-5 w-5 fill-current translate-x-[1px]" />
                      </span>
                    </span>
                  </Link>

                  {/* Metadata area: clearly positioned below thumbnail with zero overlap */}
                  <div className="p-4 flex flex-col justify-between flex-1 space-y-2.5">
                    <div>
                      <Link to="/watch/$videoId" params={{ videoId: video.id }} className="block">
                        <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-foreground leading-snug group-hover:text-brand transition-colors">
                          {video.title}
                        </h3>
                      </Link>
                      {video.isPromoted && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Ads
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                        <span className="truncate">{video.channel}</span>
                        <span>·</span>
                        <span className="font-semibold text-sky-400/90">{video.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2.5 border-t border-border/60">
                      <span className="font-mono">{video.views}</span>
                      <span>{video.age}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </VideoHubLayout>
  );
}
