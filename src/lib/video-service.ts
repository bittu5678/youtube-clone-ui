import { api } from "./api";
import { resolveVideoThumbnail, getCategoryFallbackThumbnail } from "./thumbnail-service";
import type { Video } from "@/data/videos";

export type VideoType = "free" | "premium";
export type ContentType = "short" | "long";
export type VideoPaymentStatus = "not_required" | "pending" | "paid" | "failed";
export type VideoPromotionStatus = "none" | "active" | "expired";

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

export interface UploadedVideo {
  id: string;
  userId: string; // e.g. "FT102857" or UUID
  creatorName: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  videoType: VideoType; // "free" | "premium"
  contentType: ContentType; // "short" | "long"
  category: string;
  duration: string;
  views: number;
  likes: number;
  paymentStatus: VideoPaymentStatus;
  paymentId?: string;
  paymentAmount: number; // e.g. 0 for free, 6 for premium
  isPromoted: boolean;
  promotionPlan?: string;
  promotionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoCategoryCounts {
  freeShort: number;
  freeLong: number;
  premiumShort: number;
  premiumLong: number;
  totalFree: number;
  totalPremium: number;
  totalUploaded: number;
}

const LOCAL_STORAGE_VIDEOS_KEY = "facetube_uploaded_videos_v3";

// Initial seed videos reflecting real user accounts and the four required video classifications
export const INITIAL_SEED_VIDEOS: UploadedVideo[] = [
  // 1. Free Short Video (FT483921 - Alex Rivera)
  {
    id: "vid-seed-001",
    userId: "FT483921",
    creatorName: "Alex Rivera",
    title: "10 Coding Shortcuts Every React Dev Must Know #Shorts",
    description: "Lightning-fast developer workflow hacks in under 45 seconds.",
    videoUrl: "/uploads/videos/vid_sample_coding.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
    videoType: "free",
    contentType: "short",
    category: "Technology",
    duration: "0:42",
    views: 45200,
    likes: 3120,
    paymentStatus: "not_required",
    paymentAmount: 0,
    isPromoted: false,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // 2. Free Long Video (FT483921 - Alex Rivera)
  {
    id: "vid-seed-002",
    userId: "FT483921",
    creatorName: "Alex Rivera",
    title: "Full Stack App Architecture from Scratch: Zero to Production",
    description:
      "Deep-dive 45-minute comprehensive architectural masterclass covering scalable backend and modern UI.",
    videoUrl: "/uploads/videos/vid_sample_nature.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    videoType: "free",
    contentType: "long",
    category: "Education",
    duration: "42:15",
    views: 98400,
    likes: 8400,
    paymentStatus: "not_required",
    paymentAmount: 0,
    isPromoted: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // 3. Premium Short Video (FT483921 - Alex Rivera)
  {
    id: "vid-seed-003",
    userId: "FT483921",
    creatorName: "Alex Rivera",
    title: "Pro Monetization Hack: Unlocking High-CPM Niches #Shorts",
    description:
      "Exclusive creator strategy breakdown for maximum algorithmic engagement and monetization yield.",
    videoUrl: "/uploads/videos/vid_sample_animation.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60",
    videoType: "premium",
    contentType: "short",
    category: "Business",
    duration: "0:58",
    views: 62100,
    likes: 5490,
    paymentStatus: "paid",
    paymentId: "pay_rzp_seed_001",
    paymentAmount: 6,
    isPromoted: true,
    promotionPlan: "plan-15-days",
    promotionExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // 4. Premium Long Video (FT483921 - Alex Rivera)
  {
    id: "vid-seed-004",
    userId: "FT483921",
    creatorName: "Alex Rivera",
    title: "Executive Masterclass: Building $10K/Month Video Funnels",
    description:
      "Full 1-hour verified premium course with step-by-step case studies and downloadable resources.",
    videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
    videoType: "premium",
    contentType: "long",
    category: "Masterclass",
    duration: "58:30",
    views: 31400,
    likes: 2980,
    paymentStatus: "paid",
    paymentId: "pay_rzp_seed_002",
    paymentAmount: 6,
    isPromoted: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // 5. Free Short Video (FT900431 - Maya Lin)
  {
    id: "vid-seed-005",
    userId: "FT900431",
    creatorName: "Maya Lin",
    title: "Cinematic Color Grading in 30 Seconds #Shorts",
    description: "LUT color correction tricks for mobile videographers.",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=60",
    videoType: "free",
    contentType: "short",
    category: "Film",
    duration: "0:30",
    views: 18200,
    likes: 1200,
    paymentStatus: "not_required",
    paymentAmount: 0,
    isPromoted: false,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // 6. Premium Short Video (FT900431 - Maya Lin)
  {
    id: "vid-seed-006",
    userId: "FT900431",
    creatorName: "Maya Lin",
    title: "Secret Lighting Setup for 4K Vertical Video #Shorts",
    description: "Lighting angles and diffusers used by professional film studios.",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=60",
    videoType: "premium",
    contentType: "short",
    category: "Film",
    duration: "0:45",
    views: 29500,
    likes: 2100,
    paymentStatus: "paid",
    paymentId: "pay_rzp_seed_003",
    paymentAmount: 6,
    isPromoted: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // 7. Free Long Video - Cartoon Category
  {
    id: "vid-seed-007",
    userId: "FT483921",
    creatorName: "Animation Studio X",
    title: "The Great Forest Mystery — Animated Cartoon Adventure",
    description:
      "Classic animated adventure featuring funny cartoon characters, slapstick comedy, and heartwarming moments for all ages.",
    videoUrl: "/uploads/videos/vid_sample_animation.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60",
    videoType: "free",
    contentType: "long",
    category: "Cartoon",
    duration: "14:20",
    views: 89000,
    likes: 6700,
    paymentStatus: "not_required",
    paymentAmount: 0,
    isPromoted: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // 8. Free Long Video - Agriculture Category
  {
    id: "vid-seed-008",
    userId: "FT483921",
    creatorName: "Green Earth Agri",
    title: "Smart Organic Farming & High-Yield Agriculture Techniques",
    description:
      "Modern agricultural technologies, organic drip irrigation, soil health management, and sustainable crop cultivation techniques.",
    videoUrl: "/uploads/videos/vid_sample_nature.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60",
    videoType: "free",
    contentType: "long",
    category: "Agriculture",
    duration: "21:45",
    views: 54000,
    likes: 4300,
    paymentStatus: "not_required",
    paymentAmount: 0,
    isPromoted: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Loads uploaded videos from database or local store
 */
export function getStoredVideos(): UploadedVideo[] {
  if (typeof window === "undefined") return INITIAL_SEED_VIDEOS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(INITIAL_SEED_VIDEOS));
    return INITIAL_SEED_VIDEOS;
  } catch (_e) {
    return INITIAL_SEED_VIDEOS;
  }
}

export function saveStoredVideos(videos: UploadedVideo[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(videos));
  } catch (_e) {
    // quota error
  }
}

export interface FetchVideosOptions {
  userId?: string;
  videoType?: VideoType;
  contentType?: ContentType;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetches videos from the production PHP REST API / MySQL database.
 * Falls back to local stored cache if offline, and syncs newly retrieved items.
 */
export async function fetchUploadedVideos(
  optionsOrUserId?: string | FetchVideosOptions,
): Promise<UploadedVideo[]> {
  const opts: FetchVideosOptions =
    typeof optionsOrUserId === "string" ? { userId: optionsOrUserId } : optionsOrUserId || {};

  try {
    const res = await api.videos.list({
      userId: opts.userId,
      videoType: opts.videoType,
      contentType: opts.contentType,
      category: opts.category,
      search: opts.search,
      limit: opts.limit,
      offset: opts.offset,
    });

    if (res && res.videos && Array.isArray(res.videos)) {
      const mapped = res.videos.map((d: any) => ({
        id: String(d.id),
        userId: d.user_id || d.userId || "FT102857",
        creatorName: d.creator_name || d.creatorName || "FaceTube Creator",
        title: d.title || "Untitled Video",
        description: d.description || "",
        videoUrl: d.video_url || d.videoUrl || "",
        thumbnailUrl: resolveVideoThumbnail({
          thumbnailUrl: d.thumbnail_url || d.thumbnailUrl,
          category: d.category,
        }),
        videoType: (d.video_type || d.videoType || "free") as VideoType,
        contentType: (d.content_type || d.contentType || "long") as ContentType,
        category: d.category || "General",
        duration: d.duration || "0:00",
        views: Number(d.views) || 0,
        likes: Number(d.likes) || 0,
        paymentStatus: (d.payment_status ||
          d.paymentStatus ||
          "not_required") as VideoPaymentStatus,
        paymentId: d.payment_id || d.paymentId,
        paymentAmount: Number(d.payment_amount || d.paymentAmount) || 0,
        isPromoted: Boolean(d.is_promoted ?? d.isPromoted),
        promotionPlan: d.promotion_plan || d.promotionPlan,
        promotionExpiresAt: d.promotion_expires_at || d.promotionExpiresAt,
        createdAt: d.created_at || d.createdAt || new Date().toISOString(),
        updatedAt: d.updated_at || d.updatedAt || d.created_at || new Date().toISOString(),
      }));

      // Cache into local storage
      if (
        mapped.length > 0 &&
        !opts.videoType &&
        !opts.contentType &&
        !opts.category &&
        !opts.search
      ) {
        saveStoredVideos(mapped);
      }

      return mapped;
    }
  } catch (err) {
    console.warn("fetchUploadedVideos API warning, reading local cache:", err);
  }

  // Fallback to local stored videos cache
  let all = getStoredVideos();
  if (opts.userId) {
    const norm = opts.userId.trim().toUpperCase();
    all = all.filter((v) => v.userId.trim().toUpperCase() === norm);
  }
  if (opts.videoType) {
    all = all.filter((v) => v.videoType === opts.videoType);
  }
  if (opts.contentType) {
    all = all.filter((v) => v.contentType === opts.contentType);
  }
  if (opts.category && opts.category !== "All") {
    all = all.filter(
      (v) => (v.category || "General").toLowerCase() === opts.category!.toLowerCase(),
    );
  }
  if (opts.search) {
    const s = opts.search.toLowerCase();
    all = all.filter(
      (v) =>
        v.title.toLowerCase().includes(s) ||
        v.description.toLowerCase().includes(s) ||
        v.creatorName.toLowerCase().includes(s),
    );
  }
  return all;
}

/**
 * Calculates dynamically the FOUR separate video counts:
 * 1. Free Short Video
 * 2. Free Long Video
 * 3. Premium Short Video
 * 4. Premium Long Video
 */
export async function calculateUserVideoCounts(userId?: string): Promise<VideoCategoryCounts> {
  const videos = await fetchUploadedVideos(userId);

  let freeShort = 0;
  let freeLong = 0;
  let premiumShort = 0;
  let premiumLong = 0;

  for (const v of videos) {
    if (v.videoType === "free") {
      if (v.contentType === "short") {
        freeShort++;
      } else {
        freeLong++;
      }
    } else if (v.videoType === "premium") {
      // Must be paid/active
      if (v.paymentStatus === "paid" || v.paymentStatus === "not_required") {
        if (v.contentType === "short") {
          premiumShort++;
        } else {
          premiumLong++;
        }
      }
    }
  }

  const totalFree = freeShort + freeLong;
  const totalPremium = premiumShort + premiumLong;
  const totalUploaded = totalFree + totalPremium;

  return {
    freeShort,
    freeLong,
    premiumShort,
    premiumLong,
    totalFree,
    totalPremium,
    totalUploaded,
  };
}

/**
 * Creates and records a newly uploaded video with strict payment and server verification
 */
export async function recordNewVideoUpload(params: {
  id?: string;
  userId: string;
  creatorName: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  videoType: VideoType; // "free" | "premium"
  contentType: ContentType; // "short" | "long"
  category?: string;
  duration?: string;
  paymentStatus?: VideoPaymentStatus;
  paymentId?: string;
  paymentAmount?: number;
}): Promise<UploadedVideo> {
  const isPremium = params.videoType === "premium";

  if (!params.videoUrl || !params.videoUrl.trim()) {
    throw new Error(
      "Cannot publish video: videoUrl is missing. Video must be uploaded to storage first.",
    );
  }

  const videoId = params.id || `vid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const newVideo: UploadedVideo = {
    id: videoId,
    userId: params.userId,
    creatorName: params.creatorName,
    title: params.title.trim(),
    description: params.description.trim(),
    videoUrl: params.videoUrl.trim(),
    thumbnailUrl:
      params.thumbnailUrl ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
    videoType: params.videoType,
    contentType: params.contentType,
    category: params.category || "Entertainment",
    duration: params.duration || (params.contentType === "short" ? "0:45" : "12:30"),
    views: 0,
    likes: 0,
    paymentStatus: isPremium ? params.paymentStatus || "pending" : "not_required",
    paymentId: params.paymentId,
    paymentAmount: isPremium ? (params.paymentAmount ?? 6) : 0,
    isPromoted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Production API & Database Insertion - Must confirm success before publishing
  const apiRes = await api.videos.create({
    id: newVideo.id,
    user_id: newVideo.userId,
    creator_name: newVideo.creatorName,
    title: newVideo.title,
    description: newVideo.description,
    video_url: newVideo.videoUrl,
    thumbnail_url: newVideo.thumbnailUrl,
    video_type: newVideo.videoType,
    content_type: newVideo.contentType,
    category: newVideo.category,
    duration: newVideo.duration,
    payment_status: newVideo.paymentStatus,
    payment_id: newVideo.paymentId,
    payment_amount: newVideo.paymentAmount,
    is_promoted: false,
  });

  if (!apiRes || !apiRes.success) {
    throw new Error(
      (apiRes as any)?.error || "Server rejected video creation. Video was not published.",
    );
  }

  // 2. Cache newly confirmed video in local store for rapid UI transitions
  const all = getStoredVideos();
  const exists = all.some(
    (v) => v.id === newVideo.id || (newVideo.paymentId && v.paymentId === newVideo.paymentId),
  );
  if (!exists) {
    const updated = [newVideo, ...all];
    saveStoredVideos(updated);
  }

  return newVideo;
}

/**
 * Activates promotion on an existing or new video upon verified payment
 */
export async function markVideoPromoted(params: {
  videoId: string;
  planId: string;
  durationDays: number;
  paymentId: string;
}): Promise<boolean> {
  const all = getStoredVideos();
  const index = all.findIndex((v) => v.id === params.videoId);
  const expiresAt = new Date(Date.now() + params.durationDays * 24 * 60 * 60 * 1000).toISOString();

  if (index !== -1) {
    all[index].isPromoted = true;
    all[index].promotionPlan = params.planId;
    all[index].promotionExpiresAt = expiresAt;
    all[index].updatedAt = new Date().toISOString();
    saveStoredVideos(all);
  }

  try {
    await api.videos.promote({
      videoId: params.videoId,
      planId: params.planId,
      durationDays: params.durationDays,
      paymentId: params.paymentId,
    });
  } catch (_e) {
    // fallback
  }

  return true;
}

/**
 * Converts an UploadedVideo into standard catalog Video format, ensuring
 * safe thumbnail URLs, playback links, and display attributes.
 */
export function convertUploadedToCatalogVideo(v: UploadedVideo): Video {
  const thumbUrl = resolveVideoThumbnail({
    thumbnailUrl: v.thumbnailUrl,
    thumbnail_url: (v as any).thumbnail_url,
    category: v.category,
  });

  const rawVideoUrl = v.videoUrl || (v as any).video_url || "";

  return {
    id: String(v.id),
    title: v.title || "Untitled Video",
    channel: v.creatorName || "FaceTube Creator",
    initials: (v.creatorName || "FC").slice(0, 2).toUpperCase(),
    views: `${(Number(v.views) || 0).toLocaleString()} views`,
    age: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "Recently uploaded",
    duration: v.duration || "0:00",
    thumb: thumbUrl,
    thumbnail: thumbUrl,
    thumbnailUrl: thumbUrl,
    tint: v.videoType === "premium" ? "oklch(0.6 0.22 45)" : "oklch(0.5 0.18 20)",
    category: v.category || "General",
    description: v.description || "",
    videoUrl: rawVideoUrl,
    videoType: v.videoType || "free",
    contentType: v.contentType || "long",
    isPromoted: Boolean(v.isPromoted),
  };
}
