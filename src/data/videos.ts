import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";
import { resolveVideoThumbnail } from "@/lib/thumbnail-service";

export type Video = {
  id: string;
  title: string;
  channel: string;
  initials: string;
  views: string;
  age: string;
  duration: string;
  thumb: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  tint: string;
  category: string;
  description: string;
  videoUrl?: string;
  videoType?: "free" | "premium";
  contentType?: "short" | "long";
  isPromoted?: boolean;
  uploadedAt?: string;
};

export const VIDEO_CATEGORIES = [
  "Cartoon",
  "Agriculture",
  "Motivational",
  "Comedy",
  "Blog",
  "Movie",
  "Entertainment",
  "Cooking",
  "Finance",
  "Share Market",
  "Business",
  "Crypto",
  "Coding",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export const categories = ["All", ...VIDEO_CATEGORIES];

export const recommended: Video[] = [
  {
    id: "v-cartoon-01",
    category: "Cartoon",
    description:
      "Classic animated adventure featuring funny cartoon characters, slapstick comedy, and heartwarming moments for all ages.",
    title: "The Great Forest Mystery — Animated Cartoon Adventure",
    channel: "Animation Studio X",
    initials: "AX",
    views: "1.8M views",
    age: "1 day ago",
    duration: "14:20",
    thumb: thumb4,
    tint: "oklch(0.55 0.22 30)",
  },
  {
    id: "v-agri-01",
    category: "Agriculture",
    description:
      "Modern agricultural technologies, organic drip irrigation, soil health management, and sustainable crop cultivation techniques.",
    title: "Smart Organic Farming & High-Yield Agriculture Techniques",
    channel: "Green Earth Agri",
    initials: "GA",
    views: "720K views",
    age: "3 days ago",
    duration: "21:45",
    thumb: thumb5,
    tint: "oklch(0.5 0.18 140)",
  },
  {
    id: "v1",
    category: "Coding",
    description:
      "A full walkthrough of building a production-grade React dashboard: routing, data fetching, charts, and a design system that scales.",
    title: "Build a Production-Ready React Dashboard in One Sitting",
    channel: "CodeCanvas",
    initials: "CC",
    views: "842K views",
    age: "2 days ago",
    duration: "24:18",
    thumb: thumb1,
    tint: "oklch(0.45 0.15 27)",
  },
  {
    id: "v2",
    category: "Motivational",
    description:
      "The mindset shift and discipline needed to reach elite performance and master complex skills in 2026.",
    title: "How to Build Relentless Focus & Mental Stamina",
    channel: "Deep Signal",
    initials: "DS",
    views: "1.4M views",
    age: "5 days ago",
    duration: "18:02",
    thumb: thumb2,
    tint: "oklch(0.4 0.18 340)",
  },
  {
    id: "v3",
    category: "Entertainment",
    description:
      "Watch a complete cinematic soundtrack come together from a single melody loop — sampling, drums, mixing and mastering.",
    title: "Cinematic Sound Studio Session: Making a Score from Scratch",
    channel: "Redroom Audio",
    initials: "RA",
    views: "306K views",
    age: "1 week ago",
    duration: "42:55",
    thumb: thumb3,
    tint: "oklch(0.42 0.17 20)",
  },
  {
    id: "v4",
    category: "Comedy",
    description:
      "Hilarious sketches and real-world reactions to modern developer problems and startup culture.",
    title: "Tech Startup Standup: Hilarious Realities of Modern Work",
    channel: "NovaPlays",
    initials: "NP",
    views: "2.1M views",
    age: "3 hours ago",
    duration: "11:37",
    thumb: thumb4,
    tint: "oklch(0.4 0.16 300)",
  },
  {
    id: "v5",
    category: "Business",
    description:
      "How to scale an enterprise brand, optimize creator economics, and build enduring distribution moats.",
    title: "Creator Economy 2026: Scaling from Zero to Enterprise",
    channel: "Studio Grid",
    initials: "SG",
    views: "97K views",
    age: "4 days ago",
    duration: "32:09",
    thumb: thumb5,
    tint: "oklch(0.7 0.02 260)",
  },
  {
    id: "v6",
    category: "Finance",
    description:
      "Comprehensive breakdown of wealth compounding, index funds, cash flow management and early retirement planning.",
    title: "Smart Financial Freedom Blueprint: Compounding & Cash Flow",
    channel: "Signal & Noise",
    initials: "SN",
    views: "512K views",
    age: "6 days ago",
    duration: "1:04:22",
    thumb: thumb6,
    tint: "oklch(0.45 0.19 15)",
  },
  {
    id: "v7",
    category: "Share Market",
    description:
      "Intraday price action, swing trading strategies, order book liquidity and risk mitigation rules.",
    title: "Mastering the Share Market: Technical Analysis & Risk Management",
    channel: "CodeCanvas",
    initials: "CC",
    views: "428K views",
    age: "12 days ago",
    duration: "27:44",
    thumb: thumb1,
    tint: "oklch(0.45 0.15 27)",
  },
  {
    id: "v8",
    category: "Crypto",
    description:
      "DeFi primitives, liquidity pools, cross-chain bridges and decentralized infrastructure explained.",
    title: "Web3 & Crypto Architecture: What Every Builder Needs to Know",
    channel: "Deep Signal",
    initials: "DS",
    views: "1.1M views",
    age: "1 day ago",
    duration: "15:31",
    thumb: thumb2,
    tint: "oklch(0.4 0.18 340)",
  },
];

const pick = (indexes: number[]) => indexes.map((i) => recommended[i] as Video);

export const trending: Video[] = pick([3, 1, 5, 0]).map((v, i) => ({ ...v, id: `t${i}` }));

export const recent: Video[] = pick([4, 2, 6, 7]).map((v, i) => ({
  ...v,
  id: `r${i}`,
  age: `${i + 1} hours ago`,
}));

export const creators = [
  { name: "CodeCanvas", initials: "CC", subs: "1.2M subscribers", tag: "Coding" },
  { name: "Deep Signal", initials: "DS", subs: "890K subscribers", tag: "AI" },
  { name: "Redroom Audio", initials: "RA", subs: "460K subscribers", tag: "Music" },
  { name: "NovaPlays", initials: "NP", subs: "3.4M subscribers", tag: "Gaming" },
  { name: "Studio Grid", initials: "SG", subs: "212K subscribers", tag: "Design" },
  { name: "Signal & Noise", initials: "SN", subs: "775K subscribers", tag: "Podcasts" },
];

export const allVideos: Video[] = [...recommended, ...trending, ...recent];

export const findVideo = (id: string): Video | undefined => {
  const staticFound = allVideos.find((v) => v.id === id);
  if (staticFound) {
    return {
      ...staticFound,
      thumbnail: staticFound.thumb,
      thumbnailUrl: staticFound.thumb,
    };
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("facetube_uploaded_videos_v3");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const match = list.find((v: any) => v.id === id);
          if (match) {
            const thumbUrl = resolveVideoThumbnail({
              thumbnailUrl: match.thumbnailUrl || match.thumbnail_url,
              category: match.category,
            });
            const created = match.createdAt || match.created_at;
            const parsedAge = created
              ? new Date(created.includes("T") ? created : created.replace(" ", "T") + "Z").toLocaleDateString()
              : "Recently uploaded";

            return {
              id: match.id,
              title: match.title,
              channel: match.creatorName || match.creator_name || "FaceTube Creator",
              initials: (match.creatorName || match.creator_name || "FC").slice(0, 2).toUpperCase(),
              views: `${(Number(match.views) || 0).toLocaleString()} views`,
              age: parsedAge,
              duration: match.duration || "0:00",
              thumb: thumbUrl,
              thumbnail: thumbUrl,
              thumbnailUrl: thumbUrl,
              tint: match.videoType === "premium" ? "oklch(0.6 0.22 45)" : "oklch(0.5 0.18 20)",
              category: match.category || "General",
              description: match.description || "",
              videoUrl: match.videoUrl || match.video_url,
              videoType: match.videoType || match.video_type || "free",
              contentType: match.contentType || match.content_type || "long",
              isPromoted: Boolean(match.isPromoted || match.is_promoted),
            };
          }
        }
      }
    } catch (_e) {
      // ignore
    }
  }

  return undefined;
};

/**
 * Asynchronously locates a video by ID, querying the live PHP REST API / MySQL database
 * if the video is not present in local static assets or cache.
 */
export async function findVideoAsync(id: string): Promise<Video | undefined> {
  const localMatch = findVideo(id);
  if (localMatch) return localMatch;

  try {
    const { api } = await import("@/lib/api");
    const res = await api.videos.get(id);
    if (res && res.success && res.video) {
      const v = res.video;
      const thumbUrl = resolveVideoThumbnail({
        thumbnailUrl: v.thumbnail_url || v.thumbnailUrl,
        category: v.category,
      });
      const created = v.created_at || v.createdAt;
      const parsedAge = created
        ? new Date(created.includes("T") ? created : created.replace(" ", "T") + "Z").toLocaleDateString()
        : "Recently uploaded";

      return {
        id: String(v.id),
        title: v.title || "Untitled Video",
        channel: v.creator_name || v.creatorName || "FaceTube Creator",
        initials: (v.creator_name || v.creatorName || "FC").slice(0, 2).toUpperCase(),
        views: `${(Number(v.views) || 0).toLocaleString()} views`,
        age: parsedAge,
        duration: v.duration || "0:00",
        thumb: thumbUrl,
        thumbnail: thumbUrl,
        thumbnailUrl: thumbUrl,
        tint: v.video_type === "premium" ? "oklch(0.6 0.22 45)" : "oklch(0.5 0.18 20)",
        category: v.category || "General",
        description: v.description || "",
        videoUrl: v.video_url || v.videoUrl,
        videoType: v.video_type || v.videoType || "free",
        contentType: v.content_type || v.contentType || "long",
        isPromoted: Boolean(v.is_promoted || v.isPromoted),
      };
    }
  } catch (err) {
    console.warn("findVideoAsync database lookup failed:", err);
  }

  return undefined;
}
