/**
 * FaceTube - Production Thumbnail Service
 * Robust poster resolution, client-side video frame capture, and graceful category fallbacks.
 */

import { resolveMediaUrl } from "./media-url";

export const CATEGORY_THUMBNAILS: Record<string, string> = {
  Cartoon:
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
  Agriculture:
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
  Coding:
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
  Motivational:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
  Comedy:
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop&q=80",
  Blog: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80",
  Movie:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
  Entertainment:
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80",
  Cooking:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80",
  Finance:
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=80",
  "Share Market":
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80",
  Business:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
  Crypto:
    "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800&auto=format&fit=crop&q=80",
  General:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
};

export const SVG_FALLBACK_THUMBNAIL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiB2aWV3Qm94PSIwIDAgNjQwIDM2MCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWUxYjRiIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwZjE3MmEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM4ODEzMzciLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PGNpcmNsZSBjeD0iMzIwIiBjeT0iMTgwIiByPSI0MiIgZmlsbD0iI2UxMWQ0OCIgb3BhY2l0eT0iMC45Ii8+PHBvbHlnb24gcG9pbnRzPSIzMTIsMTY1IDMzNiwxODAgMzEyLDE5NSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=";

/**
 * Returns a high-res cover image URL corresponding to the video's category.
 */
export function getCategoryFallbackThumbnail(category?: string): string {
  const defaultThumbnail = CATEGORY_THUMBNAILS["General"] ?? SVG_FALLBACK_THUMBNAIL;
  if (!category) return defaultThumbnail;
  const trimmed = category.trim();
  const match = Object.keys(CATEGORY_THUMBNAILS).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase(),
  );
  if (match) {
    const matchedThumb = CATEGORY_THUMBNAILS[match];
    if (matchedThumb) {
      return matchedThumb;
    }
  }
  return defaultThumbnail;
}

/**
 * Safely resolves a usable thumbnail URL for any video item.
 * Prioritizes custom uploaded posters, data URLs, static thumbnails, and category fallbacks.
 * Filters out invalid literal strings like "undefined" or "null" and normalizes relative paths.
 */
export function resolveVideoThumbnail(video?: {
  thumbnailUrl?: string;
  thumbnail_url?: string;
  thumb?: string;
  thumbnail?: string;
  category?: string;
}): string {
  if (!video) return CATEGORY_THUMBNAILS["General"] ?? SVG_FALLBACK_THUMBNAIL;
  const rawCand = video.thumbnailUrl || video.thumbnail_url || video.thumb || video.thumbnail;

  if (rawCand && typeof rawCand === "string") {
    const trimmed = rawCand.trim();
    // Guard against literal "undefined", "null", or empty values
    if (
      trimmed.length > 0 &&
      trimmed !== "undefined" &&
      trimmed !== "null" &&
      trimmed !== "NaN" &&
      !trimmed.includes("[object")
    ) {
      return resolveMediaUrl(trimmed);
    }
  }

  return getCategoryFallbackThumbnail(video.category);
}

/**
 * Captures a video frame thumbnail via HTML5 canvas at 0.5s - 1.0s.
 * Uses optimized dimensions (640x360) and quality (0.72) to generate a lightweight image.
 */
export async function captureVideoThumbnail(file: File): Promise<string> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "";
  }

  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      let settled = false;
      const finish = (result: string) => {
        if (!settled) {
          settled = true;
          URL.revokeObjectURL(url);
          resolve(result);
        }
      };

      const timer = setTimeout(() => {
        finish("");
      }, 5000);

      video.onloadedmetadata = () => {
        const seekTime = Math.min(1.0, video.duration > 0 ? video.duration * 0.2 : 0.5);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 360;
          // Target max width 640 for crisp thumbnail without exceeding payload limits
          canvas.width = Math.min(width, 640);
          canvas.height = Math.round((canvas.width * (height || 9)) / (width || 16));
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
            clearTimeout(timer);
            finish(dataUrl);
            return;
          }
        } catch (_err) {
          // ignore
        }
        clearTimeout(timer);
        finish("");
      };

      video.onerror = () => {
        clearTimeout(timer);
        finish("");
      };
    } catch (_err) {
      resolve("");
    }
  });
}

/**
 * Captures a video frame and uploads it directly to server storage via /api/uploads/image.php,
 * returning the persistent URL (e.g. /uploads/images/img_xxxx.jpg).
 * Falls back to category fallback thumbnail if upload fails or is unavailable.
 */
export async function captureAndUploadThumbnail(file: File, category?: string): Promise<string> {
  const fallback = getCategoryFallbackThumbnail(category);
  try {
    const dataUrl = await captureVideoThumbnail(file);
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return fallback;
    }

    // Convert data URL to Blob for upload
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const imageFile = new File([blob], `thumb_${Date.now()}.jpg`, { type: "image/jpeg" });

    const { api } = await import("./api");
    const uploadRes = await api.uploads.uploadImage(imageFile);
    if (uploadRes && uploadRes.url) {
      return uploadRes.url;
    }
  } catch (err) {
    console.warn("captureAndUploadThumbnail fallback to category thumbnail:", err);
  }
  return fallback;
}
