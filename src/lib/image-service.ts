import { api } from "./api";
import { resolveMediaUrl } from "./media-url";

export interface UploadedImage {
  id: string;
  userId: string;
  creatorName: string;
  title: string;
  description?: string | undefined;
  imageUrl: string;
  format: "jpg" | "jpeg" | "png" | "webp";
  fileSize: string;
  category?: string | undefined;
  views: number;
  likes: number;
  createdAt: string;
}

/**
 * Configurable feed threshold:
 * After every 4 video items, 1 uploaded image appears as an additional content item.
 */
export const IMAGE_FEED_INTERVAL = 4;

const LOCAL_STORAGE_IMAGES_KEY = "facetube_uploaded_images_v2";

export const INITIAL_SEED_IMAGES: UploadedImage[] = [
  {
    id: "img-seed-001",
    userId: "FT483921",
    creatorName: "Alex Rivera",
    title: "Mastering React 19 & Next-Gen Streaming UI",
    description: "Official cover artwork and key takeaways for our latest masterclass.",
    imageUrl:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
    format: "png",
    fileSize: "1.4 MB",
    category: "Coding",
    views: 14200,
    likes: 1890,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "img-seed-002",
    userId: "FT900431",
    creatorName: "Maya Lin",
    title: "Daily Motivation & Mindset Roadmap",
    description: "Visual roadmap for consistent creators scaling their audience in 2026.",
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    format: "jpg",
    fileSize: "980 KB",
    category: "Motivational",
    views: 28400,
    likes: 3410,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "img-seed-003",
    userId: "FT102857",
    creatorName: "FaceTube Admin",
    title: "Share Market & Crypto Macro Analysis",
    description: "Infographic breakdown of high-frequency liquidity and fintech market trends.",
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80",
    format: "webp",
    fileSize: "840 KB",
    category: "Share Market",
    views: 19500,
    likes: 2130,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "img-seed-004",
    userId: "FT483921",
    creatorName: "Alex Rivera",
    title: "Creative Studio Lighting & Setup Showcase",
    description: "Behind the scenes look at the multi-camera podcast and video rig.",
    imageUrl:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80",
    format: "jpeg",
    fileSize: "2.1 MB",
    category: "Entertainment",
    views: 9300,
    likes: 1240,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getStoredImages(): UploadedImage[] {
  if (typeof window === "undefined") return INITIAL_SEED_IMAGES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_IMAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(LOCAL_STORAGE_IMAGES_KEY, JSON.stringify(INITIAL_SEED_IMAGES));
    return INITIAL_SEED_IMAGES;
  } catch {
    return INITIAL_SEED_IMAGES;
  }
}

export function saveStoredImages(images: UploadedImage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_IMAGES_KEY, JSON.stringify(images));
  } catch {
    // quota safe
  }
}

export async function fetchUploadedImages(userId?: string): Promise<UploadedImage[]> {
  try {
    const res = await api.images.list(userId ? { userId } : undefined);
    if (res && res.images && Array.isArray(res.images)) {
      const serverImages: UploadedImage[] = res.images.map((item: any) => ({
        id: String(item.id),
        userId: item.user_id || item.userId || "FT102857",
        creatorName: item.creator_name || item.creatorName || "FaceTube Creator",
        title: item.title || "Uploaded Image",
        description: item.description || "",
        imageUrl: resolveMediaUrl(item.image_url || item.imageUrl),
        format: (item.format || "jpg") as "jpg" | "jpeg" | "png" | "webp",
        fileSize: item.file_size || item.fileSize || "1.0 MB",
        category: item.category || "Entertainment",
        views: Number(item.views) || 0,
        likes: Number(item.likes) || 0,
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      }));

      // Merge with stored local images so newly uploaded images never disappear
      const stored = getStoredImages();
      const serverIds = new Set(serverImages.map((img) => img.id));
      const notInServer = stored.filter((img) => !serverIds.has(img.id));
      const combined = [...notInServer, ...serverImages];
      saveStoredImages(combined);

      if (userId) {
        const norm = userId.trim().toUpperCase();
        return combined.filter((img) => img.userId.trim().toUpperCase() === norm);
      }
      return combined;
    }
  } catch (_e) {
    // fallback to local storage
  }

  const all = getStoredImages();
  if (userId) {
    const norm = userId.trim().toUpperCase();
    return all.filter((img) => img.userId.trim().toUpperCase() === norm);
  }
  return all;
}

export async function recordNewImageUpload(data: {
  userId: string;
  creatorName: string;
  title: string;
  description?: string;
  imageUrl: string;
  format: "jpg" | "jpeg" | "png" | "webp";
  fileSize?: string;
  category?: string;
}): Promise<UploadedImage> {
  const normUserId = data.userId.trim().toUpperCase();
  const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newImage: UploadedImage = {
    id,
    userId: normUserId,
    creatorName: data.creatorName || "FaceTube Creator",
    title: data.title,
    description: data.description || "",
    imageUrl: data.imageUrl,
    format: data.format,
    fileSize: data.fileSize || "1.2 MB",
    category: data.category || "Entertainment",
    views: 0,
    likes: 0,
    createdAt: now,
  };

  // 1. Persist to PHP MySQL API
  try {
    await api.images.create({
      id,
      user_id: normUserId,
      creator_name: newImage.creatorName,
      title: newImage.title,
      description: newImage.description,
      image_url: newImage.imageUrl,
      format: newImage.format,
      file_size: newImage.fileSize,
      category: newImage.category,
    });
  } catch (e) {
    console.warn("API recordNewImageUpload fallback:", e);
  }

  // 2. Local storage
  const images = getStoredImages();
  images.unshift(newImage);
  saveStoredImages(images);

  return newImage;
}

/**
 * Interleaves a video feed sequence with uploaded images.
 * Requirement 2: After approximately 5 video items, 1 uploaded image appears as an additional item.
 * - Configurable interval (default: IMAGE_FEED_INTERVAL = 5)
 * - Does NOT replace or remove videos
 * - If images are not available, continues displaying videos normally
 */
export function interleaveFeedWithImages<T extends { id: string }>(
  videos: T[],
  images: UploadedImage[],
  interval: number = IMAGE_FEED_INTERVAL,
): Array<{ type: "video"; data: T } | { type: "image"; data: UploadedImage }> {
  if (!images || images.length === 0 || interval <= 0) {
    return videos.map((v) => ({ type: "video" as const, data: v }));
  }

  const combined: Array<{ type: "video"; data: T } | { type: "image"; data: UploadedImage }> = [];
  let imageIndex = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    if (video) {
      combined.push({ type: "video", data: video });
    }

    // After every `interval` video items (e.g. 5th, 10th, 15th...), insert 1 uploaded image
    if ((i + 1) % interval === 0) {
      const img = images[imageIndex % images.length];
      if (img) {
        combined.push({ type: "image", data: img });
        imageIndex++;
      }
    }
  }

  return combined;
}
