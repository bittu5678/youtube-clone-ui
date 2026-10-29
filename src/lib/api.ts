/**
 * FaceTube - Centralized Production PHP REST API Client
 * Replaces Supabase queries with direct PHP + MySQL backend endpoints.
 * Base URL configurable via VITE_API_BASE_URL (defaults to /api)
 */

export const PRODUCTION_API_URL = "https://api.facetube.online";

/**
 * Returns the base URL for FaceTube PHP API calls.
 * 1. Explicit override: VITE_API_BASE_URL (if provided)
 * 2. Production browser: Automatically defaults to https://api.facetube.online on facetube.online
 * 3. Production SSR: Defaults to https://api.facetube.online when NODE_ENV is production
 * 4. Local development / Preview: Defaults to /api (handled by Vite dev middleware)
 */
export function getApiBaseUrl(): string {
  // 1. Explicit environment variable override
  const envApiUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.["VITE_API_BASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_API_BASE_URL"]);
  if (envApiUrl) {
    const rawApi = String(envApiUrl).trim().replace(/\/+$/, "");
    if (
      rawApi.toLowerCase().includes("api.facetube.online") &&
      rawApi.toLowerCase().endsWith("/api")
    ) {
      return rawApi.replace(/\/api\/?$/i, "");
    }
    return rawApi;
  }

  // 2. Production browser: Automatically route to live PHP + MySQL backend on api.facetube.online
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const isLocalOrPreview =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local") ||
      host.includes("run.app") ||
      host.includes("aistudio");

    if (
      host === "facetube.online" ||
      host === "www.facetube.online" ||
      host === "api.facetube.online" ||
      host.endsWith(".facetube.online") ||
      (!isLocalOrPreview && (import.meta.env?.PROD || process.env["NODE_ENV"] === "production"))
    ) {
      return PRODUCTION_API_URL;
    }
  }

  // 3. Production SSR (Server-Side Rendering)
  if (typeof window === "undefined" && process.env["NODE_ENV"] === "production") {
    if (process.env["USE_REMOTE_PHP_API"] === "true") {
      return PRODUCTION_API_URL;
    }
    return "/api";
  }

  // 4. Local development / Preview fallback (handled by Vite dev middleware)
  return "/api";
}

export const API_BASE_URL = getApiBaseUrl();

export const TOKEN_STORAGE_KEY = "facetube_auth_token";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage quota or private browsing
  }
}

/**
 * Universal API Fetch Wrapper with Bearer Authentication
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Do not set Content-Type if sending FormData (browser sets boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const baseUrl = getApiBaseUrl();
  let url = `${baseUrl}${cleanEndpoint}`;

  // When running on the server (SSR / Node.js runtime), fetch requires an absolute URL with protocol and host
  if (typeof window === "undefined" && !url.startsWith("http://") && !url.startsWith("https://")) {
    const port = process.env["PORT"] || 3000;
    url = `http://127.0.0.1:${port}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (
    typeof data === "string" &&
    (data.includes("<?php") || data.startsWith("<!DOCTYPE") || data.startsWith("<html"))
  ) {
    throw new Error(`Invalid response received from endpoint ${cleanEndpoint}`);
  }

  if (!res.ok) {
    const errorMsg =
      (typeof data === "object" && (data?.error || data?.message || data?.msg)) ||
      (typeof data === "string" && data) ||
      `HTTP error ${res.status}: ${res.statusText}`;
    const err = new Error(errorMsg) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

/**
 * Modular FaceTube PHP Backend Endpoints
 */
export const api = {
  // Authentication
  auth: {
    register: async (params: {
      name: string;
      mobile: string;
      email: string;
      password: string;
      referralCode?: string;
    }) => {
      const res = await apiFetch<{
        success: boolean;
        token?: string;
        user?: any;
        userId?: string;
        message?: string;
      }>("/auth/register.php", {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (res.token) {
        setStoredAuthToken(res.token);
      }
      return res;
    },

    login: async (params: { identifier: string; password: string }) => {
      const res = await apiFetch<{
        success: boolean;
        token?: string;
        user?: any;
        message?: string;
      }>("/auth/login.php", {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (res.token) {
        setStoredAuthToken(res.token);
      }
      return res;
    },

    logout: async () => {
      try {
        await apiFetch("/auth/logout.php", { method: "POST" });
      } finally {
        setStoredAuthToken(null);
      }
    },

    me: async () => {
      return apiFetch<{
        authenticated: boolean;
        user: any | null;
      }>("/auth/me.php");
    },

    changePassword: async (params: {
      currentPassword: string;
      newPassword: string;
      confirmPassword?: string;
    }) => {
      return apiFetch<{
        success: boolean;
        message?: string;
      }>("/auth/change-password.php", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },

    forgotPassword: async (params: { identifier: string }) => {
      return apiFetch<{
        success: boolean;
        message: string;
      }>("/auth/forgot-password.php", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },

    resetPassword: async (params: {
      email: string;
      token: string;
      newPassword: string;
      confirmPassword?: string;
    }) => {
      return apiFetch<{
        success: boolean;
        message: string;
      }>("/auth/reset-password.php", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  },

  // Users & Profiles
  users: {
    getProfile: async (userId?: string) => {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return apiFetch<{ success: boolean; profile: any }>(`/users/profile.php${q}`);
    },

    updateProfile: async (data: { name?: string; mobile?: string; avatar_url?: string }) => {
      return apiFetch<{ success: boolean; profile: any; message?: string }>("/users/profile.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    listUsers: async () => {
      return apiFetch<{ success: boolean; users: any[]; total: number }>("/users/list.php");
    },

    updateChannelLogo: async (data: {
      userId?: string;
      channelLogoUrl?: string;
      channelName?: string;
    }) => {
      return apiFetch<{
        success: boolean;
        message?: string;
        channel_logo_url?: string;
        channel_name?: string;
      }>("/users/channel-logo.php", {
        method: "POST",
        body: JSON.stringify({
          userId: data.userId,
          channel_logo_url: data.channelLogoUrl,
          channel_name: data.channelName,
        }),
      });
    },
  },

  // Videos
  videos: {
    list: async (params?: {
      userId?: string;
      videoType?: "free" | "premium";
      contentType?: "short" | "long";
      category?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.userId) searchParams.set("userId", params.userId);
      if (params?.videoType) searchParams.set("videoType", params.videoType);
      if (params?.contentType) searchParams.set("contentType", params.contentType);
      if (params?.category) searchParams.set("category", params.category);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.offset) searchParams.set("offset", String(params.offset));

      const qs = searchParams.toString();
      return apiFetch<{ success: boolean; videos: any[]; total: number }>(
        `/videos/list.php${qs ? `?${qs}` : ""}`,
      );
    },

    get: async (id: string) => {
      return apiFetch<{ success: boolean; video: any }>(
        `/videos/get.php?id=${encodeURIComponent(id)}`,
      );
    },

    create: async (videoData: any) => {
      return apiFetch<{ success: boolean; video: any }>("/videos/create.php", {
        method: "POST",
        body: JSON.stringify(videoData),
      });
    },

    like: async (videoId: string, userId: string) => {
      return apiFetch<{ success: boolean; liked: boolean; likes: number }>("/videos/like.php", {
        method: "POST",
        body: JSON.stringify({ videoId, userId }),
      });
    },

    getCounts: async (userId?: string) => {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return apiFetch<{ success: boolean; counts: any }>(`/videos/counts.php${q}`);
    },

    promote: async (data: {
      videoId: string;
      planId: string;
      durationDays: number;
      paymentId?: string;
    }) => {
      return apiFetch<{ success: boolean; message: string; promotionExpiresAt: string }>(
        "/videos/promote.php",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },
  },

  // Comments
  comments: {
    list: async (videoId: string) => {
      return apiFetch<{ success: boolean; comments: any[]; total: number }>(
        `/comments/list.php?videoId=${encodeURIComponent(videoId)}`,
      );
    },

    create: async (data: {
      videoId: string;
      userId: string;
      userName: string;
      avatarUrl?: string;
      comment: string;
    }) => {
      return apiFetch<{ success: boolean; comment: any }>("/comments/create.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  // Images Media Library
  images: {
    list: async (params?: { userId?: string; category?: string; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.userId) searchParams.set("userId", params.userId);
      if (params?.category) searchParams.set("category", params.category);
      if (params?.limit) searchParams.set("limit", String(params.limit));

      const qs = searchParams.toString();
      return apiFetch<{ success: boolean; images: any[]; total: number }>(
        `/images/list.php${qs ? `?${qs}` : ""}`,
      );
    },

    create: async (imageData: any) => {
      return apiFetch<{ success: boolean; image: any }>("/images/create.php", {
        method: "POST",
        body: JSON.stringify(imageData),
      });
    },
  },

  // Wallet & Income Ledger
  wallet: {
    getBalance: async (userId?: string) => {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return apiFetch<{ success: boolean; wallet: any }>(`/wallet/balance.php${q}`);
    },

    getTransactions: async (userId?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (limit) params.set("limit", String(limit));
      const qs = params.toString();
      return apiFetch<{ success: boolean; transactions: any[]; total: number }>(
        `/wallet/transactions.php${qs ? `?${qs}` : ""}`,
      );
    },

    withdraw: async (
      data: {
        userId: string;
        amount: number;
        bankDetails?: {
          accountHolder?: string;
          accountNumber?: string;
          ifscCode?: string;
          upiId?: string;
          bankName?: string;
        };
      },
      options?: RequestInit,
    ) => {
      return apiFetch<{
        success: boolean;
        message?: string;
        transaction?: any;
        updatedWallet?: any;
        error?: string;
      }>("/wallet/withdraw.php", {
        method: "POST",
        body: JSON.stringify(data),
        ...options,
      });
    },

    getEarningsHistory: async (userId?: string, days = 14) => {
      const params = new URLSearchParams();
      if (userId) params.set("user_id", userId);
      params.set("days", String(days));
      return apiFetch<{
        success: boolean;
        user_id: string;
        days: number;
        history: Array<{
          date: string;
          day: string;
          revenue: number;
          referral_income: number;
          global_income: number;
          adsense_income: number;
          affiliate_income: number;
          tx_count: number;
        }>;
      }>(`/wallet/earnings-history.php?${params.toString()}`);
    },
  },

  // KYC
  kyc: {
    getPersonal: async (userId?: string) => {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return apiFetch<{ success: boolean; kyc: any }>(`/kyc/personal.php${q}`);
    },

    savePersonal: async (data: any) => {
      return apiFetch<{ success: boolean; message: string }>("/kyc/personal.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    getBank: async (userId?: string) => {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return apiFetch<{ success: boolean; kyc: any }>(`/kyc/bank.php${q}`);
    },

    saveBank: async (data: any) => {
      return apiFetch<{ success: boolean; message: string }>("/kyc/bank.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  // Referrals
  referrals: {
    getDashboard: async (userId?: string) => {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return apiFetch<{ success: boolean; dashboard: any }>(`/referrals/dashboard.php${q}`);
    },
    getTeam: async (userId?: string, level?: number | "all") => {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (level && level !== "all") params.set("level", String(level));
      const q = params.toString() ? `?${params.toString()}` : "";
      return apiFetch<{
        success: boolean;
        userId: string;
        totalTeamCount: number;
        directCount: number;
        levelCounts: Record<string, number>;
        members: Array<{
          id: string;
          userId: string;
          name: string;
          level: number;
          sponsor: string;
          sponsorUserId: string;
          joinedAt: string;
          role: string;
          rank: string;
          teamSize: number;
          status: "Active" | "Inactive";
          access: "Granted" | "Restricted";
        }>;
      }>(`/referrals/team.php${q}`);
    },
  },

  // Certificates
  certificates: {
    get: async (userId?: string) => {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return apiFetch<{ success: boolean; certificate: any }>(`/certificates/get.php${q}`);
    },

    save: async (certData: any) => {
      return apiFetch<{ success: boolean; message: string; certificateId: string }>(
        "/certificates/save.php",
        {
          method: "POST",
          body: JSON.stringify(certData),
        },
      );
    },
  },

  // Payments & Transactions
  payments: {
    createOrder: async (data: {
      purpose: "premium_video_upload" | "ads_promotion";
      userId: string;
      userName?: string;
      videoId?: string;
      contentType?: "short" | "long";
      planId?: string;
    }) => {
      return apiFetch<{
        orderId: string;
        amount: number;
        amountInSubunits: number;
        currency: "INR";
        purpose: string;
        keyId: string;
      }>("/payments/create-order.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    verify: async (data: {
      orderId: string;
      paymentId: string;
      signature?: string;
      userId: string;
      userName?: string;
      videoId?: string;
      purpose: "premium_video_upload" | "ads_promotion";
      referrerUserId?: string | null;
      planId?: string;
      amount?: number;
      metadata?: Record<string, unknown>;
    }) => {
      return apiFetch<{
        verified: boolean;
        paymentId: string;
        orderId: string;
        amount: number;
        txNumber?: number;
        isSpecialTransaction?: boolean;
        specialTag?: string;
        distribution?: any;
        error?: string;
      }>("/payments/verify.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    getTransactions: async () => {
      return apiFetch<{
        status: string;
        lastTxNumber: number;
        totalTransactions: number;
        transactions: any[];
      }>("/payments/transactions.php");
    },
  },

  // File Uploads
  uploads: {
    uploadImage: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiFetch<{
        success: boolean;
        url: string;
        fileName: string;
        format: string;
        fileSize: string;
      }>("/uploads/image.php", {
        method: "POST",
        body: formData,
      });
    },

    uploadVideo: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      return apiFetch<{
        success: boolean;
        url: string;
        fileName: string;
        format: string;
      }>("/uploads/video.php", {
        method: "POST",
        body: formData,
      });
    },

    uploadKyc: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      return apiFetch<{
        success: boolean;
        url: string;
        fileName: string;
      }>("/uploads/kyc.php", {
        method: "POST",
        body: formData,
      });
    },
  },

  // Admin
  admin: {
    getStats: async () => {
      return apiFetch<{ success: boolean; stats: any }>("/admin/stats.php");
    },

    updateRole: async (targetUserId: string, role: "admin" | "user") => {
      return apiFetch<{ success: boolean; message: string }>("/admin/role.php", {
        method: "POST",
        body: JSON.stringify({ targetUserId, role }),
      });
    },

    listVideos: async (params?: { includeBlocked?: boolean }) => {
      const q = params?.includeBlocked ? "?include_blocked=1" : "";
      return apiFetch<{
        success: boolean;
        videos: any[];
        counts: { total: number; blocked: number; shorts: number; long: number };
      }>(`/admin/videos.php${q}`);
    },

    updateVideoStatus: async (params: { videoId: string; isBlocked: boolean; reason?: string }) => {
      return apiFetch<{
        success: boolean;
        message: string;
        video_id: string;
        is_blocked: boolean;
      }>("/admin/videos.php", {
        method: "POST",
        body: JSON.stringify({
          videoId: params.videoId,
          isBlocked: params.isBlocked,
          reason: params.reason || "Content moderation",
        }),
      });
    },

    bulkPayout: async (params: {
      payouts: Array<{ userId: string; amount: number; transactionId?: string }>;
      notes?: string;
    }) => {
      return apiFetch<{
        success: boolean;
        message: string;
        batch_id: string;
        total_recipients: number;
        total_amount: number;
        processed: any[];
      }>("/admin/bulk-payout.php", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },

    createCategory: async (name: string) => {
      return apiFetch<{
        success: boolean;
        message: string;
        category?: {
          id: string | number;
          name: string;
          slug: string;
          created_by?: string;
          created_at?: string;
        };
        error?: string;
      }>("/admin/categories.php", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
  },

  // Categories
  categories: {
    list: async () => {
      return apiFetch<{
        success: boolean;
        source?: string;
        categories: Array<{
          id: string | number;
          name: string;
          slug: string;
          created_by?: string;
          created_at?: string;
        }>;
      }>("/categories/list.php");
    },
  },

  // Live Streams
  live: {
    listStreams: async () => {
      return apiFetch<{ success: boolean; streams: any[] }>("/live/streams.php");
    },

    createStream: async (params: {
      title: string;
      description?: string;
      category?: string;
      thumbnailUrl?: string;
    }) => {
      return apiFetch<{ success: boolean; message: string; stream: any }>("/live/streams.php", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },

    getChatMessages: async (streamId: string) => {
      return apiFetch<{ success: boolean; stream_id: string; messages: any[] }>(
        `/live/chat.php?stream_id=${encodeURIComponent(streamId)}`,
      );
    },

    sendChatMessage: async (params: {
      streamId: string;
      message: string;
      isSuperchat?: boolean;
      superchatAmount?: number;
      userName?: string;
    }) => {
      return apiFetch<{ success: boolean; message: any }>("/live/chat.php", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  },
};
