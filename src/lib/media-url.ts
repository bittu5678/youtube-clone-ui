/**
 * FaceTube - Production Media URL Resolver
 * Resolves video and thumbnail paths between frontend (https://facetube.online)
 * and the PHP media storage host (https://api.facetube.online).
 * Prevents double domains, handles SSR, and supports local dev environments.
 */

export const PRODUCTION_API_DOMAIN = "https://facetube.online";

/**
 * Returns the base URL for uploaded media files.
 * In production (facetube.online), media files are hosted on https://facetube.online.
 * In local dev or emulator, media files are served from the current origin.
 */
export function getMediaBaseUrl(): string {
  // 1. Explicit environment variable override
  const envMedia =
    (typeof import.meta !== "undefined" && import.meta.env?.["VITE_MEDIA_BASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_MEDIA_BASE_URL"]);
  if (envMedia) {
    return String(envMedia).replace(/\/+$/, "");
  }

  // 2. Derive from VITE_API_BASE_URL if configured
  const envApi =
    (typeof import.meta !== "undefined" && import.meta.env?.["VITE_API_BASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_API_BASE_URL"]);
  if (envApi) {
    const rawApi = String(envApi).trim();
    const apiBase = rawApi.replace(/\/+$/, "");
    if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
      // Strip trailing /api if present, because uploads are served directly at domain root /uploads/
      return apiBase.replace(/\/api\/?$/i, "");
    }
  }

  // 3. In production browser on facetube.online, resolve to production media domain
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "facetube.online" || host === "www.facetube.online") {
      return PRODUCTION_API_DOMAIN;
    }
  }

  // 4. Default to current host relative paths (e.g. /uploads/...)
  return "";
}

/**
 * Resolves a raw video or thumbnail URL to a fully qualified, publicly accessible URL.
 * Handles:
 * - Relative paths like "/uploads/videos/vid_123.mp4" -> "https://api.facetube.online/uploads/videos/vid_123.mp4"
 * - Already absolute URLs (https://...) -> returned as-is
 * - Accidental duplicated domains ("https://api.facetube.onlinehttps://api.facetube.online/...") -> unnested safely
 * - Data URLs and Unsplash URLs -> preserved intact
 */
export function resolveMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return "";
  }

  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed === "NaN" ||
    trimmed.includes("[object")
  ) {
    return "";
  }

  // Already a data URL, blob, or asset import
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Fix accidental duplicate domain prefixes (e.g. "https://api.facetube.onlinehttps://api.facetube.online/...")
  const doubleDomainRegex = /^(https?:\/\/[^/]+)(https?:\/\/.+)$/i;
  const match = trimmed.match(doubleDomainRegex);
  if (match) {
    return resolveMediaUrl(match[2]);
  }

  // If already an absolute HTTP/HTTPS URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Normalize relative path with leading slash
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // If the path is for uploaded files (/uploads/...)
  if (cleanPath.startsWith("/uploads/")) {
    const mediaBase = getMediaBaseUrl();
    if (mediaBase) {
      return `${mediaBase}${cleanPath}`;
    }
    return cleanPath;
  }

  // General relative path
  return cleanPath;
}
