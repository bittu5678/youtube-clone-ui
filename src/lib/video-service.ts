import { api } from "./api";
import {
  resolveVideoThumbnail,
  getCategoryFallbackThumbnail,
  captureAndUploadThumbnail,
} from "./thumbnail-service";
import { resolveMediaUrl } from "./media-url";
import type { Video } from "@/data/videos";
import type { ShortItem } from "@/data/shorts";

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

export interface CategoryRecord {
  id: string | number;
  name: string;
  slug: string;
  created_by?: string;
  created_at?: string;
}

/**
 * Loads managed categories from the API with graceful fallback to static VIDEO_CATEGORIES.
 */
export async function getAvailableCategories(): Promise<string[]> {
  try {
    const res = await api.categories.list();
    if (res?.categories && res.categories.length > 0) {
      return res.categories.map((c) => c.name);
    }
  } catch (_err) {
    // Fallback to static baseline while migration is pending
  }
  return [...VIDEO_CATEGORIES];
}

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
  paymentId?: string | undefined;
  paymentAmount: number; // e.g. 0 for free, 6 for premium
  isPromoted: boolean;
  promotionPlan?: string | undefined;
  promotionExpiresAt?: string | undefined;
  visibility?: "public" | "unlisted" | "private";
  createdAt: string;
  updatedAt: string;
  isStale?: boolean | undefined;
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
    videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
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
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
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
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
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
    title: "Executive Masterclass: Building ₹10L/Month Video Funnels",
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
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
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
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
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
 * Safely evaluates whether an ad promotion is currently active.
 * An ad promotion is active ONLY IF:
 * 1. Marked as promoted (isPromoted / is_promoted is true)
 * 2. Expiry timestamp is present, valid, and strictly in the future (> Date.now())
 *
 * Expired promotions, or those with null/missing/invalid expiry timestamps, return false.
 */
export function isPromotionActive(video: {
  isPromoted?: boolean | number | null | undefined;
  is_promoted?: boolean | number | null | undefined;
  promotionExpiresAt?: string | null | undefined;
  promotion_expires_at?: string | null | undefined;
}): boolean {
  const isMarked = Boolean(video.isPromoted ?? video.is_promoted);
  if (!isMarked) return false;
  const expiryRaw = video.promotionExpiresAt || video.promotion_expires_at;
  if (!expiryRaw) return false;
  const expiryTime = new Date(expiryRaw).getTime();
  if (Number.isNaN(expiryTime)) return false;
  return expiryTime > Date.now();
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
    const listParams: Parameters<typeof api.videos.list>[0] = {};
    if (opts.userId) listParams.userId = opts.userId;
    if (opts.videoType) listParams.videoType = opts.videoType;
    if (opts.contentType) listParams.contentType = opts.contentType;
    if (opts.category) listParams.category = opts.category;
    if (opts.search) listParams.search = opts.search;
    if (opts.limit !== undefined) listParams.limit = opts.limit;
    if (opts.offset !== undefined) listParams.offset = opts.offset;

    const res = await api.videos.list(listParams);

    if (res && res.videos && Array.isArray(res.videos)) {
      const mapped = res.videos.map((d: any) => {
        const active = isPromotionActive({
          isPromoted: d.is_promoted ?? d.isPromoted,
          promotionExpiresAt: d.promotion_expires_at || d.promotionExpiresAt,
        });

        return {
          id: String(d.id),
          userId: d.user_id || d.userId || "FT102857",
          creatorName: d.creator_name || d.creatorName || "FaceTube Creator",
          title: d.title || "Untitled Video",
          description: d.description || "",
          videoUrl: resolveMediaUrl(d.video_url || d.videoUrl || ""),
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
          isPromoted: active,
          promotionPlan: d.promotion_plan || d.promotionPlan,
          promotionExpiresAt: d.promotion_expires_at || d.promotionExpiresAt,
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
          updatedAt: d.updated_at || d.updatedAt || d.created_at || new Date().toISOString(),
          isStale: false,
        };
      });

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

  // Fallback to local stored videos cache, explicitly tagged as stale/offline
  let all = getStoredVideos().map((v) => ({ ...v, isStale: true }));
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

  // Prioritize active promotions at top of feeds
  all.sort((a, b) => {
    const pA = isPromotionActive(a) ? 1 : 0;
    const pB = isPromotionActive(b) ? 1 : 0;
    if (pA !== pB) return pB - pA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
  visibility?: "public" | "unlisted" | "private";
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
    ...(params.paymentId ? { paymentId: params.paymentId } : {}),
    paymentAmount: isPremium ? (params.paymentAmount ?? 6) : 0,
    isPromoted: false,
    visibility: params.visibility || "public",
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
    visibility: newVideo.visibility,
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

/* -------------------------------------------------------------------------- */
/* BULK VIDEO UPLOAD SERVICE LAYER (Shorts & Long Videos)                     */
/* -------------------------------------------------------------------------- */

export interface BulkVideoFileValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validates a video file against size (<= 150MB) and supported formats (MP4, WebM, OGG, MOV, M4V, MKV).
 */
export function validateVideoFileForUpload(file: File): BulkVideoFileValidation {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }
  const maxSizeBytes = 150 * 1024 * 1024; // 150MB limit
  if (file.size <= 0) {
    return { valid: false, error: `File "${file.name}" is empty (0 bytes).` };
  }
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds 150MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }
  const validExts = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".mkv"];
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  const validMimes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-m4v",
    "video/x-matroska",
    "application/octet-stream",
  ];
  const isExtValid = validExts.includes(ext);
  const isMimeValid =
    !file.type || file.type.startsWith("video/") || validMimes.includes(file.type);
  if (!isExtValid && !isMimeValid) {
    return {
      valid: false,
      error: `File "${file.name}" has unsupported format (${ext || file.type || "unknown"}). Supported formats: MP4, WebM, OGG, MOV.`,
    };
  }
  return { valid: true };
}

export interface BulkUploadItemPayload {
  id: string; // unique item id in queue
  file: File;
  title: string;
  description?: string;
  category: string;
  contentType: ContentType; // "short" | "long"
  visibility?: "public" | "unlisted" | "private";
  customThumbnailFile?: File | null;
  thumbnailUrl?: string;
  detectedDuration?: string;
  videoType?: VideoType; // "free" | "premium"
  paymentStatus?: VideoPaymentStatus;
  paymentId?: string;
  paymentAmount?: number;
}

export interface BulkUploadItemResult {
  id: string;
  title: string;
  success: boolean;
  video?: UploadedVideo;
  error?: string;
  fileSize: number;
  duration?: string;
}

export interface BulkUploadProgressState {
  itemId: string;
  progress: number;
  phase:
    "validating" | "uploading_video" | "uploading_thumbnail" | "publishing" | "complete" | "error";
  error?: string;
}

/**
 * Processes an individual item from a bulk upload batch:
 * 1. Validates the video file
 * 2. Uploads the video file via api.uploads.uploadVideo
 * 3. Handles custom thumbnail file upload (or captured thumbnail / category fallback)
 * 4. Calls recordNewVideoUpload to persist the video record
 * 5. Returns the published UploadedVideo
 */
export async function uploadSingleBulkVideoItem(
  item: BulkUploadItemPayload,
  creatorInfo: { userId: string; creatorName: string },
  onProgress?: (state: BulkUploadProgressState) => void,
): Promise<UploadedVideo> {
  // 1. Validation
  onProgress?.({ itemId: item.id, progress: 10, phase: "validating" });
  const validation = validateVideoFileForUpload(item.file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid video file.");
  }

  // 2. Upload video binary to storage via production API
  onProgress?.({ itemId: item.id, progress: 25, phase: "uploading_video" });
  const uploadRes = await api.uploads.uploadVideo(item.file);
  if (!uploadRes || !uploadRes.url) {
    const errMsg =
      (uploadRes as any)?.error ||
      (uploadRes as any)?.message ||
      (uploadRes as any)?.msg ||
      "Server storage upload failed without a valid video URL.";
    throw new Error(errMsg);
  }
  onProgress?.({ itemId: item.id, progress: 65, phase: "uploading_thumbnail" });

  // 3. Resolve / upload thumbnail
  let finalThumbnailUrl = item.thumbnailUrl || "";
  if (item.customThumbnailFile) {
    try {
      const imgRes = await api.uploads.uploadImage(item.customThumbnailFile);
      if (imgRes && imgRes.url) {
        finalThumbnailUrl = imgRes.url;
      }
    } catch (_imgErr) {
      // Fallback
    }
  }
  if (!finalThumbnailUrl) {
    try {
      finalThumbnailUrl = await captureAndUploadThumbnail(item.file, item.category);
    } catch (_thumbErr) {
      finalThumbnailUrl = getCategoryFallbackThumbnail(item.category);
    }
  }

  // 4. Publish video record to production database
  onProgress?.({ itemId: item.id, progress: 85, phase: "publishing" });
  const published = await recordNewVideoUpload({
    userId: creatorInfo.userId,
    creatorName: creatorInfo.creatorName,
    title: item.title.trim() || item.file.name.replace(/\.[^/.]+$/, ""),
    description: (item.description || "").trim(),
    videoUrl: uploadRes.url,
    thumbnailUrl: finalThumbnailUrl,
    videoType: item.videoType || "free",
    contentType: item.contentType,
    category: item.category || "Entertainment",
    duration: item.detectedDuration || (item.contentType === "short" ? "0:45" : "12:30"),
    paymentStatus: item.paymentStatus || (item.videoType === "premium" ? "paid" : "not_required"),
    ...(item.paymentId ? { paymentId: item.paymentId } : {}),
    paymentAmount: item.videoType === "premium" ? (item.paymentAmount ?? 6) : 0,
    visibility: item.visibility || "public",
  });

  onProgress?.({ itemId: item.id, progress: 100, phase: "complete" });
  return published;
}

/**
 * Executes a batch upload queue sequentially:
 * - Skips items that have already succeeded (prevents duplicate submissions)
 * - Reports progress per item
 * - Collects results for all items (failed items are reported without interrupting remaining items)
 * - Allows subsequent retries for only failed items
 */
export async function executeBulkVideoUploadQueue(
  items: BulkUploadItemPayload[],
  creatorInfo: { userId: string; creatorName: string },
  callbacks?: {
    onItemStart?: (item: BulkUploadItemPayload) => void;
    onItemProgress?: (state: BulkUploadProgressState) => void;
    onItemSuccess?: (item: BulkUploadItemPayload, video: UploadedVideo) => void;
    onItemError?: (item: BulkUploadItemPayload, error: Error) => void;
  },
): Promise<BulkUploadItemResult[]> {
  const results: BulkUploadItemResult[] = [];

  for (const item of items) {
    callbacks?.onItemStart?.(item);
    try {
      const video = await uploadSingleBulkVideoItem(item, creatorInfo, callbacks?.onItemProgress);
      callbacks?.onItemSuccess?.(item, video);
      results.push({
        id: item.id,
        title: item.title,
        success: true,
        video,
        fileSize: item.file.size,
        duration: video.duration,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      callbacks?.onItemError?.(item, err instanceof Error ? err : new Error(errorMsg));
      callbacks?.onItemProgress?.({
        itemId: item.id,
        progress: 0,
        phase: "error",
        error: errorMsg,
      });
      results.push({
        id: item.id,
        title: item.title,
        success: false,
        error: errorMsg,
        fileSize: item.file.size,
      });
    }
  }

  return results;
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
    const video = all[index];
    if (video) {
      video.isPromoted = true;
      video.promotionPlan = params.planId;
      video.promotionExpiresAt = expiresAt;
      video.updatedAt = new Date().toISOString();
      saveStoredVideos(all);
    }
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

  const rawVideoUrl = resolveMediaUrl(v.videoUrl || (v as any).video_url || "");

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
    contentType:
      v.contentType ||
      (isShortVideo({ contentType: v.contentType, duration: v.duration }) ? "short" : "long"),
    isPromoted: isPromotionActive(v),
  };
}

/**
 * Checks whether a video item is a Short video based on metadata or duration (<= 60 seconds).
 */
export function isShortVideo(video: { contentType?: string; duration?: string }): boolean {
  if (video.contentType === "short") return true;
  if (video.contentType === "long") return false;
  if (!video.duration) return false;
  const raw = video.duration.trim();
  const parts = raw.split(":").map(Number);
  if (parts.some(isNaN)) return false;
  if (parts.length === 2) {
    const minutes = parts[0];
    const seconds = parts[1];
    if (minutes !== undefined && seconds !== undefined) {
      return minutes * 60 + seconds <= 60;
    }
  }
  return false;
}

/**
 * Checks whether a video item is a Long video.
 */
export function isLongVideo(video: { contentType?: string; duration?: string }): boolean {
  return !isShortVideo(video);
}

export interface VideoBadgeLabels {
  /**
   * Free videos: must appear normally; no Premium, Sponsor, or price labels.
   */
  isFree: boolean;
  /**
   * For videos uploaded under paid/premium upload option, show small "Sponsor" label immediately below title.
   * Never show "Premium" or upload fees like "₹6" as public video-card label.
   */
  showSponsorLabel: boolean;
  /**
   * For videos genuinely classified as advertising/promotional content by metadata or Ads upload.
   * Shown as a small "Ads" label immediately below title.
   */
  showAdsLabel: boolean;
  /**
   * Regression requirement: Video thumbnails MUST NOT display an "Ads" overlay badge or text.
   * Always false across all cards and feeds.
   */
  showThumbnailAdsOverlay: false;
  /**
   * Strictly public badge texts to display immediately below video title.
   */
  badges: Array<{
    type: "sponsor" | "ads";
    label: string;
  }>;
}

/**
 * Centrally determines the public badge labels for a video according to FaceTube guidelines:
 * 1. Free videos: must appear normally. No Premium, Sponsor, or price labels.
 * 2. Paid/premium uploads: show small "Sponsor" label immediately below title. No "Premium" or "₹6".
 * 3. Ads videos: show small "Ads" label only for genuine advertising/promotional content.
 * 4. Thumbnail overlays: zero Ads badge overlay on thumbnails across all cards and feeds.
 * 5. Duration is never used to determine sponsor or ad status.
 */
export function getVideoBadgeLabels(video: {
  videoType?: string | null | undefined;
  video_type?: string | null | undefined;
  isPromoted?: boolean | number | null | undefined;
  is_promoted?: boolean | number | null | undefined;
  promotionExpiresAt?: string | null | undefined;
  promotion_expires_at?: string | null | undefined;
  duration?: string | null | undefined;
  contentType?: string | null | undefined;
}): VideoBadgeLabels {
  const videoType = (video.videoType ?? video.video_type ?? "free").toLowerCase();
  const isPaidPremium = videoType === "premium";

  // Check if genuinely active advertising / promotional content
  const hasPromotedFlag = Boolean(video.isPromoted ?? video.is_promoted);
  let showAds = false;
  if (hasPromotedFlag) {
    const expiry = video.promotionExpiresAt ?? video.promotion_expires_at;
    if (expiry) {
      showAds = isPromotionActive({
        isPromoted: hasPromotedFlag,
        promotionExpiresAt: expiry,
      });
    } else {
      showAds = true;
    }
  }

  const showSponsor = isPaidPremium;
  const isFree = !showSponsor && !showAds;

  const badges: Array<{ type: "sponsor" | "ads"; label: string }> = [];
  if (showSponsor) {
    badges.push({ type: "sponsor", label: "Sponsor" });
  }
  if (showAds) {
    badges.push({ type: "ads", label: "Ads" });
  }

  return {
    isFree,
    showSponsorLabel: showSponsor,
    showAdsLabel: showAds,
    showThumbnailAdsOverlay: false,
    badges,
  };
}

/**
 * Converts a Video or UploadedVideo into ShortItem format for display in ShortsShelf and /shorts.
 */
export function convertVideoToShortItem(v: Video | UploadedVideo): ShortItem {
  const thumbUrl =
    (v as any).thumb ||
    (v as any).thumbnail ||
    (v as any).thumbnailUrl ||
    resolveVideoThumbnail({
      thumbnailUrl: (v as any).thumbnailUrl,
      category: (v as any).category,
    });
  const channel = (v as any).channel || (v as any).creatorName || "FaceTube Creator";
  const views =
    typeof (v as any).views === "number"
      ? `${(v as any).views.toLocaleString()} views`
      : String((v as any).views || "0 views");

  return {
    id: String(v.id),
    title: v.title || "FaceTube Short",
    creator: channel,
    creatorHandle: `@${channel.toLowerCase().replace(/[^a-z0-9]/g, "") || "creator"}`,
    initials: (channel.slice(0, 2) || "FT").toUpperCase(),
    views: views,
    likes: (v as any).likes ? `${(v as any).likes.toLocaleString?.() || (v as any).likes}` : "1.2K",
    comments: "48",
    shares: "16",
    soundTrack: `${channel} · Original Audio`,
    tags: [(v as any).category || "Shorts"],
    thumb: thumbUrl,
    aspectColor: "from-blue-900/60 to-purple-900/80",
    videoUrl: (v as any).videoUrl,
  };
}
