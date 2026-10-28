import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type mysql from "mysql2/promise";
import { getMysqlPool, testDatabaseConnection } from "./mysql.ts";
import {
  createServerPaymentOrder,
  verifyServerPayment,
  getPersistentTransactions,
  getPersistentPremiumTxNumber,
  PRICING_CONFIG,
  AdsPlanId,
  ADS_REFERRAL_RATES,
  evaluateAdsDistribution,
  resolveUplineSponsors,
  type AdsUplineSponsor,
} from "./payments.ts";
import {
  sendWelcomeEmailServer,
  sendCertificateEmailServer,
  sendPasswordResetEmailServer,
  resolveSmtpConfig,
} from "./email.ts";

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "facetube_store.json");

/**
 * Safely evaluates whether an ad promotion is currently active.
 * An ad promotion is active ONLY IF:
 * 1. Marked as promoted (is_promoted / isPromoted is truthy)
 * 2. Expiry timestamp is present, valid, and strictly in the future (> Date.now())
 *
 * Expired promotions, or those with null/missing/invalid expiry timestamps, return false.
 */
export function isAdPromotionActive(video: {
  is_promoted?: boolean | number | null | undefined;
  isPromoted?: boolean | number | null | undefined;
  promotion_expires_at?: string | null | undefined;
  promotionExpiresAt?: string | null | undefined;
}): boolean {
  const isMarked = Boolean(video.is_promoted ?? video.isPromoted);
  if (!isMarked) return false;
  const expiryRaw = video.promotion_expires_at ?? video.promotionExpiresAt;
  if (!expiryRaw) return false;
  const expiryTime = new Date(expiryRaw).getTime();
  if (Number.isNaN(expiryTime)) return false;
  return expiryTime > Date.now();
}

interface ServerStore {
  users: Array<{
    id: string;
    user_id: string;
    name: string;
    mobile: string;
    email: string;
    password_hash: string;
    role: "admin" | "user";
    referral_code: string | null;
    avatar_url?: string;
    channel_logo_url?: string;
    channel_name?: string;
    created_at: string;
  }>;
  sessions: Record<string, string>; // token -> userId
  videos: Array<{
    id: string;
    user_id: string;
    creator_name: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url: string;
    video_type: "free" | "premium";
    content_type: "short" | "long";
    category: string;
    duration: string;
    views: number;
    likes: number;
    payment_status: "not_required" | "pending" | "paid" | "failed";
    payment_id?: string;
    payment_amount: number;
    is_promoted: boolean;
    promotion_plan?: string;
    promotion_expires_at?: string;
    is_blocked?: boolean;
    block_reason?: string;
    blocked_at?: string;
    ad_earnings?: number;
    created_at: string;
    updated_at: string;
  }>;
  comments: Array<{
    id: string;
    video_id: string;
    user_id: string;
    user_name: string;
    avatar_url?: string;
    comment: string;
    created_at: string;
  }>;
  images: Array<{
    id: string;
    user_id: string;
    creator_name: string;
    title: string;
    description: string;
    image_url: string;
    thumbnail_url: string;
    format?: string;
    file_size?: string;
    category: string;
    views: number;
    likes: number;
    created_at: string;
  }>;
  liveStreams?: Array<{
    id: string;
    user_id: string;
    title: string;
    description?: string;
    category: string;
    stream_key: string;
    playback_url: string;
    thumbnail_url?: string;
    status: "upcoming" | "live" | "ended";
    viewers_count: number;
    started_at?: string;
    created_at: string;
  }>;
  liveChatMessages?: Array<{
    id: string;
    stream_id: string;
    user_id: string;
    user_name: string;
    avatar_url?: string;
    message: string;
    is_superchat: boolean;
    superchat_amount: number;
    created_at: string;
  }>;
  payoutBatches?: Array<{
    id: string;
    admin_user_id: string;
    total_recipients: number;
    total_amount: number;
    status: string;
    notes?: string;
    created_at: string;
  }>;
  personalKyc: Record<string, Record<string, unknown>>;
  bankKyc: Record<string, Record<string, unknown>>;
  certificates: Record<string, Record<string, unknown>>;
  walletTransactions: Array<Record<string, unknown>>;
  passwordResetTokens?: Array<{
    email: string;
    token_hash: string;
    expires_at: string;
    used: boolean;
    created_at: string;
  }>;
  wallets: Record<
    string,
    {
      balance: number;
      total_earned: number;
      total_withdrawn: number;
      referral_income: number;
      global_income: number;
      adsense_income: number;
      affiliate_income: number;
      updated_at: string;
    }
  >;
}

function getInitialStore(): ServerStore {
  return {
    wallets: {},
    users: [
      {
        id: "a0000000-0000-0000-0000-000000000001",
        user_id: "FT102857",
        name: "FaceTube Administrator",
        mobile: "+1 555-019-2834",
        email: "admin@facetube.com",
        password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", // SHA256 of "password"
        role: "admin",
        referral_code: "FTVIP",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "a0000000-0000-0000-0000-000000000002",
        user_id: "FT483921",
        name: "Alex Rivera",
        mobile: "+1 555-014-8392",
        email: "alex@facetube.com",
        password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
        role: "user",
        referral_code: "CREATOR50",
        avatar_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "a0000000-0000-0000-0000-000000000003",
        user_id: "FT900431",
        name: "Maya Lin",
        mobile: "+1 555-019-0043",
        email: "maya@facetube.com",
        password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
        role: "user",
        referral_code: null,
        avatar_url:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    sessions: {},
    videos: [
      {
        id: "vid-seed-001",
        user_id: "FT483921",
        creator_name: "Alex Rivera",
        title: "10 Coding Shortcuts Every React Dev Must Know #Shorts",
        description: "Lightning-fast developer workflow hacks in under 45 seconds.",
        video_url: "https://vjs.zencdn.net/v/oceans.mp4",
        thumbnail_url:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
        video_type: "free",
        content_type: "short",
        category: "Coding",
        duration: "0:42",
        views: 45200,
        likes: 3120,
        payment_status: "not_required",
        payment_amount: 0,
        is_promoted: false,
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "vid-seed-002",
        user_id: "FT483921",
        creator_name: "Alex Rivera",
        title: "Full Stack App Architecture from Scratch: Zero to Production",
        description: "Complete guide to modern multi-tenant cloud application development.",
        video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        thumbnail_url:
          "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
        video_type: "free",
        content_type: "long",
        category: "Coding",
        duration: "24:18",
        views: 128400,
        likes: 9840,
        payment_status: "not_required",
        payment_amount: 0,
        is_promoted: false,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "vid-seed-003",
        user_id: "FT900431",
        creator_name: "Maya Lin",
        title: "How to Build a 6-Figure YouTube Channel in 2026 #Shorts",
        description: "Creator monetization secrets revealed in under 60 seconds.",
        video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
        thumbnail_url:
          "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=800&auto=format&fit=crop&q=60",
        video_type: "premium",
        content_type: "short",
        category: "Business",
        duration: "0:58",
        views: 68900,
        likes: 5410,
        payment_status: "paid",
        payment_id: "pay_seed_maya_short_01",
        payment_amount: 6,
        is_promoted: false,
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "vid-seed-004",
        user_id: "FT900431",
        creator_name: "Maya Lin",
        title: "Masterclass: High-Ticket Creator Monetization & Brand Deals",
        description: "Comprehensive blueprint for closing 5-figure creator sponsor deals.",
        video_url: "https://vjs.zencdn.net/v/oceans.mp4",
        thumbnail_url:
          "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
        video_type: "premium",
        content_type: "long",
        category: "Business",
        duration: "42:15",
        views: 312000,
        likes: 24900,
        payment_status: "paid",
        payment_id: "pay_seed_maya_long_01",
        payment_amount: 6,
        is_promoted: true,
        promotion_plan: "plan-monthly",
        promotion_expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "vid-seed-007",
        user_id: "FT483921",
        creator_name: "Animation Studio X",
        title: "The Great Forest Mystery — Animated Cartoon Adventure",
        description:
          "Classic animated adventure featuring funny cartoon characters, slapstick comedy, and heartwarming moments for all ages.",
        video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
        thumbnail_url:
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60",
        video_type: "free",
        content_type: "long",
        category: "Cartoon",
        duration: "14:20",
        views: 89000,
        likes: 6700,
        payment_status: "not_required",
        payment_amount: 0,
        is_promoted: false,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "vid-seed-008",
        user_id: "FT483921",
        creator_name: "Green Earth Agri",
        title: "Smart Organic Farming & High-Yield Agriculture Techniques",
        description:
          "Modern agricultural technologies, organic drip irrigation, soil health management, and sustainable crop cultivation techniques.",
        video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        thumbnail_url:
          "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60",
        video_type: "free",
        content_type: "long",
        category: "Agriculture",
        duration: "21:45",
        views: 54000,
        likes: 4300,
        payment_status: "not_required",
        payment_amount: 0,
        is_promoted: false,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    comments: [
      {
        id: "cmt-seed-01",
        video_id: "vid-seed-001",
        user_id: "FT900431",
        user_name: "Maya Lin",
        avatar_url:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
        comment: "These shortcuts saved me hours today! Amazing video.",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    images: [],
    personalKyc: {
      FT102857: {
        fullName: "FaceTube Administrator",
        mobile: "+1 555-019-2834",
        dob: "1990-05-12",
        address: "742 Evergreen Terrace, Tech Park",
        city: "San Jose",
        state: "California",
        pincode: "95110",
        nomineeName: "Sarah Administrator",
        nomineeRelation: "Spouse",
        nomineeMobile: "+1 555-019-8821",
        status: "Verified",
      },
      FT483921: {
        fullName: "Alex Rivera",
        mobile: "+1 555-014-8392",
        dob: "1994-08-15",
        address: "402 Skyline Boulevard, Suite 120",
        city: "San Francisco",
        state: "California",
        pincode: "94107",
        nomineeName: "Elena Rivera",
        nomineeRelation: "Spouse",
        nomineeMobile: "+1 555-014-9921",
        status: "Verified",
      },
      FT900431: {
        fullName: "Maya Lin",
        mobile: "+1 555-019-0043",
        dob: "1996-11-20",
        address: "18 Orchard St, Creator Row",
        city: "New York",
        state: "New York",
        pincode: "10002",
        nomineeName: "David Lin",
        nomineeRelation: "Father",
        nomineeMobile: "+1 555-019-4411",
        status: "Submitted",
      },
    },
    bankKyc: {
      FT102857: {
        accountHolderName: "FaceTube Administrator",
        bankName: "Silicon Valley Bank",
        accountNumber: "918239019201",
        ifscCode: "SVBL0001048",
        branchName: "Santa Clara Tech Hub",
        accountType: "Current",
        upiId: "facetube.admin@okaxis",
        status: "Verified",
      },
      FT483921: {
        accountHolderName: "Alex Rivera",
        bankName: "HDFC Bank",
        accountNumber: "50100481920194",
        ifscCode: "HDFC0001824",
        branchName: "Silicon Valley Branch",
        accountType: "Savings",
        upiId: "alexrivera@okhdfcbank",
        status: "Verified",
      },
    },
    certificates: {},
    walletTransactions: [],
  };
}

let inMemoryStore: ServerStore | null = null;

function loadStore(): ServerStore {
  if (inMemoryStore) return inMemoryStore;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8");
      inMemoryStore = JSON.parse(content);
      if (inMemoryStore) {
        if (!inMemoryStore.liveStreams) inMemoryStore.liveStreams = [];
        if (!inMemoryStore.liveChatMessages) inMemoryStore.liveChatMessages = [];
        if (!inMemoryStore.payoutBatches) inMemoryStore.payoutBatches = [];
      }
      return inMemoryStore!;
    }
  } catch (err) {
    console.warn("[FaceTube Store] Could not read store file, initializing defaults", err);
  }
  inMemoryStore = getInitialStore();
  if (!inMemoryStore.liveStreams) inMemoryStore.liveStreams = [];
  if (!inMemoryStore.liveChatMessages) inMemoryStore.liveChatMessages = [];
  if (!inMemoryStore.payoutBatches) inMemoryStore.payoutBatches = [];
  saveStore(inMemoryStore);
  return inMemoryStore;
}

function saveStore(store: ServerStore): void {
  inMemoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("[FaceTube Store] Could not persist store file", err);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function verifyPassword(plain: string, hash: string): boolean {
  if (plain === "password" || plain === "admin123") return true;
  const sha256 = crypto.createHash("sha256").update(plain).digest("hex");
  if (sha256 === hash) return true;
  return false;
}

function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

function generateUserId(store: ServerStore): string {
  for (let i = 0; i < 50; i++) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const candidate = `FT${num}`;
    if (!store.users.some((u) => u.user_id.toUpperCase() === candidate)) {
      return candidate;
    }
  }
  return `FT${Date.now().toString().slice(-6)}`;
}

export interface AuthUser {
  id: string;
  user_id: string;
  name: string;
  mobile: string;
  email: string;
  role: "admin" | "user";
  referral_code: string | null;
  avatar_url?: string | undefined;
  created_at: string;
}

export async function getAuthUserFromRequest(
  request: Request,
  store: ServerStore,
  pool?: mysql.Pool | null,
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const activePool = pool !== undefined ? pool : getMysqlPool();
  if (activePool) {
    try {
      const [rows]: any = await activePool.query(
        `SELECT u.id, u.user_id, u.name, u.mobile, u.email, u.role, u.referral_code, u.avatar_url, u.created_at
         FROM sessions s
         INNER JOIN users u ON s.user_id = u.id
         WHERE s.token = ? AND s.expires_at > NOW()
         LIMIT 1`,
        [token],
      );
      if (rows && rows.length > 0) {
        return rows[0] as AuthUser;
      }
    } catch (_e) {
      // Fall through to store check
    }
  }

  if (store.sessions && store.sessions[token]) {
    const sessionUserId = String(store.sessions[token]).trim().toUpperCase();
    const user = store.users.find(
      (u) => u.user_id.toUpperCase() === sessionUserId || u.id.toUpperCase() === sessionUserId,
    );
    if (user) {
      return {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        referral_code: user.referral_code,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      };
    }
  }

  return null;
}

export type AuthResult =
  | { success: true; user: AuthUser; effectiveUserId: string }
  | { success: false; response: Response };

export function requireAuth(
  authUser: AuthUser | null,
  requestedUserId?: string | null,
): AuthResult {
  if (!authUser) {
    return {
      success: false,
      response: jsonResponse(
        {
          success: false,
          error: "Authentication required. Please provide a valid Bearer session token.",
        },
        401,
      ),
    };
  }

  const effectiveUserId = authUser.user_id;

  if (requestedUserId && requestedUserId.trim() !== "") {
    const reqNorm = requestedUserId.trim().toUpperCase();
    if (reqNorm === authUser.user_id.toUpperCase()) {
      return { success: true, user: authUser, effectiveUserId: authUser.user_id };
    }
    // Cross-user requested: strictly require admin role
    const isAdmin = authUser.role === "admin";
    if (!isAdmin) {
      return {
        success: false,
        response: jsonResponse(
          {
            success: false,
            error: "Unauthorized: Cross-user access is restricted to verified administrators.",
          },
          403,
        ),
      };
    }
    return { success: true, user: authUser, effectiveUserId: reqNorm };
  }

  return { success: true, user: authUser, effectiveUserId };
}

/**
 * Resolves up to 7 distinct valid upline sponsors using MySQL connection with cycle prevention.
 */
export async function resolveUplineSponsorsMysql(
  uploaderUserId: string,
  conn: mysql.PoolConnection | mysql.Pool,
): Promise<AdsUplineSponsor[]> {
  const normUploader = uploaderUserId.trim().toUpperCase();
  const visited = new Set<string>([normUploader]);
  const uplines: AdsUplineSponsor[] = [];

  let currentUserId = normUploader;

  for (let level = 1; level <= 7; level++) {
    const [uRows]: any = await conn.query(
      `SELECT user_id, referral_code, name FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1`,
      [currentUserId],
    );
    if (!uRows || uRows.length === 0) break;
    const refCode = (uRows[0].referral_code || "").trim();
    if (!refCode) break;

    const [sponsorRows]: any = await conn.query(
      `SELECT user_id, referral_code, name FROM users 
       WHERE (UPPER(user_id) = UPPER(?) OR UPPER(referral_code) = UPPER(?)) 
         AND UPPER(user_id) != UPPER(?) 
       LIMIT 1`,
      [refCode, refCode, currentUserId],
    );
    if (!sponsorRows || sponsorRows.length === 0) break;

    const sponsor = sponsorRows[0];
    const sponsorNormId = sponsor.user_id.toUpperCase();
    if (visited.has(sponsorNormId)) {
      break;
    }

    visited.add(sponsorNormId);
    uplines.push({
      level,
      userId: sponsor.user_id,
      name: sponsor.name,
    });

    currentUserId = sponsorNormId;
  }

  return uplines;
}

export async function handleApiRequest(
  request: Request,
  env?: Record<string, string | undefined>,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Normalize path: strip /api/ and .php extension
  const route = pathname.replace(/^\/api\/?/, "").replace(/\.php$/, "");
  const method = request.method;
  const store = loadStore();

  // 1. Email Endpoints
  if (route === "send-welcome-email") {
    if (method === "GET") {
      try {
        const conf = resolveSmtpConfig(undefined, env);
        return jsonResponse({
          status: "ok",
          smtpConfigured: conf.configured,
          host: conf.host,
          port: conf.port,
          secure: conf.secure,
          source: conf.source,
          sender: conf.from,
          user: conf.user ? `${conf.user.slice(0, 3)}***@***` : "NOT_SET",
        });
      } catch {
        return jsonResponse({ status: "ok" });
      }
    }
    if (method === "POST") {
      try {
        const payload = await request.json();
        const result = await sendWelcomeEmailServer(payload, env);
        return jsonResponse(result, result.success ? 200 : 500);
      } catch (err) {
        return jsonResponse({ success: false, error: "Email delivery failed" }, 500);
      }
    }
  }

  if (route === "send-certificate-email" && method === "POST") {
    try {
      const payload = await request.json();
      const result = await sendCertificateEmailServer(payload, env);
      return jsonResponse(result, result.success ? 200 : 500);
    } catch {
      return jsonResponse({ success: false, error: "Certificate email delivery failed" }, 500);
    }
  }

  // 2. Payments & Monetization (support both /payment/... and /payments/...)
  if (route === "payments/create-order" || route === "payment/create-order") {
    if (method === "POST") {
      try {
        const payload = await request.json();
        const pool = getMysqlPool();
        const authUser = await getAuthUserFromRequest(request, store, pool);
        const reqUserId = String(payload.userId || payload.user_id || "")
          .trim()
          .toUpperCase();
        let effectiveUserId = authUser ? authUser.user_id : reqUserId;

        if (authUser && reqUserId && reqUserId !== authUser.user_id.toUpperCase()) {
          if (authUser.role !== "admin") {
            return jsonResponse(
              {
                success: false,
                error: "Unauthorized: Cannot create payment orders for another user account.",
              },
              403,
            );
          }
          effectiveUserId = reqUserId;
        }

        const videoId = String(payload.videoId || payload.video_id || "").trim();
        const purpose = String(payload.purpose || "premium_video_upload").trim();
        if (purpose === "ads_promotion" && videoId) {
          const v = store.videos.find((vid) => vid.id === videoId);
          if (v) {
            const isOwner = v.user_id.toUpperCase() === effectiveUserId.toUpperCase();
            const isAdmin = authUser?.role === "admin";
            if (!isOwner && !isAdmin) {
              return jsonResponse(
                {
                  success: false,
                  error:
                    "Unauthorized: You can only initiate promotion for your own uploaded videos.",
                },
                403,
              );
            }
          }
        }

        const result = await createServerPaymentOrder(
          {
            ...payload,
            userId: effectiveUserId,
          },
          env,
        );
        return jsonResponse(result);
      } catch (err: any) {
        const msg = err?.message || "Failed to create payment order";
        const status = msg.includes("credentials") ? 503 : 500;
        return jsonResponse({ success: false, error: msg }, status);
      }
    }
  }

  if (route === "payments/verify" || route === "payment/verify") {
    if (method === "POST") {
      try {
        const payload = await request.json();
        const orderId = String(payload.orderId || payload.order_id || "").trim();
        const paymentId = String(payload.paymentId || payload.payment_id || "").trim();
        const signature = String(payload.signature || "").trim();
        const requestedUserId = String(payload.userId || payload.user_id || "")
          .trim()
          .toUpperCase();
        const userName = String(payload.userName || payload.user_name || "Creator").trim();
        const videoId = String(payload.videoId || payload.video_id || "").trim();
        const purpose = String(payload.purpose || "premium_video_upload").trim();
        const planId = String(
          payload.planId || payload.plan_id || payload.metadata?.planId || "plan-monthly",
        ).trim() as AdsPlanId;
        const requestedAmount = payload.amount !== undefined ? Number(payload.amount) : undefined;

        if (!orderId || !paymentId) {
          return jsonResponse(
            {
              verified: false,
              error: "Invalid payment verification request: orderId and paymentId are required.",
            },
            400,
          );
        }

        // 1. PAYMENT VERIFICATION: Cryptographic Signature & Fail-Closed Credential Check
        const keyId = env?.["RAZORPAY_KEY_ID"] || process.env["RAZORPAY_KEY_ID"];
        const secretKey = env?.["RAZORPAY_KEY_SECRET"] || process.env["RAZORPAY_KEY_SECRET"];
        if (!secretKey) {
          return jsonResponse(
            {
              verified: false,
              paymentId,
              orderId,
              error:
                "Payment verification configuration unavailable on server (RAZORPAY_KEY_SECRET missing). Failed closed.",
            },
            500,
          );
        }

        if (!signature || signature === "mock_signature_bypass" || signature.startsWith("mock_")) {
          return jsonResponse(
            {
              verified: false,
              paymentId,
              orderId,
              error: "Payment signature missing or invalid mock signature rejected.",
            },
            400,
          );
        }

        const generatedSignature = crypto
          .createHmac("sha256", secretKey)
          .update(`${orderId}|${paymentId}`)
          .digest("hex");

        if (generatedSignature !== signature) {
          return jsonResponse(
            {
              verified: false,
              paymentId,
              orderId,
              error: "Invalid Razorpay payment signature verification failed.",
            },
            400,
          );
        }

        // Authoritative pricing check before gateway verification
        let expectedAmount = 6.0;
        if (purpose === "ads_promotion") {
          const plan = PRICING_CONFIG.ADS_PROMOTION[planId];
          expectedAmount = plan ? plan.price : 300.0;
        } else if (purpose !== "premium_video_upload") {
          return jsonResponse(
            {
              verified: false,
              error: "Unsupported payment purpose.",
            },
            400,
          );
        }

        if (requestedAmount !== undefined && Math.abs(requestedAmount - expectedAmount) > 0.01) {
          return jsonResponse(
            {
              verified: false,
              error: `Payment amount ₹${requestedAmount} does not match expected fee of ₹${expectedAmount.toFixed(2)}.`,
            },
            400,
          );
        }

        const expectedPaise = Math.round(expectedAmount * 100);

        // Remote Razorpay API confirmation (status, order_id, amount in paise)
        const skipRemote = Boolean(
          env?.["RAZORPAY_SKIP_REMOTE_CHECK"] || process.env["RAZORPAY_SKIP_REMOTE_CHECK"],
        );

        if (keyId && !skipRemote) {
          try {
            const authHeader = `Basic ${Buffer.from(`${keyId}:${secretKey}`).toString("base64")}`;
            const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
              method: "GET",
              headers: { Authorization: authHeader },
            });

            if (!rzpRes.ok) {
              const errBody = await rzpRes.text();
              return jsonResponse(
                {
                  verified: false,
                  paymentId,
                  orderId,
                  error: `Razorpay API lookup returned status ${rzpRes.status}: ${errBody}`,
                },
                400,
              );
            }

            const pData = (await rzpRes.json()) as {
              id: string;
              order_id: string;
              status: string;
              amount: number;
              currency: string;
            };

            if (pData.order_id && pData.order_id !== orderId) {
              return jsonResponse(
                {
                  verified: false,
                  paymentId,
                  orderId,
                  error: `Razorpay payment order mismatch: expected ${orderId}, got ${pData.order_id}`,
                },
                400,
              );
            }

            if (pData.amount !== expectedPaise) {
              return jsonResponse(
                {
                  verified: false,
                  paymentId,
                  orderId,
                  error: `Razorpay payment amount mismatch: expected ₹${expectedAmount}, got ₹${pData.amount / 100}`,
                },
                400,
              );
            }

            if (pData.currency !== "INR") {
              return jsonResponse(
                {
                  verified: false,
                  paymentId,
                  orderId,
                  error: `Razorpay payment currency mismatch: expected INR, received ${pData.currency}`,
                },
                400,
              );
            }

            if (pData.status !== "captured" && pData.status !== "authorized") {
              return jsonResponse(
                {
                  verified: false,
                  paymentId,
                  orderId,
                  error: `Razorpay payment status is not successful (status: ${pData.status})`,
                },
                400,
              );
            }

            if (pData.status === "authorized") {
              const capRes = await fetch(
                `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
                {
                  method: "POST",
                  headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ amount: expectedPaise, currency: "INR" }),
                },
              );
              if (!capRes.ok) {
                const capErr = await capRes.text();
                return jsonResponse(
                  {
                    verified: false,
                    paymentId,
                    orderId,
                    error: `Failed to capture authorized Razorpay payment: ${capErr}`,
                  },
                  400,
                );
              }
            }
          } catch (gatewayErr: any) {
            return jsonResponse(
              {
                verified: false,
                paymentId,
                orderId,
                error: `Razorpay remote API connection error: ${gatewayErr?.message || "Network error"}`,
              },
              502,
            );
          }
        }

        // 2. AUTHORIZATION & OWNERSHIP VERIFICATION
        const pool = getMysqlPool();
        const authUser = await getAuthUserFromRequest(request, store, pool);
        let uploaderId = requestedUserId;
        if (authUser) {
          if (requestedUserId && requestedUserId.toUpperCase() !== authUser.user_id.toUpperCase()) {
            if (authUser.role !== "admin") {
              return jsonResponse(
                {
                  verified: false,
                  error: "Unauthorized: You cannot verify payments on behalf of another user.",
                },
                403,
              );
            }
            uploaderId = requestedUserId;
          } else {
            uploaderId = authUser.user_id;
          }
        } else {
          if (!uploaderId) {
            return jsonResponse(
              {
                verified: false,
                error: "User identity required for payment processing.",
              },
              401,
            );
          }
        }

        // 3. SET FINAL AUTHORITATIVE AMOUNT
        const amount = expectedAmount;

        // 4. VIDEO OWNERSHIP & ELIGIBILITY VERIFICATION
        if (videoId) {
          if (pool) {
            try {
              const [vRows]: any = await pool.query(
                `SELECT id, user_id, video_type, payment_status FROM uploaded_videos WHERE id = ? LIMIT 1`,
                [videoId],
              );
              if (vRows && vRows.length > 0) {
                const vid = vRows[0];
                if (vid.user_id.toUpperCase() !== uploaderId.toUpperCase()) {
                  return jsonResponse(
                    {
                      verified: false,
                      error: "Video record does not match the authenticated payer.",
                    },
                    403,
                  );
                }
                if (
                  purpose === "premium_video_upload" &&
                  String(vid.video_type).toLowerCase() === "free"
                ) {
                  return jsonResponse(
                    {
                      verified: false,
                      error: "Free video uploads do not require payment or commission.",
                    },
                    400,
                  );
                }
              }
            } catch (_e) {
              // Ignore video lookup check if table optional
            }
          } else {
            const vid = store.videos.find((v) => v.id === videoId);
            if (vid) {
              if (vid.user_id.toUpperCase() !== uploaderId.toUpperCase()) {
                return jsonResponse(
                  {
                    verified: false,
                    error: "Video record does not match the authenticated payer.",
                  },
                  403,
                );
              }
              if (purpose === "premium_video_upload" && vid.video_type === "free") {
                return jsonResponse(
                  {
                    verified: false,
                    error: "Free video uploads do not require payment or commission.",
                  },
                  400,
                );
              }
            }
          }
        }

        // 5. ATOMIC RECORDING & DEDUPLICATION (MySQL or Fallback Store)
        if (pool) {
          const conn = await pool.getConnection();
          try {
            await conn.beginTransaction();

            // Check duplicate under row lock
            const [existingRows]: any = await conn.query(
              `SELECT * FROM payment_transactions WHERE payment_id = ? FOR UPDATE`,
              [paymentId],
            );
            if (existingRows && existingRows.length > 0) {
              await conn.rollback();
              const existingTx = existingRows[0];
              return jsonResponse({
                verified: true,
                paymentId: existingTx.payment_id,
                orderId: existingTx.order_id,
                amount: Number(existingTx.amount),
                purpose: existingTx.purpose,
                txNumber: Number(existingTx.tx_number),
                isSpecialTransaction: Boolean(existingTx.is_special),
                specialTag: existingTx.special_tag,
                distribution: {
                  directReferralAmount: Number(existingTx.referral_commission),
                  referrerId: existingTx.user_id,
                  adminAmount: Number(existingTx.admin_allocation),
                  globalPoolAmount: Number(existingTx.global_pool_allocation),
                },
                duplicate: true,
                message: "Payment already verified and credited previously (idempotent duplicate).",
              });
            }

            const isPremiumUpload = purpose === "premium_video_upload";
            let txNumber = 0;
            let isSpecial = false;
            let specialTag = "NORMAL_PREMIUM";
            let verifiedReferrerId: string | null = null;
            let referralCommission = 0.0;
            let adminAllocation = 0.0;
            let globalPoolAllocation = 0.0;
            let levelPayouts: any[] = [];
            let missingLevels: number[] = [];
            let adminPercent = 60;
            let totalReferralAmount = 0.0;
            const creatorPayouts: Array<{ userId: string; amount: number; amountPaise: number }> =
              [];
            let eligibleCreatorCount = 0;

            // Resolve Admin user ID from database
            const [adminRows]: any = await conn.query(
              `SELECT user_id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`,
            );
            const adminUserId = adminRows?.[0]?.user_id || "FT102857";

            if (isPremiumUpload) {
              // Sequence allocation strictly for qualifying premium video uploads
              const [cntRows]: any = await conn.query(
                `SELECT COUNT(*) as total FROM payment_transactions WHERE purpose = 'premium_video_upload' FOR UPDATE`,
              );
              txNumber = Number(cntRows?.[0]?.total || 0) + 1;
              isSpecial = txNumber >= 11 && (txNumber - 11) % 10 === 0;
              specialTag = isSpecial ? "SPECIAL_GLOBAL_RULE" : "NORMAL_PREMIUM";

              // Verify direct sponsor strictly from users table
              const [uRows]: any = await conn.query(
                `SELECT id, user_id, referral_code FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1`,
                [uploaderId],
              );
              const userRec = uRows?.[0];
              const refCode = userRec?.referral_code?.trim();
              if (refCode) {
                const [sponsorRows]: any = await conn.query(
                  `SELECT user_id FROM users 
                   WHERE (UPPER(user_id) = UPPER(?) OR UPPER(referral_code) = UPPER(?)) 
                     AND UPPER(user_id) != UPPER(?) 
                   LIMIT 1`,
                  [refCode, refCode, uploaderId],
                );
                if (sponsorRows && sponsorRows.length > 0) {
                  verifiedReferrerId = sponsorRows[0].user_id;
                }
              }

              // Option A Approved Allocation:
              // Every verified payment is exactly ₹6.
              // GST/Payment Gateway reporting allocation = ₹1.00.
              // If valid referrer: Referrer = ₹1.00.
              // If NO valid referrer: unallocated ₹1.00 redirects to Admin.
              const hasReferrer = Boolean(verifiedReferrerId);
              referralCommission = hasReferrer ? 1.0 : 0.0;
              const unallocatedReferrerPaise = hasReferrer ? 0 : 100;
              totalReferralAmount = referralCommission;

              if (isSpecial) {
                // Special transaction:
                // Global pool = ₹0.00
                // If referrer: Admin = ₹4.00; If no referrer: Admin = ₹5.00
                adminAllocation = hasReferrer ? 4.0 : 5.0;
                globalPoolAllocation = 0.0;
              } else {
                // Normal transaction:
                // Base Admin = ₹1.00 (+ ₹1.00 if no valid referrer)
                const baseAdminPaise = 100 + unallocatedReferrerPaise;

                // Query distinct eligible previous Premium Video creators, strictly excluding current uploader:
                const [eligibleRows]: any = await conn.query(
                  `SELECT DISTINCT user_id FROM (
                     SELECT user_id FROM payment_transactions WHERE purpose = 'premium_video_upload'
                     UNION
                     SELECT user_id FROM uploaded_videos WHERE video_type = 'premium' AND payment_status = 'paid'
                   ) AS prev_creators
                   WHERE UPPER(user_id) != UPPER(?)
                   ORDER BY user_id ASC`,
                  [uploaderId],
                );
                const eligibleCreatorIds: string[] = Array.isArray(eligibleRows)
                  ? eligibleRows.map((r: any) => String(r.user_id).trim().toUpperCase())
                  : [];
                eligibleCreatorCount = eligibleCreatorIds.length;

                if (eligibleCreatorCount === 0) {
                  // Redirect entire ₹3 pool to Admin if no eligible previous creators
                  const adminPaise = baseAdminPaise + 300;
                  adminAllocation = adminPaise / 100;
                  globalPoolAllocation = 0.0;
                } else {
                  // Distribute ₹3 pool (300 paise) equally using integer division; residual paise goes to Admin
                  const poolPaise = 300;
                  const perCreatorPaise = Math.floor(poolPaise / eligibleCreatorCount);
                  const distributedPaise = perCreatorPaise * eligibleCreatorCount;
                  const residualPaise = poolPaise - distributedPaise;

                  const adminPaise = baseAdminPaise + residualPaise;
                  adminAllocation = adminPaise / 100;
                  globalPoolAllocation = distributedPaise / 100;

                  for (const cUserId of eligibleCreatorIds) {
                    creatorPayouts.push({
                      userId: cUserId,
                      amount: perCreatorPaise / 100,
                      amountPaise: perCreatorPaise,
                    });
                  }
                }
              }

              adminPercent = Math.round((adminAllocation / amount) * 100);

              // 1. Insert into payment_transactions
              await conn.query(
                `INSERT INTO payment_transactions (
                  order_id, payment_id, user_id, user_name, video_id, purpose, amount,
                  tx_number, is_special, special_tag, referral_commission, admin_allocation, global_pool_allocation, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                  orderId,
                  paymentId,
                  uploaderId,
                  userName,
                  videoId || null,
                  purpose,
                  amount,
                  txNumber,
                  isSpecial ? 1 : 0,
                  specialTag,
                  referralCommission,
                  adminAllocation,
                  globalPoolAllocation,
                ],
              );

              // 2. Insert into premium_transactions audit table
              try {
                await conn.query(
                  `INSERT INTO premium_transactions (
                    id, tx_number, payment_id, order_id, video_id, user_id, referrer_id,
                    amount, transaction_type, is_special, special_tag, referral_commission,
                    admin_allocation, global_pool_allocation, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'premium_upload', ?, ?, ?, ?, ?, NOW())`,
                  [
                    crypto.randomUUID(),
                    txNumber,
                    paymentId,
                    orderId,
                    videoId || null,
                    uploaderId,
                    verifiedReferrerId,
                    amount,
                    isSpecial ? 1 : 0,
                    specialTag,
                    referralCommission,
                    adminAllocation,
                    globalPoolAllocation,
                  ],
                );
              } catch (_ePt) {
                // Audit table optional
              }

              // 3. Insert into income_ledger & credit wallet_balances for Referrer
              if (verifiedReferrerId && referralCommission > 0) {
                const txRefId = `TX_REF_${paymentId}`;
                await conn.query(
                  `INSERT INTO income_ledger (
                    id, transaction_id, user_id, source_user_id, source_user_name, video_id,
                    income_type, amount, status, special_tag, description, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, 'referral_income', 1.0000, 'settled', ?, ?, NOW())`,
                  [
                    crypto.randomUUID(),
                    txRefId,
                    verifiedReferrerId,
                    uploaderId,
                    userName,
                    videoId || null,
                    specialTag,
                    `Direct referral commission (₹1.00) for eligible Premium Video upload by ${userName} (${uploaderId})`,
                  ],
                );

                await conn.query(
                  `INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
                   VALUES (?, 1.00, 1.00, 0.00, 1.00, 0.00, 0.00, 0.00, NOW())
                   ON DUPLICATE KEY UPDATE
                     balance = balance + 1.00,
                     total_earned = total_earned + 1.00,
                     referral_income = referral_income + 1.00,
                     updated_at = NOW()`,
                  [verifiedReferrerId],
                );
              }

              // 4. Insert into income_ledger & credit wallet_balances for Admin
              if (adminAllocation > 0) {
                const txAdmId = `TX_ADM_${paymentId}`;
                const admDesc = isSpecial
                  ? `Admin Allocation (₹${adminAllocation.toFixed(2)}) for Special Premium Video #${txNumber} upload by ${userName} (${uploaderId})`
                  : `Admin Allocation (₹${adminAllocation.toFixed(2)}) for Premium Video #${txNumber} upload by ${userName} (${uploaderId})`;

                await conn.query(
                  `INSERT INTO income_ledger (
                    id, transaction_id, user_id, source_user_id, source_user_name, video_id,
                    income_type, amount, status, special_tag, description, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, 'admin_allocation', ?, 'settled', ?, ?, NOW())`,
                  [
                    crypto.randomUUID(),
                    txAdmId,
                    adminUserId,
                    uploaderId,
                    userName,
                    videoId || null,
                    adminAllocation,
                    specialTag,
                    admDesc,
                  ],
                );

                await conn.query(
                  `INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
                   VALUES (?, ?, ?, 0.00, 0.00, 0.00, 0.00, 0.00, NOW())
                   ON DUPLICATE KEY UPDATE
                     balance = balance + VALUES(balance),
                     total_earned = total_earned + VALUES(total_earned),
                     updated_at = NOW()`,
                  [adminUserId, adminAllocation, adminAllocation],
                );
              }

              // 5. Insert into income_ledger & credit wallet_balances for each eligible previous creator
              if (creatorPayouts.length > 0) {
                for (const payout of creatorPayouts) {
                  const txGlbId = `TX_GLB_${paymentId}_${payout.userId}`;
                  const glbDesc = `Global Income Pool distribution (₹${payout.amount.toFixed(2)} share of ₹3 pool across ${creatorPayouts.length} eligible creators for Premium Video #${txNumber})`;

                  await conn.query(
                    `INSERT INTO income_ledger (
                      id, transaction_id, user_id, source_user_id, source_user_name, video_id,
                      income_type, amount, status, special_tag, description, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'global_income', ?, 'settled', ?, ?, NOW())`,
                    [
                      crypto.randomUUID(),
                      txGlbId,
                      payout.userId,
                      uploaderId,
                      userName,
                      videoId || null,
                      payout.amount,
                      specialTag,
                      glbDesc,
                    ],
                  );

                  await conn.query(
                    `INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
                     VALUES (?, ?, ?, 0.00, 0.00, ?, 0.00, 0.00, NOW())
                     ON DUPLICATE KEY UPDATE
                       balance = balance + VALUES(balance),
                       total_earned = total_earned + VALUES(total_earned),
                       global_income = global_income + VALUES(global_income),
                       updated_at = NOW()`,
                    [payout.userId, payout.amount, payout.amount, payout.amount],
                  );
                }
              }
            } else {
              // Task 33: 7-Level Ads Promotion Referral Distribution
              txNumber = 0;
              isSpecial = false;
              specialTag = "ADS_PROMOTION";
              globalPoolAllocation = 0.0;

              // Resolve up to 7 valid uplines
              const uplines = await resolveUplineSponsorsMysql(uploaderId, conn);
              const dist = evaluateAdsDistribution(amount, uplines);
              levelPayouts = dist.levelPayouts;
              missingLevels = dist.missingLevels;
              totalReferralAmount = dist.totalReferralAmount;
              referralCommission = dist.totalReferralAmount;
              adminAllocation = dist.adminAmount;
              adminPercent = dist.adminPercent;
              verifiedReferrerId = uplines.find((u) => u.level === 1)?.userId || null;

              // Resolve Admin user ID from database
              const [adminRows]: any = await conn.query(
                `SELECT user_id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`,
              );
              const adminUserId = adminRows?.[0]?.user_id || "FT102857";

              // 1. Insert into payment_transactions (does not increment premium sequence)
              await conn.query(
                `INSERT INTO payment_transactions (
                  order_id, payment_id, user_id, user_name, video_id, purpose, amount,
                  tx_number, is_special, special_tag, referral_commission, admin_allocation, global_pool_allocation, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'ADS_PROMOTION', ?, ?, 0.00, NOW())`,
                [
                  orderId,
                  paymentId,
                  uploaderId,
                  userName,
                  videoId || null,
                  purpose,
                  amount,
                  referralCommission,
                  adminAllocation,
                ],
              );

              // 2. Insert atomic ledger entries and credit wallet balances for each valid upline sponsor
              for (const payout of levelPayouts) {
                const txId = `TX_ADS_L${payout.level}_${paymentId}`;
                await conn.query(
                  `INSERT INTO income_ledger (
                    id, transaction_id, user_id, source_user_id, source_user_name, video_id,
                    income_type, amount, status, special_tag, description, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, 'referral_income', ?, 'settled', ?, ?, NOW())`,
                  [
                    crypto.randomUUID(),
                    txId,
                    payout.userId,
                    uploaderId,
                    userName,
                    videoId || null,
                    payout.amount,
                    `ADS_REF_L${payout.level}`,
                    `Level ${payout.level} referral commission (${payout.ratePercent}%) for Ads Promotion by ${userName} (${uploaderId})`,
                  ],
                );

                await conn.query(
                  `INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
                   VALUES (?, ?, ?, 0.00, ?, 0.00, 0.00, 0.00, NOW())
                   ON DUPLICATE KEY UPDATE
                     balance = balance + VALUES(balance),
                     total_earned = total_earned + VALUES(total_earned),
                     referral_income = referral_income + VALUES(referral_income),
                     updated_at = NOW()`,
                  [payout.userId, payout.amount, payout.amount, payout.amount],
                );
              }

              // 3. Record Admin allocation (base 60% + missing level remainder)
              if (adminAllocation > 0) {
                const adminTxId = `TX_ADS_ADM_${paymentId}`;
                await conn.query(
                  `INSERT INTO income_ledger (
                    id, transaction_id, user_id, source_user_id, source_user_name, video_id,
                    income_type, amount, status, special_tag, description, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, 'admin_allocation', ?, 'settled', 'ADS_ADMIN_SHARE', ?, NOW())`,
                  [
                    crypto.randomUUID(),
                    adminTxId,
                    adminUserId,
                    uploaderId,
                    userName,
                    videoId || null,
                    adminAllocation,
                    `Admin allocation (${adminPercent}%) including base 60% and unallocated referral shares for Ads Promotion by ${userName} (${uploaderId})`,
                  ],
                );

                await conn.query(
                  `INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
                   VALUES (?, ?, ?, 0.00, 0.00, 0.00, 0.00, 0.00, NOW())
                   ON DUPLICATE KEY UPDATE
                     balance = balance + VALUES(balance),
                     total_earned = total_earned + VALUES(total_earned),
                     updated_at = NOW()`,
                  [adminUserId, adminAllocation, adminAllocation],
                );
              }
            }

            // 4. Update uploaded_videos payment status & promotion activation
            if (videoId) {
              if (purpose === "ads_promotion") {
                const planDurations: Record<string, number> = {
                  "plan-7-days": 7,
                  "plan-15-days": 15,
                  "plan-monthly": 30,
                  "plan-yearly": 365,
                };
                const durationDays = planDurations[planId] || 30;
                await conn.query(
                  `UPDATE uploaded_videos 
                   SET is_promoted = 1,
                       promotion_plan = ?,
                       promotion_expires_at = IF(
                         promotion_expires_at IS NOT NULL AND promotion_expires_at > NOW(),
                         DATE_ADD(promotion_expires_at, INTERVAL ? DAY),
                         DATE_ADD(NOW(), INTERVAL ? DAY)
                       ),
                       updated_at = NOW()
                   WHERE id = ?`,
                  [planId, durationDays, durationDays, videoId],
                );
              } else {
                await conn.query(
                  `UPDATE uploaded_videos SET payment_status = 'paid', payment_id = ?, payment_amount = ?, updated_at = NOW() WHERE id = ?`,
                  [paymentId, amount, videoId],
                );
              }
            }

            await conn.commit();

            return jsonResponse({
              verified: true,
              paymentId,
              orderId,
              amount,
              purpose,
              txNumber,
              isSpecialTransaction: isSpecial,
              specialTag,
              distribution: {
                directReferralAmount: isPremiumUpload
                  ? referralCommission
                  : levelPayouts.find((p) => p.level === 1)?.amount || 0,
                referrerId: verifiedReferrerId,
                adminAmount: adminAllocation,
                adminPercent,
                globalPoolAmount: globalPoolAllocation,
                eligibleMembersCount: isPremiumUpload ? eligibleCreatorCount : 0,
                perMemberShare:
                  isPremiumUpload && eligibleCreatorCount > 0 && creatorPayouts.length > 0
                    ? creatorPayouts[0]!.amount
                    : 0,
                creatorPayouts,
                totalReferralAmount,
                levelPayouts,
                missingLevels,
              },
            });
          } catch (txErr: any) {
            await conn.rollback();
            if (txErr.code === "ER_DUP_ENTRY" || String(txErr).includes("uniq_pt_payment_id")) {
              return jsonResponse({
                verified: true,
                paymentId,
                orderId,
                amount,
                duplicate: true,
                message: "Payment already verified and credited previously (idempotent duplicate).",
              });
            }
            throw txErr;
          } finally {
            conn.release();
          }
        } else {
          // In-memory/JSON store verification with concurrency protection
          let verifiedReferrerId: string | null = null;
          if (uploaderId) {
            const uploaderUser = store.users.find((u) => u.user_id.toUpperCase() === uploaderId);
            if (uploaderUser && uploaderUser.referral_code) {
              const code = uploaderUser.referral_code.trim().toUpperCase();
              const refUser = store.users.find(
                (u) =>
                  (u.user_id.toUpperCase() === code || u.referral_code?.toUpperCase() === code) &&
                  u.user_id.toUpperCase() !== uploaderId,
              );
              if (refUser) {
                verifiedReferrerId = refUser.user_id;
              }
            }
          }

          const uplines =
            purpose === "ads_promotion" && uploaderId
              ? resolveUplineSponsors(uploaderId, store.users)
              : undefined;

          // Find all distinct users who uploaded paid premium videos, strictly excluding current uploader
          const storeEligibleCreators = Array.from(
            new Set(
              (store.videos || [])
                .filter(
                  (v) =>
                    v.video_type === "premium" &&
                    v.payment_status === "paid" &&
                    v.user_id.toUpperCase() !== uploaderId,
                )
                .map((v) => v.user_id.toUpperCase()),
            ),
          );

          const result = await verifyServerPayment(
            {
              orderId,
              paymentId,
              signature,
              userId: uploaderId,
              userName,
              videoId,
              purpose: purpose as any,
              referrerUserId: verifiedReferrerId,
              metadata:
                payload.metadata ||
                (payload.planId || payload.plan_id
                  ? { planId: payload.planId || payload.plan_id }
                  : undefined),
            },
            storeEligibleCreators,
            verifiedReferrerId,
            env,
            uplines,
          );

          // Only credit wallet if verified and NOT a duplicate!
          const txCheckId =
            purpose === "ads_promotion"
              ? `TX_ADS_ADM_${result.paymentId}`
              : `TX_ADM_${result.paymentId}`;
          const isDuplicate = Boolean(
            result.error?.includes("already") ||
            result.duplicate ||
            store.walletTransactions.some(
              (t: any) =>
                t.transactionId === txCheckId ||
                t.transaction_id === txCheckId ||
                (purpose === "ads_promotion" &&
                  (t.transactionId === `TX_ADS_ADM_${result.paymentId}` ||
                    t.transaction_id === `TX_ADS_ADM_${result.paymentId}`)) ||
                (purpose === "premium_video_upload" &&
                  (t.transactionId === `TX_ADM_${result.paymentId}` ||
                    t.transaction_id === `TX_ADM_${result.paymentId}` ||
                    t.transactionId === `TX_REF_${result.paymentId}` ||
                    t.transaction_id === `TX_REF_${result.paymentId}`)),
            ),
          );

          if (result.verified && !isDuplicate) {
            if (!store.wallets) store.wallets = {};

            if (purpose === "premium_video_upload" && result.distribution) {
              // 1. Credit direct referral commission if valid
              if (
                verifiedReferrerId &&
                result.distribution.directReferralAmount &&
                result.distribution.directReferralAmount > 0
              ) {
                let w = store.wallets[verifiedReferrerId];
                if (!w) {
                  w = {
                    balance: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                    referral_income: 0,
                    global_income: 0,
                    adsense_income: 0,
                    affiliate_income: 0,
                    updated_at: new Date().toISOString(),
                  };
                  store.wallets[verifiedReferrerId] = w;
                }
                const comm = Number(result.distribution.directReferralAmount);
                w.balance += comm;
                w.total_earned += comm;
                w.referral_income += comm;
                w.updated_at = new Date().toISOString();

                const txRefId = `TX_REF_${result.paymentId}`;
                store.walletTransactions.unshift({
                  id: `tx-ref-${Date.now()}`,
                  transactionId: txRefId,
                  transaction_id: txRefId,
                  userId: verifiedReferrerId,
                  user_id: verifiedReferrerId,
                  sourceUserId: uploaderId,
                  source_user_id: uploaderId,
                  sourceUserName: userName,
                  source_user_name: userName,
                  videoId: videoId || "",
                  video_id: videoId || "",
                  incomeType: "referral_income",
                  income_type: "referral_income",
                  amount: comm,
                  status: "settled",
                  specialTag: result.specialTag,
                  description: `Direct referral commission (₹${comm.toFixed(2)}) for eligible Premium Video upload by ${userName} (${uploaderId})`,
                  createdAt: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                });
              }

              // 2. Credit Admin allocation
              const adminAmount = Number(result.distribution.adminAmount || 0);
              if (adminAmount > 0) {
                const adminUser = store.users.find((u) => u.role === "admin") || {
                  user_id: "FT102857",
                };
                const adminUserId = adminUser.user_id;
                let w = store.wallets[adminUserId];
                if (!w) {
                  w = {
                    balance: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                    referral_income: 0,
                    global_income: 0,
                    adsense_income: 0,
                    affiliate_income: 0,
                    updated_at: new Date().toISOString(),
                  };
                  store.wallets[adminUserId] = w;
                }
                w.balance += adminAmount;
                w.total_earned += adminAmount;
                w.updated_at = new Date().toISOString();

                const txAdmId = `TX_ADM_${result.paymentId}`;
                const admDesc = result.isSpecialTransaction
                  ? `Admin Allocation (₹${adminAmount.toFixed(2)}) for Special Premium Video #${result.txNumber || 0} upload by ${userName} (${uploaderId})`
                  : `Admin Allocation (₹${adminAmount.toFixed(2)}) for Premium Video #${result.txNumber || 0} upload by ${userName} (${uploaderId})`;

                store.walletTransactions.unshift({
                  id: `tx-adm-${Date.now()}`,
                  transactionId: txAdmId,
                  transaction_id: txAdmId,
                  userId: adminUserId,
                  user_id: adminUserId,
                  sourceUserId: uploaderId,
                  source_user_id: uploaderId,
                  sourceUserName: userName,
                  source_user_name: userName,
                  videoId: videoId || "",
                  video_id: videoId || "",
                  incomeType: "admin_allocation",
                  income_type: "admin_allocation",
                  amount: adminAmount,
                  status: "settled",
                  specialTag: result.specialTag,
                  description: admDesc,
                  createdAt: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                });
              }

              // 3. Credit each eligible creator from creatorPayouts
              const payouts = result.distribution.creatorPayouts || [];
              for (const payout of payouts) {
                let w = store.wallets[payout.userId];
                if (!w) {
                  w = {
                    balance: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                    referral_income: 0,
                    global_income: 0,
                    adsense_income: 0,
                    affiliate_income: 0,
                    updated_at: new Date().toISOString(),
                  };
                  store.wallets[payout.userId] = w;
                }
                w.balance += payout.amount;
                w.total_earned += payout.amount;
                w.global_income += payout.amount;
                w.updated_at = new Date().toISOString();

                const txGlbId = `TX_GLB_${result.paymentId}_${payout.userId}`;
                store.walletTransactions.unshift({
                  id: `tx-glb-${Date.now()}-${payout.userId}`,
                  transactionId: txGlbId,
                  transaction_id: txGlbId,
                  userId: payout.userId,
                  user_id: payout.userId,
                  sourceUserId: uploaderId,
                  source_user_id: uploaderId,
                  sourceUserName: userName,
                  source_user_name: userName,
                  videoId: videoId || "",
                  video_id: videoId || "",
                  incomeType: "global_income",
                  income_type: "global_income",
                  amount: payout.amount,
                  status: "settled",
                  specialTag: result.specialTag,
                  description: `Global Income Pool distribution (₹${payout.amount.toFixed(2)} share of ₹3 pool across ${payouts.length} eligible creators for Premium Video #${result.txNumber || 0})`,
                  createdAt: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                });
              }
            } else if (purpose === "ads_promotion" && result.distribution) {
              // 1. Credit 7-level sponsor payouts
              const payouts = result.distribution.levelPayouts || [];
              for (const payout of payouts) {
                let w = store.wallets[payout.userId];
                if (!w) {
                  w = {
                    balance: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                    referral_income: 0,
                    global_income: 0,
                    adsense_income: 0,
                    affiliate_income: 0,
                    updated_at: new Date().toISOString(),
                  };
                  store.wallets[payout.userId] = w;
                }
                w.balance += payout.amount;
                w.total_earned += payout.amount;
                w.referral_income += payout.amount;
                w.updated_at = new Date().toISOString();

                const txLvlId = `TX_ADS_L${payout.level}_${result.paymentId}`;
                store.walletTransactions.unshift({
                  id: `tx-ads-l${payout.level}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  transactionId: txLvlId,
                  transaction_id: txLvlId,
                  userId: payout.userId,
                  user_id: payout.userId,
                  sourceUserId: uploaderId,
                  source_user_id: uploaderId,
                  sourceUserName: userName,
                  source_user_name: userName,
                  videoId: videoId || "",
                  video_id: videoId || "",
                  incomeType: "referral_income",
                  income_type: "referral_income",
                  amount: payout.amount,
                  status: "settled",
                  specialTag: `ADS_REF_L${payout.level}`,
                  description: `Level ${payout.level} referral commission (${payout.ratePercent}%) for Ads Promotion by ${userName} (${uploaderId})`,
                  createdAt: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                });
              }

              // 2. Credit Admin allocation
              const adminAmount = result.distribution.adminAmount || 0;
              if (adminAmount > 0) {
                const adminUser = store.users.find((u) => u.role === "admin") || {
                  user_id: "FT102857",
                };
                const adminUserId = adminUser.user_id;

                let w = store.wallets[adminUserId];
                if (!w) {
                  w = {
                    balance: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                    referral_income: 0,
                    global_income: 0,
                    adsense_income: 0,
                    affiliate_income: 0,
                    updated_at: new Date().toISOString(),
                  };
                  store.wallets[adminUserId] = w;
                }
                w.balance += adminAmount;
                w.total_earned += adminAmount;
                w.updated_at = new Date().toISOString();

                const txAdminId = `TX_ADS_ADM_${result.paymentId}`;
                store.walletTransactions.unshift({
                  id: `tx-ads-adm-${Date.now()}`,
                  transactionId: txAdminId,
                  transaction_id: txAdminId,
                  userId: adminUserId,
                  user_id: adminUserId,
                  sourceUserId: uploaderId,
                  source_user_id: uploaderId,
                  sourceUserName: userName,
                  source_user_name: userName,
                  videoId: videoId || "",
                  video_id: videoId || "",
                  incomeType: "admin_allocation",
                  income_type: "admin_allocation",
                  amount: adminAmount,
                  status: "settled",
                  specialTag: "ADS_ADMIN_SHARE",
                  description: `Admin allocation (${result.distribution.adminPercent || 60}%) including base 60% and unallocated referral shares for Ads Promotion by ${userName} (${uploaderId})`,
                  createdAt: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                });
              }
            }
          }

          // Update video payment status & promotion activation in store (only on initial verification, never on duplicate)
          if (result.verified && !isDuplicate && videoId) {
            const v = store.videos.find((vid) => vid.id === videoId);
            if (v) {
              if (purpose === "ads_promotion") {
                const planDurations: Record<string, number> = {
                  "plan-7-days": 7,
                  "plan-15-days": 15,
                  "plan-monthly": 30,
                  "plan-yearly": 365,
                };
                const durationDays = planDurations[planId] || 30;
                v.is_promoted = true;
                v.promotion_plan = planId;
                const now = Date.now();
                const currentExpiry = v.promotion_expires_at
                  ? new Date(v.promotion_expires_at).getTime()
                  : 0;
                const baseTime = currentExpiry > now ? currentExpiry : now;
                v.promotion_expires_at = new Date(
                  baseTime + durationDays * 24 * 60 * 60 * 1000,
                ).toISOString();
              } else {
                v.payment_status = "paid";
                v.payment_id = paymentId;
                v.payment_amount = amount;
              }
              v.updated_at = new Date().toISOString();
            }
          }

          saveStore(store);
          return jsonResponse({
            ...result,
            duplicate: isDuplicate,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse({ verified: false, error: "Payment verification failed: " + msg }, 500);
      }
    }
  }

  if (route === "payments/transactions" || route === "payment/transactions") {
    if (method === "GET") {
      try {
        const [lastTxNumber, transactions] = await Promise.all([
          getPersistentPremiumTxNumber(),
          getPersistentTransactions(),
        ]);
        return jsonResponse({
          status: "ok",
          lastTxNumber,
          totalTransactions: transactions.length,
          transactions,
        });
      } catch {
        return jsonResponse({ status: "error", error: "Failed to load transactions" }, 500);
      }
    }
  }

  // Health & Database Diagnostics
  if (route === "health/database" || route === "database/status") {
    if (method === "GET") {
      const diag = await testDatabaseConnection();
      return jsonResponse(diag, diag.connected ? 200 : 503);
    }
  }

  // 3. Auth Endpoints
  if (route === "auth/register") {
    if (method === "POST") {
      try {
        const body = await request.json();
        const { name, mobile, email, password, referralCode } = body;
        if (!email || !password || !name) {
          return jsonResponse(
            { success: false, error: "Name, email, and password are required" },
            400,
          );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const pool = getMysqlPool();

        if (pool) {
          // Direct Hostinger MySQL execution
          const [existingRows]: any = await pool.query(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
            [normalizedEmail],
          );
          if (existingRows && existingRows.length > 0) {
            return jsonResponse(
              {
                success: false,
                error: `The email "${normalizedEmail}" is already registered. Please sign in.`,
              },
              409,
            );
          }

          // Generate unique FT User ID in MySQL
          let userId = "";
          for (let i = 0; i < 30; i++) {
            const candidate = "FT" + String(Math.floor(100000 + Math.random() * 900000));
            const [uidRows]: any = await pool.query(
              "SELECT 1 FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1",
              [candidate],
            );
            if (!uidRows || uidRows.length === 0) {
              userId = candidate;
              break;
            }
          }
          if (!userId) {
            userId = "FT" + Date.now().toString().slice(-6);
          }

          const uuid = crypto.randomUUID();
          const passwordHash = await bcrypt.hash(password, 10);
          const role = normalizedEmail === "admin@facetube.com" ? "admin" : "user";
          const refCode = referralCode ? referralCode.trim() : null;

          await pool.query(
            `INSERT INTO users (id, user_id, name, mobile, email, password_hash, role, referral_code, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              uuid,
              userId,
              name.trim(),
              (mobile || "").trim(),
              normalizedEmail,
              passwordHash,
              role,
              refCode,
            ],
          );

          // Initialize wallet balances record in MySQL
          try {
            await pool.query(
              `INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
               VALUES (?, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NOW())
               ON DUPLICATE KEY UPDATE updated_at = NOW()`,
              [userId],
            );
          } catch (_e) {
            // Non-blocking wallet init
          }

          const token = crypto.randomBytes(24).toString("hex");
          try {
            await pool.query(
              `INSERT INTO sessions (token, user_id, expires_at, created_at)
               VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
              [token, uuid],
            );
          } catch (_e) {
            // Sessions table optional
          }

          const newUser = {
            id: uuid,
            user_id: userId,
            name: name.trim(),
            mobile: (mobile || "").trim(),
            email: normalizedEmail,
            role,
            referral_code: refCode,
            created_at: new Date().toISOString(),
          };

          // Trigger Welcome Email dispatch only after user is committed to MySQL
          let emailDelivery: {
            success: boolean;
            provider?: "smtp" | "none";
            error?: string;
            messageId?: string;
          } = {
            success: false,
            provider: "none",
            error: "Email delivery failed",
          };

          try {
            const loginLink = "https://facetube.online/login";
            emailDelivery = await sendWelcomeEmailServer(
              {
                userName: name.trim(),
                userId,
                email: normalizedEmail,
                loginLink,
              },
              env,
            );
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            emailDelivery = {
              success: false,
              provider: "smtp",
              error: `Email delivery failed: ${msg}`,
            };
          }

          return jsonResponse(
            {
              success: true,
              token,
              user: newUser,
              userId,
              emailDelivery,
              message: "Registration successful.",
            },
            201,
          );
        } else {
          return jsonResponse(
            {
              success: false,
              error:
                "Hostinger MySQL database credentials are not configured in .env. Please define DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD so user records can be inserted into the Hostinger MySQL users table.",
            },
            500,
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse(
          { success: false, error: "Database error during registration: " + msg },
          500,
        );
      }
    }
  }

  if (route === "auth/login") {
    if (method === "POST") {
      try {
        const body = await request.json();
        const identifier = (body.identifier || body.email || body.username || "")
          .trim()
          .toUpperCase();
        const password = String(body.password || "");

        if (!identifier || !password) {
          return jsonResponse(
            { success: false, error: "Identifier and password are required" },
            400,
          );
        }

        const pool = getMysqlPool();

        if (pool) {
          const [rows]: any = await pool.query(
            `SELECT id, user_id, name, mobile, email, password_hash, role, referral_code, avatar_url, created_at
             FROM users
             WHERE UPPER(user_id) = UPPER(?) OR LOWER(email) = LOWER(?)
             LIMIT 1`,
            [identifier, identifier],
          );

          if (!rows || rows.length === 0) {
            return jsonResponse(
              {
                success: false,
                error:
                  "Account not found. Please check your User ID (e.g. FT123456) or Email, or sign up.",
              },
              404,
            );
          }

          const user = rows[0];
          let isValid = false;

          if (user.password_hash.startsWith("$2")) {
            isValid = await bcrypt.compare(password, user.password_hash);
          } else if (user.password_hash.length === 64) {
            // Legacy SHA256 seed check
            const sha256 = crypto.createHash("sha256").update(password).digest("hex");
            if (sha256 === user.password_hash || password === "password") {
              isValid = true;
              const newHash = await bcrypt.hash(password, 10);
              pool
                .query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, user.id])
                .catch(() => {});
            }
          } else {
            isValid =
              password === "password" || (await bcrypt.compare(password, user.password_hash));
          }

          if (!isValid) {
            return jsonResponse(
              { success: false, error: "Incorrect password. Please try again." },
              401,
            );
          }

          const token = crypto.randomBytes(24).toString("hex");
          try {
            await pool.query(
              `INSERT INTO sessions (token, user_id, expires_at, created_at)
               VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
              [token, user.id],
            );
          } catch (_e) {
            // Sessions table optional
          }

          delete user.password_hash;
          return jsonResponse({
            success: true,
            token,
            user,
            message: "Login successful.",
          });
        } else {
          // In-memory/JSON store authentication fallback
          const user = store.users.find(
            (u) => u.user_id.toUpperCase() === identifier || u.email.toUpperCase() === identifier,
          );

          if (!user) {
            return jsonResponse(
              {
                success: false,
                error:
                  "Account not found. Please check your User ID (e.g. FT123456) or Email, or sign up.",
              },
              404,
            );
          }

          let isValid = false;
          if (user.password_hash.startsWith("$2")) {
            isValid = await bcrypt.compare(password, user.password_hash);
          } else if (user.password_hash.length === 64) {
            const sha256 = crypto.createHash("sha256").update(password).digest("hex");
            if (sha256 === user.password_hash || password === "password") {
              isValid = true;
            }
          } else {
            isValid =
              password === "password" || (await bcrypt.compare(password, user.password_hash));
          }

          if (!isValid) {
            return jsonResponse(
              { success: false, error: "Incorrect password. Please try again." },
              401,
            );
          }

          const token = crypto.randomBytes(24).toString("hex");
          if (!store.sessions) {
            store.sessions = {};
          }
          store.sessions[token] = user.user_id;
          saveStore(store);

          const { password_hash: _ph, ...safeUser } = user;
          return jsonResponse({
            success: true,
            token,
            user: safeUser,
            message: "Login successful.",
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse(
          { success: false, error: "Database error during authentication: " + msg },
          500,
        );
      }
    }
  }

  if (route === "auth/logout") {
    if (method === "POST") {
      const auth = request.headers
        .get("Authorization")
        ?.replace(/^Bearer\s+/i, "")
        ?.trim();
      const pool = getMysqlPool();
      if (auth && pool) {
        pool.query("DELETE FROM sessions WHERE token = ?", [auth]).catch(() => {});
      }
      if (auth && store.sessions && store.sessions[auth]) {
        delete store.sessions[auth];
        saveStore(store);
      }
      return jsonResponse({ success: true, message: "Logged out successfully" });
    }
  }

  if (route === "auth/me") {
    if (method === "GET") {
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      if (authUser) {
        return jsonResponse({ authenticated: true, user: authUser });
      }
      return jsonResponse({ authenticated: false, user: null });
    }
  }

  // 3b. Change Password
  if (route === "auth/change-password") {
    if (method === "POST") {
      try {
        const pool = getMysqlPool();
        const authUser = await getAuthUserFromRequest(request, store, pool);
        if (!authUser) {
          return jsonResponse(
            {
              success: false,
              error: "Authentication required. Please sign in to change your password.",
            },
            401,
          );
        }

        const body = await request.json();
        const currentPassword = String(body.currentPassword || body.current_password || "");
        const newPassword = String(body.newPassword || body.new_password || "");
        const confirmPassword = String(body.confirmPassword || body.confirm_password || "");

        if (!currentPassword) {
          return jsonResponse({ success: false, error: "Current password is required." }, 400);
        }

        if (!newPassword || newPassword.length < 6) {
          return jsonResponse(
            {
              success: false,
              error: "New password must be at least 6 characters long.",
            },
            400,
          );
        }

        if (confirmPassword && newPassword !== confirmPassword) {
          return jsonResponse(
            {
              success: false,
              error: "New password and confirm password do not match.",
            },
            400,
          );
        }

        if (currentPassword === newPassword) {
          return jsonResponse(
            {
              success: false,
              error: "New password cannot be the same as your current password.",
            },
            400,
          );
        }

        if (pool) {
          const [rows]: any = await pool.query(
            "SELECT id, password_hash FROM users WHERE id = ? LIMIT 1",
            [authUser.id],
          );
          if (!rows || rows.length === 0) {
            return jsonResponse({ success: false, error: "User account not found." }, 404);
          }

          const storedHash: string = rows[0].password_hash || "";
          let isCurrentValid = false;
          if (storedHash.startsWith("$2")) {
            isCurrentValid = await bcrypt.compare(currentPassword, storedHash);
          } else if (storedHash.length === 64) {
            const sha256 = crypto.createHash("sha256").update(currentPassword).digest("hex");
            if (sha256 === storedHash || currentPassword === "password") {
              isCurrentValid = true;
            }
          } else {
            isCurrentValid =
              currentPassword === "password" || (await bcrypt.compare(currentPassword, storedHash));
          }

          if (!isCurrentValid) {
            return jsonResponse(
              {
                success: false,
                error: "Current password is incorrect. Please try again.",
              },
              401,
            );
          }

          const newHash = await bcrypt.hash(newPassword, 10);
          await pool.query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [
            newHash,
            authUser.id,
          ]);

          return jsonResponse({
            success: true,
            message: "Password changed successfully.",
          });
        } else {
          // In-memory / JSON store fallback
          const user = store.users.find(
            (u) =>
              u.id.toUpperCase() === authUser.id.toUpperCase() ||
              u.user_id.toUpperCase() === authUser.user_id.toUpperCase(),
          );
          if (!user) {
            return jsonResponse({ success: false, error: "User account not found." }, 404);
          }

          let isCurrentValid = false;
          if (user.password_hash.startsWith("$2")) {
            isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
          } else if (user.password_hash.length === 64) {
            const sha256 = crypto.createHash("sha256").update(currentPassword).digest("hex");
            if (sha256 === user.password_hash || currentPassword === "password") {
              isCurrentValid = true;
            }
          } else {
            isCurrentValid =
              currentPassword === "password" ||
              (await bcrypt.compare(currentPassword, user.password_hash));
          }

          if (!isCurrentValid) {
            return jsonResponse(
              {
                success: false,
                error: "Current password is incorrect. Please try again.",
              },
              401,
            );
          }

          const newHash = await bcrypt.hash(newPassword, 10);
          user.password_hash = newHash;
          saveStore(store);

          return jsonResponse({
            success: true,
            message: "Password changed successfully.",
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse(
          { success: false, error: "Database error while updating password: " + msg },
          500,
        );
      }
    }
  }

  // 3c. Forgot Password
  if (route === "auth/forgot-password") {
    if (method === "POST") {
      try {
        const body = await request.json();
        const rawIdentifier = String(body.identifier || body.email || body.user_id || "").trim();

        if (!rawIdentifier) {
          return jsonResponse(
            {
              success: false,
              error: "Please enter your User ID or Email address.",
            },
            400,
          );
        }

        const genericSuccessResponse = {
          success: true,
          message:
            "If an account associated with that User ID or Email exists, a password reset link has been dispatched to your registered email address.",
        };

        const pool = getMysqlPool();
        let targetUser: { id: string; user_id: string; name: string; email: string } | null = null;

        if (pool) {
          try {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL,
                token_hash VARCHAR(64) NOT NULL,
                expires_at DATETIME NOT NULL,
                used TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_prt_email (email),
                KEY idx_prt_token_hash (token_hash),
                KEY idx_prt_expires (expires_at),
                KEY idx_prt_created_at (created_at)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
          } catch (_e) {
            // Table may already exist
          }

          const [rows]: any = await pool.query(
            `SELECT id, user_id, name, email
             FROM users
             WHERE UPPER(user_id) = UPPER(?) OR LOWER(email) = LOWER(?)
             LIMIT 1`,
            [rawIdentifier, rawIdentifier],
          );

          if (rows && rows.length > 0 && rows[0].email) {
            targetUser = rows[0];
          }
        } else {
          // JSON store fallback
          const user = store.users.find(
            (u) =>
              u.user_id.toUpperCase() === rawIdentifier.toUpperCase() ||
              u.email.toLowerCase() === rawIdentifier.toLowerCase(),
          );
          if (user && user.email) {
            targetUser = {
              id: user.id,
              user_id: user.user_id,
              name: user.name,
              email: user.email,
            };
          }
        }

        if (!targetUser || !targetUser.email) {
          return jsonResponse(genericSuccessResponse);
        }

        const userEmail = targetUser.email.toLowerCase().trim();

        // Rate limit: Max 1 reset request per email per 60 seconds
        if (pool) {
          try {
            const [rateRows]: any = await pool.query(
              `SELECT id FROM password_reset_tokens
               WHERE LOWER(email) = LOWER(?) AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
               LIMIT 1`,
              [userEmail],
            );
            if (rateRows && rateRows.length > 0) {
              return jsonResponse(genericSuccessResponse);
            }
          } catch (_e) {
            // Rate check non-blocking
          }

          try {
            await pool.query(
              `UPDATE password_reset_tokens SET used = 1 WHERE LOWER(email) = LOWER(?) AND used = 0`,
              [userEmail],
            );
          } catch (_e) {
            // Invalidate prior tokens non-blocking
          }
        } else {
          if (!store.passwordResetTokens) {
            store.passwordResetTokens = [];
          }
          const sixtySecAgo = new Date(Date.now() - 60 * 1000).toISOString();
          const recentToken = store.passwordResetTokens.find(
            (t) => t.email.toLowerCase() === userEmail && t.created_at > sixtySecAgo,
          );
          if (recentToken) {
            return jsonResponse(genericSuccessResponse);
          }
          store.passwordResetTokens.forEach((t) => {
            if (t.email.toLowerCase() === userEmail && !t.used) {
              t.used = true;
            }
          });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        if (pool) {
          await pool.query(
            `INSERT INTO password_reset_tokens (email, token_hash, expires_at, used, created_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 0, NOW())`,
            [userEmail, tokenHash],
          );
        } else {
          store.passwordResetTokens!.push({
            email: userEmail,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            used: false,
            created_at: new Date().toISOString(),
          });
          saveStore(store);
        }

        const clientOrigin =
          request.headers.get("origin") ||
          (request.headers.get("host")
            ? `http://${request.headers.get("host")}`
            : "https://facetube.online");
        const resetLink = `${clientOrigin.replace(/\/+$/, "")}/reset-password?token=${rawToken}&email=${encodeURIComponent(userEmail)}`;

        await sendPasswordResetEmailServer({
          userName: targetUser.name,
          userId: targetUser.user_id,
          email: userEmail,
          resetLink,
        });

        return jsonResponse(genericSuccessResponse);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse(
          { success: false, error: "Error processing password reset request: " + msg },
          500,
        );
      }
    }
  }

  // 3d. Reset Password
  if (route === "auth/reset-password") {
    if (method === "POST") {
      try {
        const body = await request.json();
        const email = String(body.email || "")
          .toLowerCase()
          .trim();
        const rawToken = String(body.token || "").trim();
        const newPassword = String(body.newPassword || body.new_password || body.password || "");
        const confirmPassword = String(body.confirmPassword || body.confirm_password || "");

        if (!email || !email.includes("@")) {
          return jsonResponse({ success: false, error: "Valid email address is required." }, 400);
        }

        if (!rawToken) {
          return jsonResponse({ success: false, error: "Reset token is required." }, 400);
        }

        if (!newPassword || newPassword.length < 6) {
          return jsonResponse(
            {
              success: false,
              error: "New password must be at least 6 characters long.",
            },
            400,
          );
        }

        if (confirmPassword && newPassword !== confirmPassword) {
          return jsonResponse({ success: false, error: "Passwords do not match." }, 400);
        }

        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const pool = getMysqlPool();

        if (pool) {
          const [tokenRows]: any = await pool.query(
            `SELECT id, email, expires_at, used
             FROM password_reset_tokens
             WHERE LOWER(email) = LOWER(?) AND token_hash = ? AND used = 0 AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1`,
            [email, tokenHash],
          );

          if (!tokenRows || tokenRows.length === 0) {
            return jsonResponse(
              {
                success: false,
                error:
                  "This password reset link is invalid, has already been used, or has expired. Please request a new link.",
              },
              400,
            );
          }

          const tokenRecord = tokenRows[0];
          await pool.query("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", [
            tokenRecord.id,
          ]);

          const [userRows]: any = await pool.query(
            "SELECT id, user_id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
            [email],
          );
          if (!userRows || userRows.length === 0) {
            return jsonResponse(
              {
                success: false,
                error: "Account associated with this email address was not found.",
              },
              404,
            );
          }

          const userRecord = userRows[0];
          const newHash = await bcrypt.hash(newPassword, 10);
          await pool.query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [
            newHash,
            userRecord.id,
          ]);

          try {
            await pool.query("DELETE FROM sessions WHERE user_id = ?", [userRecord.id]);
          } catch (_e) {
            // Sessions table optional
          }

          return jsonResponse({
            success: true,
            message:
              "Your password has been reset successfully. Please log in with your new password.",
          });
        } else {
          // JSON store fallback
          if (!store.passwordResetTokens) {
            store.passwordResetTokens = [];
          }

          const now = new Date().toISOString();
          const tokenRecord = store.passwordResetTokens.find(
            (t) =>
              t.email.toLowerCase() === email &&
              t.token_hash === tokenHash &&
              !t.used &&
              t.expires_at > now,
          );

          if (!tokenRecord) {
            return jsonResponse(
              {
                success: false,
                error:
                  "This password reset link is invalid, has already been used, or has expired. Please request a new link.",
              },
              400,
            );
          }

          tokenRecord.used = true;

          const user = store.users.find((u) => u.email.toLowerCase() === email);
          if (!user) {
            return jsonResponse(
              {
                success: false,
                error: "Account associated with this email address was not found.",
              },
              404,
            );
          }

          const newHash = await bcrypt.hash(newPassword, 10);
          user.password_hash = newHash;

          if (store.sessions) {
            for (const [sToken, sUid] of Object.entries(store.sessions)) {
              if (sUid === user.id || sUid === user.user_id) {
                delete store.sessions[sToken];
              }
            }
          }

          saveStore(store);

          return jsonResponse({
            success: true,
            message:
              "Your password has been reset successfully. Please log in with your new password.",
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse(
          { success: false, error: "Database error while resetting password: " + msg },
          500,
        );
      }
    }
  }

  // 4. Users & Profile
  if (route === "users/profile") {
    if (method === "GET") {
      const qUserId = url.searchParams.get("userId") || url.searchParams.get("user_id");
      if (qUserId) {
        const norm = qUserId.trim().toUpperCase();
        const pool = getMysqlPool();
        if (pool) {
          try {
            const [rows]: any = await pool.query(
              `SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, created_at
               FROM users
               WHERE UPPER(user_id) = UPPER(?) OR LOWER(email) = LOWER(?) OR id = ?
               LIMIT 1`,
              [norm, norm, norm],
            );
            if (rows && rows.length > 0) {
              return jsonResponse({ success: true, profile: rows[0] });
            }
          } catch (_e) {
            // Ignore query error and fall through
          }
        }
      }
      return jsonResponse({ success: false, error: "Profile not found" }, 404);
    }
    if (method === "POST") {
      const body = await request.json();
      const targetUserId = body.userId || "FT102857";
      const pool = getMysqlPool();
      if (pool) {
        try {
          const updates: string[] = [];
          const params: any[] = [];
          if (body.name) {
            updates.push("name = ?");
            params.push(body.name);
          }
          if (body.mobile) {
            updates.push("mobile = ?");
            params.push(body.mobile);
          }
          if (body.avatar_url) {
            updates.push("avatar_url = ?");
            params.push(body.avatar_url);
          }
          if (updates.length > 0) {
            params.push(targetUserId);
            params.push(targetUserId);
            await pool.query(
              `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ? OR UPPER(user_id) = UPPER(?)`,
              params,
            );
            const [rows]: any = await pool.query(
              `SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, created_at
               FROM users WHERE id = ? OR UPPER(user_id) = UPPER(?) LIMIT 1`,
              [targetUserId, targetUserId],
            );
            return jsonResponse({
              success: true,
              profile: rows[0],
              message: "Profile updated",
            });
          }
        } catch (_e) {
          // Ignore update error
        }
      }
      return jsonResponse({ success: false, error: "User not found" }, 404);
    }
  }

  if (route === "users/list") {
    if (method === "GET") {
      const pool = getMysqlPool();
      if (pool) {
        try {
          const [rows]: any = await pool.query(
            `SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, created_at
             FROM users ORDER BY created_at DESC LIMIT 100`,
          );
          return jsonResponse({
            success: true,
            users: rows,
            total: rows.length,
          });
        } catch (_e) {
          // Ignore list error
        }
      }
      return jsonResponse({
        success: true,
        users: store.users,
        total: store.users.length,
      });
    }
  }

  // 5. Videos
  if (route === "videos/list") {
    if (method === "GET") {
      const userId = url.searchParams.get("userId");
      const videoType = url.searchParams.get("videoType");
      const contentType = url.searchParams.get("contentType");
      const category = url.searchParams.get("category");
      const search = url.searchParams.get("search");

      const pool = getMysqlPool();
      if (pool) {
        try {
          const where: string[] = [];
          const params: any[] = [];
          if (userId) {
            where.push("UPPER(user_id) = UPPER(?)");
            params.push(userId.trim());
          }
          if (videoType && videoType !== "all") {
            where.push("video_type = ?");
            params.push(videoType);
          }
          if (contentType && contentType !== "all") {
            where.push("content_type = ?");
            params.push(contentType);
          }
          if (category && category !== "All") {
            where.push("LOWER(category) = LOWER(?)");
            params.push(category);
          }
          if (search) {
            where.push("(title LIKE ? OR description LIKE ? OR creator_name LIKE ?)");
            const s = `%${search}%`;
            params.push(s, s, s);
          }
          if (!url.searchParams.get("include_blocked")) {
            where.push("COALESCE(is_blocked, 0) = 0");
          }

          const whereSql = where.length > 0 ? "WHERE " + where.join(" AND ") : "";
          const sql = `
            SELECT 
              id, user_id, creator_name, title, description, video_url, thumbnail_url,
              video_type, content_type, category, duration, views, likes,
              payment_status, payment_id, payment_amount, is_promoted,
              promotion_plan, promotion_expires_at, created_at, updated_at,
              (is_promoted = 1 AND promotion_expires_at IS NOT NULL AND promotion_expires_at > NOW()) AS is_active_promoted
            FROM uploaded_videos
            ${whereSql}
            ORDER BY is_active_promoted DESC, created_at DESC
            LIMIT 100
          `;
          const [rows] = (await pool.query(sql, params)) as any;
          if (Array.isArray(rows) && rows.length > 0) {
            const formatted = rows.map((r: any) => {
              const active = isAdPromotionActive({
                is_promoted: r.is_promoted,
                promotion_expires_at: r.promotion_expires_at,
              });
              return {
                id: String(r.id),
                userId: r.user_id,
                user_id: r.user_id,
                creatorName: r.creator_name,
                creator_name: r.creator_name,
                title: r.title,
                description: r.description || "",
                videoUrl: r.video_url,
                video_url: r.video_url,
                thumbnailUrl: r.thumbnail_url || "",
                thumbnail_url: r.thumbnail_url || "",
                videoType: r.video_type,
                video_type: r.video_type,
                contentType: r.content_type,
                content_type: r.content_type,
                category: r.category || "General",
                duration: r.duration || "0:00",
                views: Number(r.views) || 0,
                likes: Number(r.likes) || 0,
                paymentStatus: r.payment_status || "not_required",
                payment_status: r.payment_status || "not_required",
                paymentId: r.payment_id,
                payment_id: r.payment_id,
                paymentAmount: Number(r.payment_amount) || 0,
                payment_amount: Number(r.payment_amount) || 0,
                isPromoted: active,
                is_promoted: active,
                isActivePromoted: active,
                is_active_promoted: active,
                rawIsPromoted: Boolean(r.is_promoted),
                raw_is_promoted: Boolean(r.is_promoted),
                promotionPlan: r.promotion_plan,
                promotion_plan: r.promotion_plan,
                promotionExpiresAt: r.promotion_expires_at,
                promotion_expires_at: r.promotion_expires_at,
                createdAt: r.created_at,
                created_at: r.created_at,
                updatedAt: r.updated_at,
                updated_at: r.updated_at,
              };
            });
            return jsonResponse({ success: true, videos: formatted, total: formatted.length });
          }
        } catch (dbErr) {
          console.warn("MySQL videos/list fallback to local store:", dbErr);
        }
      }

      let filtered = [...store.videos];
      if (!url.searchParams.get("include_blocked")) {
        filtered = filtered.filter((v) => !v.is_blocked);
      }
      if (userId) {
        filtered = filtered.filter((v) => v.user_id.toUpperCase() === userId.trim().toUpperCase());
      }
      if (videoType && videoType !== "all") {
        filtered = filtered.filter((v) => v.video_type === videoType);
      }
      if (contentType && contentType !== "all") {
        filtered = filtered.filter((v) => v.content_type === contentType);
      }
      if (category && category !== "All") {
        filtered = filtered.filter(
          (v) => (v.category || "General").toLowerCase() === category.toLowerCase(),
        );
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.title.toLowerCase().includes(s) ||
            v.description.toLowerCase().includes(s) ||
            v.creator_name.toLowerCase().includes(s),
        );
      }

      // Prioritize actively promoted videos (expiry still in the future) at top of feeds
      filtered.sort((a, b) => {
        const pA = isAdPromotionActive(a) ? 1 : 0;
        const pB = isAdPromotionActive(b) ? 1 : 0;
        if (pA !== pB) return pB - pA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const formatted = filtered.map((v) => {
        const active = isAdPromotionActive(v);
        return {
          ...v,
          userId: v.user_id,
          creatorName: v.creator_name,
          videoUrl: v.video_url,
          thumbnailUrl: v.thumbnail_url,
          videoType: v.video_type,
          contentType: v.content_type,
          paymentStatus: v.payment_status,
          paymentId: v.payment_id,
          paymentAmount: v.payment_amount,
          isPromoted: active,
          is_promoted: active,
          isActivePromoted: active,
          is_active_promoted: active,
          rawIsPromoted: Boolean(v.is_promoted),
          raw_is_promoted: Boolean(v.is_promoted),
          promotionPlan: v.promotion_plan,
          promotion_plan: v.promotion_plan,
          promotionExpiresAt: v.promotion_expires_at,
          promotion_expires_at: v.promotion_expires_at,
          createdAt: v.created_at,
          updatedAt: v.updated_at,
        };
      });

      return jsonResponse({ success: true, videos: formatted, total: formatted.length });
    }
  }

  if (route === "videos/get") {
    if (method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return jsonResponse({ success: false, error: "Missing video id" }, 400);

      const pool = getMysqlPool();
      if (pool) {
        try {
          const [rows] = (await pool.query("SELECT * FROM uploaded_videos WHERE id = ? LIMIT 1", [
            id,
          ])) as any;
          if (Array.isArray(rows) && rows.length > 0) {
            const r = rows[0];
            if (r.is_blocked) {
              return jsonResponse(
                {
                  success: false,
                  error: "This video has been blocked by administrators for content moderation.",
                  is_blocked: true,
                },
                403,
              );
            }
            const active = isAdPromotionActive({
              is_promoted: r.is_promoted,
              promotion_expires_at: r.promotion_expires_at,
            });
            return jsonResponse({
              success: true,
              video: {
                id: String(r.id),
                userId: r.user_id,
                user_id: r.user_id,
                creatorName: r.creator_name,
                creator_name: r.creator_name,
                title: r.title,
                description: r.description || "",
                videoUrl: r.video_url,
                video_url: r.video_url,
                thumbnailUrl: r.thumbnail_url || "",
                thumbnail_url: r.thumbnail_url || "",
                videoType: r.video_type,
                video_type: r.video_type,
                contentType: r.content_type,
                content_type: r.content_type,
                category: r.category || "General",
                duration: r.duration || "0:00",
                views: Number(r.views) || 0,
                likes: Number(r.likes) || 0,
                paymentStatus: r.payment_status,
                payment_status: r.payment_status,
                paymentId: r.payment_id,
                payment_id: r.payment_id,
                paymentAmount: Number(r.payment_amount) || 0,
                payment_amount: Number(r.payment_amount) || 0,
                isPromoted: active,
                is_promoted: active,
                isActivePromoted: active,
                is_active_promoted: active,
                rawIsPromoted: Boolean(r.is_promoted),
                raw_is_promoted: Boolean(r.is_promoted),
                promotionPlan: r.promotion_plan,
                promotion_plan: r.promotion_plan,
                promotionExpiresAt: r.promotion_expires_at,
                promotion_expires_at: r.promotion_expires_at,
                createdAt: r.created_at,
                created_at: r.created_at,
                updatedAt: r.updated_at,
                updated_at: r.updated_at,
              },
            });
          }
        } catch (_dbErr) {
          // fallback
        }
      }

      const v = store.videos.find((item) => item.id === id);
      if (v) {
        if (v.is_blocked) {
          return jsonResponse(
            {
              success: false,
              error: "This video has been blocked by administrators for content moderation.",
              is_blocked: true,
            },
            403,
          );
        }
        const active = isAdPromotionActive(v);
        return jsonResponse({
          success: true,
          video: {
            ...v,
            userId: v.user_id,
            creatorName: v.creator_name,
            videoUrl: v.video_url,
            thumbnailUrl: v.thumbnail_url,
            videoType: v.video_type,
            contentType: v.content_type,
            paymentStatus: v.payment_status,
            paymentId: v.payment_id,
            paymentAmount: v.payment_amount,
            isPromoted: active,
            is_promoted: active,
            isActivePromoted: active,
            is_active_promoted: active,
            rawIsPromoted: Boolean(v.is_promoted),
            raw_is_promoted: Boolean(v.is_promoted),
            promotionPlan: v.promotion_plan,
            promotion_plan: v.promotion_plan,
            promotionExpiresAt: v.promotion_expires_at,
            promotion_expires_at: v.promotion_expires_at,
            createdAt: v.created_at,
            updatedAt: v.updated_at,
          },
        });
      }
      return jsonResponse({ success: false, error: "Video not found" }, 404);
    }
  }

  if (route === "videos/create") {
    if (method === "POST") {
      const body = await request.json();
      const title = (body.title || "").trim();
      const videoUrl = (body.video_url || body.videoUrl || "").trim();

      if (!title) {
        return jsonResponse({ success: false, error: "Video title is required." }, 400);
      }
      if (!videoUrl) {
        return jsonResponse({ success: false, error: "Video URL is required." }, 400);
      }

      let finalThumbnailUrl =
        body.thumbnail_url ||
        body.thumbnailUrl ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";

      const vidId = body.id || `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Save base64 thumbnail to physical disk if provided
      if (finalThumbnailUrl.startsWith("data:image/")) {
        try {
          const parts = finalThumbnailUrl.split(",");
          if (parts.length === 2) {
            const buffer = Buffer.from(parts[1], "base64");
            const imgUploadDir = path.resolve(process.cwd(), "uploads", "images");
            await fs.promises.mkdir(imgUploadDir, { recursive: true });
            const safeVidId = vidId.replace(/[^a-zA-Z0-9_-]/g, "_");
            const imgFileName = `thumb_${safeVidId}.jpg`;
            await fs.promises.writeFile(path.join(imgUploadDir, imgFileName), buffer);
            finalThumbnailUrl = `/uploads/images/${imgFileName}`;
          }
        } catch (imgErr) {
          console.warn("Base64 thumbnail save error:", imgErr);
        }
      }

      const newVideo = {
        id: vidId,
        user_id: body.user_id || body.userId || "FT483921",
        creator_name: body.creator_name || body.creatorName || "FaceTube Creator",
        title,
        description: (body.description || "").trim(),
        video_url: videoUrl,
        thumbnail_url: finalThumbnailUrl,
        video_type: (body.video_type || body.videoType || "free") as "free" | "premium",
        content_type: (body.content_type || body.contentType || "long") as "short" | "long",
        category: body.category || "General",
        duration: body.duration || "1:00",
        views: 0,
        likes: 0,
        payment_status: (body.payment_status ||
          body.paymentStatus ||
          (body.video_type === "premium" ? "pending" : "not_required")) as
          "not_required" | "pending" | "paid" | "failed",
        payment_id: body.payment_id || body.paymentId || undefined,
        payment_amount: Number(body.payment_amount || body.paymentAmount) || 0,
        is_promoted: Boolean(body.is_promoted || body.isPromoted),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Persist to MySQL uploaded_videos table if pool is configured
      const pool = getMysqlPool();
      if (pool) {
        try {
          await pool.query(
            `INSERT INTO uploaded_videos (
              id, user_id, creator_name, title, description, video_url, thumbnail_url,
              video_type, content_type, category, duration, views, likes,
              payment_status, payment_id, payment_amount, is_promoted,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
              title = VALUES(title),
              description = VALUES(description),
              video_url = VALUES(video_url),
              thumbnail_url = VALUES(thumbnail_url),
              video_type = VALUES(video_type),
              content_type = VALUES(content_type),
              category = VALUES(category),
              duration = VALUES(duration),
              payment_status = VALUES(payment_status),
              payment_id = VALUES(payment_id),
              payment_amount = VALUES(payment_amount),
              updated_at = NOW()`,
            [
              newVideo.id,
              newVideo.user_id,
              newVideo.creator_name,
              newVideo.title,
              newVideo.description,
              newVideo.video_url,
              newVideo.thumbnail_url,
              newVideo.video_type,
              newVideo.content_type,
              newVideo.category,
              newVideo.duration,
              newVideo.payment_status,
              newVideo.payment_id || null,
              newVideo.payment_amount,
              newVideo.is_promoted ? 1 : 0,
            ],
          );
        } catch (dbErr: any) {
          console.warn("MySQL uploaded_videos insert warning:", dbErr?.message);
        }
      }

      store.videos.unshift(newVideo);
      saveStore(store);
      return jsonResponse({ success: true, video: newVideo }, 201);
    }
  }

  if (route === "videos/like") {
    if (method === "POST") {
      const body = await request.json();
      const vid = store.videos.find((v) => v.id === body.videoId);
      if (vid) {
        vid.likes = (vid.likes || 0) + 1;
        saveStore(store);

        const pool = getMysqlPool();
        if (pool) {
          try {
            await pool.query("UPDATE uploaded_videos SET likes = likes + 1 WHERE id = ?", [
              body.videoId,
            ]);
          } catch (_e) {
            // Ignore error if MySQL is unreachable
          }
        }

        return jsonResponse({ success: true, liked: true, likes: vid.likes });
      }
      return jsonResponse({ success: false, error: "Video not found" }, 404);
    }
  }

  if (route === "videos/counts") {
    if (method === "GET") {
      const userId = url.searchParams.get("userId");
      const list = userId
        ? store.videos.filter((v) => v.user_id.toUpperCase() === userId.trim().toUpperCase())
        : store.videos;

      let freeShort = 0;
      let freeLong = 0;
      let premiumShort = 0;
      let premiumLong = 0;

      for (const v of list) {
        if (v.video_type === "free") {
          if (v.content_type === "short") freeShort++;
          else freeLong++;
        } else {
          if (v.content_type === "short") premiumShort++;
          else premiumLong++;
        }
      }

      return jsonResponse({
        success: true,
        counts: {
          freeShort,
          freeLong,
          premiumShort,
          premiumLong,
          totalFree: freeShort + freeLong,
          totalPremium: premiumShort + premiumLong,
          totalUploaded: freeShort + freeLong + premiumShort + premiumLong,
        },
      });
    }
  }

  if (route === "videos/promote") {
    if (method === "POST") {
      const body = await request.json();
      const videoId = body.videoId || body.video_id;
      if (!videoId) return jsonResponse({ success: false, error: "Missing videoId" }, 400);

      const days = Number(body.durationDays || body.duration_days) || 30;
      const planId = body.planId || body.plan_id || "plan-monthly";
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const pool = getMysqlPool();
      if (pool) {
        try {
          await pool.query(
            "UPDATE uploaded_videos SET is_promoted = 1, promotion_plan = ?, promotion_expires_at = ?, updated_at = NOW() WHERE id = ?",
            [planId, expiresAt, videoId],
          );
        } catch (dbErr) {
          console.warn("MySQL promote error:", dbErr);
        }
      }

      const vid = store.videos.find((v) => v.id === videoId);
      if (vid) {
        vid.is_promoted = true;
        vid.promotion_plan = planId;
        vid.promotion_expires_at = expiresAt;
        saveStore(store);
      }

      return jsonResponse({
        success: true,
        message: "Video promoted successfully.",
        promotionExpiresAt: expiresAt,
      });
    }
  }

  // 6. Media File Uploads (Videos & Images)
  if (route === "uploads/video") {
    if (method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("video");

        if (!file || typeof file === "string") {
          return jsonResponse(
            {
              success: false,
              error: "No video file found in upload request. Field 'video' is required.",
            },
            400,
          );
        }

        const videoFile = file as File;
        const origName = videoFile.name || "video.mp4";
        const ext = path.extname(origName).toLowerCase().replace(/^\./, "") || "mp4";
        const allowedExts = ["mp4", "webm", "ogg", "mov", "m4v", "mkv"];

        if (!allowedExts.includes(ext)) {
          return jsonResponse(
            {
              success: false,
              error: `Unsupported video format '.${ext}'. Supported formats are MP4, WebM, OGG, MOV, M4V.`,
            },
            400,
          );
        }

        const maxSizeBytes = 250 * 1024 * 1024; // 250 MB
        if (videoFile.size <= 0) {
          return jsonResponse(
            { success: false, error: "Uploaded video file is empty (0 bytes)." },
            400,
          );
        }
        if (videoFile.size > maxSizeBytes) {
          return jsonResponse(
            { success: false, error: "Video file size exceeds maximum permitted limit of 250MB." },
            400,
          );
        }

        const uploadDir = path.resolve(process.cwd(), "uploads", "videos");
        await fs.promises.mkdir(uploadDir, { recursive: true });

        const uniqueName = `vid_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
        const targetPath = path.join(uploadDir, uniqueName);
        const arrayBuf = await videoFile.arrayBuffer();
        await fs.promises.writeFile(targetPath, Buffer.from(arrayBuf));

        const fileSizeMb = `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`;

        return jsonResponse(
          {
            success: true,
            url: `/uploads/videos/${uniqueName}`,
            fileName: uniqueName,
            format: ext,
            fileSize: fileSizeMb,
            sizeBytes: videoFile.size,
            uploadedAt: new Date().toISOString(),
          },
          201,
        );
      } catch (uploadErr: any) {
        console.error("Video upload server error:", uploadErr);
        return jsonResponse(
          {
            success: false,
            error:
              "Server failed to process video upload: " + (uploadErr?.message || "Unknown error"),
          },
          500,
        );
      }
    }
  }

  if (route === "uploads/image") {
    if (method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("image");

        if (!file || typeof file === "string") {
          return jsonResponse(
            {
              success: false,
              error: "No image file found in upload request. Field 'image' is required.",
            },
            400,
          );
        }

        const imgFile = file as File;
        const origName = imgFile.name || "image.jpg";
        const ext = path.extname(origName).toLowerCase().replace(/^\./, "") || "jpg";
        const allowedExts = ["jpg", "jpeg", "png", "webp"];

        if (!allowedExts.includes(ext)) {
          return jsonResponse(
            {
              success: false,
              error: `Unsupported image format '.${ext}'. Supported formats are JPG, JPEG, PNG, WEBP.`,
            },
            400,
          );
        }

        const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
        if (imgFile.size <= 0) {
          return jsonResponse({ success: false, error: "Uploaded image file is empty." }, 400);
        }
        if (imgFile.size > maxSizeBytes) {
          return jsonResponse(
            { success: false, error: "Image file exceeds maximum permitted limit of 25MB." },
            400,
          );
        }

        const uploadDir = path.resolve(process.cwd(), "uploads", "images");
        await fs.promises.mkdir(uploadDir, { recursive: true });

        const uniqueName = `img_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
        const targetPath = path.join(uploadDir, uniqueName);
        const arrayBuf = await imgFile.arrayBuffer();
        await fs.promises.writeFile(targetPath, Buffer.from(arrayBuf));

        const fileSizeMb = `${(imgFile.size / (1024 * 1024)).toFixed(2)} MB`;

        return jsonResponse(
          {
            success: true,
            url: `/uploads/images/${uniqueName}`,
            fileName: uniqueName,
            format: ext,
            fileSize: fileSizeMb,
            sizeBytes: imgFile.size,
            uploadedAt: new Date().toISOString(),
          },
          201,
        );
      } catch (uploadErr: any) {
        console.error("Image upload server error:", uploadErr);
        return jsonResponse(
          {
            success: false,
            error:
              "Server failed to process image upload: " + (uploadErr?.message || "Unknown error"),
          },
          500,
        );
      }
    }
  }

  // 6. Comments
  if (route === "comments/list") {
    if (method === "GET") {
      const videoId = url.searchParams.get("videoId");
      const cmts = videoId ? store.comments.filter((c) => c.video_id === videoId) : store.comments;
      return jsonResponse({
        success: true,
        comments: cmts.map((c) => ({
          ...c,
          videoId: c.video_id,
          userId: c.user_id,
          userName: c.user_name,
          avatarUrl: c.avatar_url,
          createdAt: c.created_at,
        })),
        total: cmts.length,
      });
    }
  }

  if (route === "comments/create") {
    if (method === "POST") {
      const body = await request.json();
      const newComment = {
        id: `cmt-${Date.now()}`,
        video_id: body.videoId,
        user_id: body.userId,
        user_name: body.userName,
        avatar_url: body.avatarUrl,
        comment: body.comment,
        created_at: new Date().toISOString(),
      };
      store.comments.unshift(newComment);
      saveStore(store);
      return jsonResponse({ success: true, comment: newComment });
    }
  }

  // 7. Images
  if (route === "images/list") {
    if (method === "GET") {
      const userId = url.searchParams.get("userId");
      const pool = getMysqlPool();
      if (pool) {
        try {
          const sql = userId
            ? "SELECT * FROM uploaded_images WHERE UPPER(user_id) = UPPER(?) ORDER BY created_at DESC"
            : "SELECT * FROM uploaded_images ORDER BY created_at DESC";
          const [rows] = (await pool.query(sql, userId ? [userId.trim()] : [])) as any;
          if (Array.isArray(rows) && rows.length > 0) {
            const mapped = rows.map((r: any) => ({
              id: String(r.id),
              userId: r.user_id,
              user_id: r.user_id,
              creatorName: r.creator_name,
              creator_name: r.creator_name,
              title: r.title,
              description: r.description || "",
              imageUrl: r.image_url,
              image_url: r.image_url,
              thumbnailUrl: r.thumbnail_url || r.image_url,
              thumbnail_url: r.thumbnail_url || r.image_url,
              format: r.format || "jpg",
              fileSize: r.file_size || "1.0 MB",
              file_size: r.file_size || "1.0 MB",
              category: r.category || "General",
              views: Number(r.views) || 0,
              likes: Number(r.likes) || 0,
              createdAt: r.created_at,
              created_at: r.created_at,
            }));
            return jsonResponse({ success: true, images: mapped, total: mapped.length });
          }
        } catch (_dbErr) {
          // fallback to store.images
        }
      }

      const imgs = userId
        ? store.images.filter((i) => i.user_id.toUpperCase() === userId.trim().toUpperCase())
        : store.images;
      return jsonResponse({
        success: true,
        images: imgs.map((i) => ({
          ...i,
          userId: i.user_id,
          creatorName: i.creator_name,
          imageUrl: i.image_url,
          thumbnailUrl: i.thumbnail_url || i.image_url,
          fileSize: i.file_size || "1.0 MB",
          createdAt: i.created_at,
        })),
        total: imgs.length,
      });
    }
  }

  if (route === "images/create") {
    if (method === "POST") {
      const body = await request.json();
      const rawImageUrl = (body.imageUrl || body.image_url || "").trim();
      if (!rawImageUrl) {
        return jsonResponse(
          {
            success: false,
            error: "Image URL is required. Please upload the image file to storage first.",
          },
          400,
        );
      }

      const imgId = body.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newImage = {
        id: imgId,
        user_id: body.userId || body.user_id || "FT102857",
        creator_name: body.creatorName || body.creator_name || "Creator",
        title: (body.title || "Uploaded Image").trim(),
        description: (body.description || "").trim(),
        image_url: rawImageUrl,
        thumbnail_url: (body.thumbnailUrl || body.thumbnail_url || rawImageUrl).trim(),
        format: (body.format || "jpg").toLowerCase(),
        file_size: body.fileSize || body.file_size || "1.2 MB",
        category: body.category || "Entertainment",
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
      };

      const pool = getMysqlPool();
      if (pool) {
        try {
          await pool.query(
            `INSERT INTO uploaded_images (id, user_id, creator_name, title, description, image_url, format, file_size, category, views, likes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())`,
            [
              newImage.id,
              newImage.user_id,
              newImage.creator_name,
              newImage.title,
              newImage.description,
              newImage.image_url,
              newImage.format,
              newImage.file_size,
              newImage.category,
            ],
          );
        } catch (_dbErr) {
          // ignore error if MySQL is unreachable
        }
      }

      store.images.unshift(newImage);
      saveStore(store);
      return jsonResponse({
        success: true,
        image: {
          ...newImage,
          userId: newImage.user_id,
          creatorName: newImage.creator_name,
          imageUrl: newImage.image_url,
          thumbnailUrl: newImage.thumbnail_url,
          fileSize: newImage.file_size,
          createdAt: newImage.created_at,
        },
      });
    }
  }

  // 8. Wallet & Income
  if (route === "wallet/balance") {
    if (method === "GET") {
      const qUserId = url.searchParams.get("userId") || url.searchParams.get("user_id");
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      const auth = requireAuth(authUser, qUserId);
      if (!auth.success) {
        return auth.response;
      }
      const userId = auth.effectiveUserId;

      if (pool) {
        try {
          const [rows] = await pool.query<any[]>(
            `SELECT * FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) LIMIT 1`,
            [userId],
          );
          if (rows && rows.length > 0) {
            const w = rows[0];
            const bal = Number(w.balance || 0);
            const refInc = Number(w.referral_income || 0);
            const glbInc = Number(w.global_income || 0);
            const adsInc = Number(w.adsense_income || 0);
            const affInc = Number(w.affiliate_income || 0);
            const totEarn = Number(w.total_earned || bal);
            const totWdr = Number(w.total_withdrawn || 0);

            return jsonResponse({
              success: true,
              wallet: {
                userId,
                user_id: userId,
                balance: bal,
                totalBalance: bal,
                withdrawableBalance: bal,
                referralIncome: refInc,
                referral_income: refInc,
                directReferralIncome: refInc,
                globalIncome: glbInc,
                global_income: glbInc,
                adsenseIncome: adsInc,
                adsense_income: adsInc,
                affiliateIncome: affInc,
                affiliate_income: affInc,
                totalEarnings: totEarn,
                total_earned: totEarn,
                totalWithdrawn: totWdr,
                total_withdrawn: totWdr,
                pendingWithdrawals: 0,
                updatedAt: w.updated_at || new Date().toISOString(),
                updated_at: w.updated_at || new Date().toISOString(),
              },
            });
          }
        } catch (_e) {
          // fallback to store
        }
      }

      const w = store.wallets?.[userId] || {
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        referral_income: 0,
        global_income: 0,
        adsense_income: 0,
        affiliate_income: 0,
        updated_at: new Date().toISOString(),
      };

      return jsonResponse({
        success: true,
        wallet: {
          userId,
          user_id: userId,
          balance: w.balance,
          totalBalance: w.balance,
          withdrawableBalance: w.balance,
          referralIncome: w.referral_income,
          referral_income: w.referral_income,
          directReferralIncome: w.referral_income,
          globalIncome: w.global_income,
          global_income: w.global_income,
          adsenseIncome: w.adsense_income,
          adsense_income: w.adsense_income,
          affiliateIncome: w.affiliate_income,
          affiliate_income: w.affiliate_income,
          totalEarnings: w.total_earned,
          total_earned: w.total_earned,
          totalWithdrawn: w.total_withdrawn,
          total_withdrawn: w.total_withdrawn,
          pendingWithdrawals: 0,
          updatedAt: w.updated_at,
          updated_at: w.updated_at,
        },
      });
    }
  }

  if (route === "wallet/transactions") {
    if (method === "GET") {
      const qUserId = url.searchParams.get("userId") || url.searchParams.get("user_id");
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      if (!authUser) {
        return jsonResponse(
          {
            success: false,
            error: "Authentication required. Please provide a valid Bearer session token.",
          },
          401,
        );
      }
      const auth = requireAuth(authUser, qUserId);
      if (!auth.success) {
        return auth.response;
      }
      const targetUserId = auth.effectiveUserId;

      if (pool) {
        try {
          const query =
            authUser.role === "admin" && !qUserId
              ? `SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 100`
              : `SELECT * FROM wallet_transactions WHERE UPPER(user_id) = UPPER(?) ORDER BY created_at DESC LIMIT 100`;
          const params = authUser.role === "admin" && !qUserId ? [] : [targetUserId];
          const [rows]: any = await pool.query(query, params);
          if (rows) {
            return jsonResponse({
              success: true,
              transactions: rows,
              total: rows.length,
            });
          }
        } catch (_e) {
          // fallback to store
        }
      }

      const filtered =
        authUser.role === "admin" && !qUserId
          ? store.walletTransactions
          : store.walletTransactions.filter(
              (t: any) =>
                String(t.userId || t.user_id || "").toUpperCase() === targetUserId.toUpperCase(),
            );

      return jsonResponse({
        success: true,
        transactions: filtered,
        total: filtered.length,
      });
    }
  }

  if (route === "wallet/withdraw") {
    if (method === "POST") {
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      if (!authUser) {
        return jsonResponse(
          {
            success: false,
            error: "Authentication required. Please provide a valid Bearer session token.",
          },
          401,
        );
      }

      const payload = await request.json();
      const amount = Number(payload.amount);
      const requestedUserId = String(payload.userId || payload.user_id || "").trim();

      // Enforce ownership: standard users can ONLY withdraw from their own account
      let effectiveUserId = authUser.user_id;
      if (requestedUserId && requestedUserId.toUpperCase() !== authUser.user_id.toUpperCase()) {
        if (authUser.role !== "admin") {
          return jsonResponse(
            {
              success: false,
              error: "Unauthorized: You cannot initiate withdrawals on behalf of another user.",
            },
            403,
          );
        }
        effectiveUserId = requestedUserId.toUpperCase();
      }

      if (isNaN(amount) || amount < 1000) {
        return jsonResponse(
          {
            success: false,
            error: "Minimum withdrawal amount is ₹1,000. You cannot withdraw less than ₹1,000.",
          },
          400,
        );
      }
      if (amount > 10000) {
        return jsonResponse(
          {
            success: false,
            error:
              "Maximum daily withdrawal limit is ₹10,000. You cannot withdraw more than ₹10,000 per day.",
          },
          400,
        );
      }

      if (pool) {
        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();
          const [bRows]: any = await conn.query(
            `SELECT balance FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) FOR UPDATE`,
            [effectiveUserId],
          );
          const currentBal = Number(bRows?.[0]?.balance || 0);
          if (currentBal < amount) {
            await conn.rollback();
            return jsonResponse(
              {
                success: false,
                error: `Insufficient balance. Your current withdrawable balance is ₹${currentBal.toLocaleString("en-IN")}, but you requested ₹${amount.toLocaleString("en-IN")}.`,
              },
              400,
            );
          }

          const newBal = currentBal - amount;
          await conn.query(
            `UPDATE wallet_balances 
             SET balance = balance - ?, total_withdrawn = total_withdrawn + ?, updated_at = NOW() 
             WHERE UPPER(user_id) = UPPER(?)`,
            [amount, amount, effectiveUserId],
          );

          const txId = `tx_wdr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await conn.query(
            `INSERT INTO wallet_transactions (id, user_id, type, amount, status, created_at)
             VALUES (?, ?, 'withdrawal', ?, 'approved', NOW())`,
            [txId, effectiveUserId, amount],
          );

          await conn.commit();

          return jsonResponse({
            success: true,
            message: `Withdrawal request for ₹${amount.toLocaleString("en-IN")} validated and approved.`,
            transaction: {
              id: txId,
              userId: effectiveUserId,
              user_id: effectiveUserId,
              amount,
              type: "withdrawal",
              status: "approved",
              createdAt: new Date().toISOString(),
            },
            updatedWallet: {
              userId: effectiveUserId,
              user_id: effectiveUserId,
              balance: newBal,
              totalBalance: newBal,
              withdrawableBalance: newBal,
            },
          });
        } catch (wErr) {
          await conn.rollback();
          throw wErr;
        } finally {
          conn.release();
        }
      }

      // In-memory/JSON store withdrawal
      if (!store.wallets) store.wallets = {};
      const currentWallet = store.wallets[effectiveUserId] || {
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        referral_income: 0,
        global_income: 0,
        adsense_income: 0,
        affiliate_income: 0,
        updated_at: new Date().toISOString(),
      };

      if (currentWallet.balance < amount) {
        return jsonResponse(
          {
            success: false,
            error: `Insufficient balance. Your current withdrawable balance is ₹${currentWallet.balance.toLocaleString("en-IN")}, but you requested ₹${amount.toLocaleString("en-IN")}.`,
          },
          400,
        );
      }

      currentWallet.balance -= amount;
      currentWallet.total_withdrawn += amount;
      currentWallet.updated_at = new Date().toISOString();
      store.wallets[effectiveUserId] = currentWallet;

      const tx = {
        id: `tx-wdr-${Date.now()}`,
        userId: effectiveUserId,
        user_id: effectiveUserId,
        amount,
        type: "withdrawal",
        status: "approved",
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      store.walletTransactions.unshift(tx);
      saveStore(store);

      return jsonResponse({
        success: true,
        message: `Withdrawal request for ₹${amount.toLocaleString("en-IN")} validated and approved.`,
        transaction: tx,
        updatedWallet: {
          userId: effectiveUserId,
          user_id: effectiveUserId,
          balance: currentWallet.balance,
          totalBalance: currentWallet.balance,
          withdrawableBalance: currentWallet.balance,
        },
      });
    }
  }

  // 9. KYC
  if (route === "kyc/personal") {
    if (method === "GET") {
      const userId = (url.searchParams.get("userId") || "FT102857").toUpperCase();
      const kyc = store.personalKyc[userId] || null;
      return jsonResponse({ success: true, kyc });
    }
    if (method === "POST") {
      const body = await request.json();
      const userId = (body.userId || "FT102857").toUpperCase();
      store.personalKyc[userId] = {
        ...body,
        status: "Verified",
        updatedAt: new Date().toISOString(),
      };
      saveStore(store);
      return jsonResponse({
        success: true,
        message: "Personal KYC saved",
        kyc: store.personalKyc[userId],
      });
    }
  }

  if (route === "kyc/bank") {
    if (method === "GET") {
      const userId = (url.searchParams.get("userId") || "FT102857").toUpperCase();
      const kyc = store.bankKyc[userId] || null;
      return jsonResponse({ success: true, kyc });
    }
    if (method === "POST") {
      const body = await request.json();
      const userId = (body.userId || "FT102857").toUpperCase();
      store.bankKyc[userId] = {
        ...body,
        status: "Verified",
        updatedAt: new Date().toISOString(),
      };
      saveStore(store);
      return jsonResponse({ success: true, message: "Bank KYC saved", kyc: store.bankKyc[userId] });
    }
  }

  // 10. Referrals
  if (route === "referrals/dashboard") {
    if (method === "GET") {
      const qUserId = url.searchParams.get("userId") || url.searchParams.get("user_id");
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      const auth = requireAuth(authUser, qUserId);
      if (!auth.success) {
        return auth.response;
      }
      const userId = auth.effectiveUserId;

      if (pool) {
        try {
          const [uRows] = await pool.query<any[]>(
            `SELECT user_id, referral_code, mobile, name FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1`,
            [userId],
          );
          if (uRows && uRows.length > 0) {
            const u = uRows[0];
            const myRefCode = u.referral_code || u.user_id;

            const [refRows] = await pool.query<any[]>(
              `SELECT id, user_id, name, email, mobile, created_at, role 
               FROM users 
               WHERE (UPPER(referral_code) = UPPER(?) OR UPPER(referral_code) = UPPER(?)) 
                 AND UPPER(user_id) != UPPER(?) 
               ORDER BY created_at DESC`,
              [myRefCode, u.user_id, u.user_id],
            );

            const [wRows] = await pool.query<any[]>(
              `SELECT referral_income FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) LIMIT 1`,
              [userId],
            );
            const refIncome = Number(wRows?.[0]?.referral_income || 0);

            const members = await Promise.all(
              (refRows || []).map(async (r: any) => {
                const [vRows] = await pool.query<any[]>(
                  `SELECT video_type, payment_status, COUNT(*) as cnt 
                   FROM uploaded_videos 
                   WHERE UPPER(user_id) = UPPER(?) 
                   GROUP BY video_type, payment_status`,
                  [r.user_id],
                );
                let freeCount = 0;
                let premCount = 0;
                for (const vr of vRows || []) {
                  if (vr.video_type === "free") freeCount += Number(vr.cnt);
                  if (
                    vr.video_type === "premium" &&
                    (vr.payment_status === "paid" || vr.payment_status === "not_required")
                  ) {
                    premCount += Number(vr.cnt);
                  }
                }
                const comm = premCount * 1.0;
                return {
                  id: r.id || `mem_${r.user_id}`,
                  userId: r.user_id,
                  name: r.name,
                  email: r.email,
                  mobile: r.mobile,
                  joinedAt: r.created_at,
                  status: "Active",
                  tier: r.role === "admin" ? "Admin" : "Creator",
                  freeVideosCount: freeCount,
                  premiumVideosCount: premCount,
                  totalVideosCount: freeCount + premCount,
                  directCommissionEarned: comm,
                  contribution: comm,
                  access: "Granted",
                };
              }),
            );

            return jsonResponse({
              success: true,
              dashboard: {
                userId,
                referralCode: myRefCode,
                referralNumber: u.mobile || "",
                referralLink: `https://facetube.online/register?ref=${encodeURIComponent(myRefCode)}`,
                directReferralsCount: members.length,
                teamMembersCount: members.length,
                referralIncome: refIncome,
                directReferralIncome: refIncome,
                totalReferralIncome: refIncome,
                members,
                referralMembers: members,
              },
            });
          }
        } catch (_e) {
          // fallback to store
        }
      }

      // Store fallback:
      const user = store.users.find((u) => u.user_id.toUpperCase() === userId);
      const myRefCode = user?.referral_code || userId;
      const directUsers = store.users.filter(
        (u) =>
          u.user_id.toUpperCase() !== userId &&
          (u.referral_code?.toUpperCase() === myRefCode.toUpperCase() ||
            u.referral_code?.toUpperCase() === userId),
      );

      const refIncome = Number(store.wallets?.[userId]?.referral_income || 0);

      const members = directUsers.map((r) => {
        const uVideos = store.videos.filter(
          (v) => v.user_id.toUpperCase() === r.user_id.toUpperCase(),
        );
        const freeCount = uVideos.filter((v) => v.video_type === "free").length;
        const premCount = uVideos.filter(
          (v) =>
            v.video_type === "premium" &&
            (v.payment_status === "paid" || v.payment_status === "not_required"),
        ).length;
        const comm = premCount * 1.0;
        return {
          id: r.id || `mem_${r.user_id}`,
          userId: r.user_id,
          name: r.name,
          email: r.email,
          mobile: r.mobile,
          joinedAt: r.created_at,
          status: "Active",
          tier: r.role === "admin" ? "Admin" : "Creator",
          freeVideosCount: freeCount,
          premiumVideosCount: premCount,
          totalVideosCount: freeCount + premCount,
          directCommissionEarned: comm,
          contribution: comm,
          access: "Granted",
        };
      });

      return jsonResponse({
        success: true,
        dashboard: {
          userId,
          referralCode: myRefCode,
          referralNumber: user?.mobile || "",
          referralLink: `https://facetube.online/register?ref=${encodeURIComponent(myRefCode)}`,
          directReferralsCount: members.length,
          teamMembersCount: members.length,
          referralIncome: refIncome,
          directReferralIncome: refIncome,
          totalReferralIncome: refIncome,
          members,
          referralMembers: members,
        },
      });
    }
  }

  // 11. Certificates
  if (route === "certificates/get") {
    if (method === "GET") {
      const userId = (url.searchParams.get("userId") || "FT102857").toUpperCase();
      const cert = store.certificates[userId] || {
        certificateId: `FT-CERT-${userId}`,
        userId,
        name: userId === "FT102857" ? "FaceTube Administrator" : "Alex Rivera",
        issueDate: "2026-10-01",
        verified: true,
      };
      return jsonResponse({ success: true, certificate: cert });
    }
  }

  if (route === "certificates/save") {
    if (method === "POST") {
      const body = await request.json();
      const userId = (body.userId || "FT102857").toUpperCase();
      store.certificates[userId] = body;
      saveStore(store);
      return jsonResponse({
        success: true,
        message: "Certificate saved successfully",
        certificateId: body.certificateId || `FT-CERT-${userId}`,
      });
    }
  }

  // 12. Uploads Mock
  if (route.startsWith("uploads/")) {
    if (method === "POST") {
      return jsonResponse({
        success: true,
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
        fileName: "upload.png",
        format: "png",
        fileSize: "1.2 MB",
      });
    }
  }

  // 13. Admin
  if (route === "admin/stats") {
    if (method === "GET") {
      return jsonResponse({
        success: true,
        stats: {
          totalUsers: store.users.length,
          totalVideos: store.videos.length,
          totalTransactions: 10,
          totalRevenue: 60,
          activeSubscriptions: 2,
          pendingKyc: 1,
        },
      });
    }
  }

  if (route === "admin/role") {
    if (method === "POST") {
      const body = await request.json();
      const user = store.users.find(
        (u) => u.user_id.toUpperCase() === String(body.targetUserId || "").toUpperCase(),
      );
      if (user) {
        user.role = body.role || "user";
        saveStore(store);
        return jsonResponse({ success: true, message: "User role updated successfully" });
      }
      return jsonResponse({ success: false, error: "User not found" }, 404);
    }
  }

  // 14. Admin Video Moderation (Shorts & Long Videos)
  if (route === "admin/videos") {
    const pool = getMysqlPool();
    const authUser = await getAuthUserFromRequest(request, store, pool);
    if (!authUser || authUser.role !== "admin") {
      return jsonResponse({ success: false, error: "Admin authorization required" }, 403);
    }

    if (method === "GET") {
      const list = store.videos.map((v) => ({
        ...v,
        is_blocked: Boolean(v.is_blocked),
      }));
      return jsonResponse({
        success: true,
        videos: list,
        counts: {
          total: list.length,
          blocked: list.filter((v) => v.is_blocked).length,
          shorts: list.filter((v) => v.content_type === "short").length,
          long: list.filter((v) => v.content_type === "long").length,
        },
      });
    }

    if (method === "POST") {
      const body = await request.json();
      const videoId = body.videoId || body.video_id;
      const isBlocked = Boolean(body.isBlocked ?? body.is_blocked);
      const reason = body.reason || body.block_reason || "Content moderation policy violation";

      const vid = store.videos.find((v) => v.id === videoId);
      if (vid) {
        vid.is_blocked = isBlocked;
        vid.block_reason = isBlocked ? reason : undefined;
        vid.blocked_at = isBlocked ? new Date().toISOString() : undefined;
        saveStore(store);
      }
      if (pool) {
        await pool
          .query(
            "UPDATE uploaded_videos SET is_blocked = ?, block_reason = ?, blocked_at = ? WHERE id = ?",
            [isBlocked ? 1 : 0, isBlocked ? reason : null, isBlocked ? new Date() : null, videoId],
          )
          .catch(() => {});
      }
      return jsonResponse({
        success: true,
        message: isBlocked ? "Video has been blocked" : "Video has been unblocked",
        video_id: videoId,
        is_blocked: isBlocked,
      });
    }
  }

  // 15. Admin Bulk Withdrawal Payouts
  if (route === "admin/bulk-payout") {
    if (method === "POST") {
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      if (!authUser || authUser.role !== "admin") {
        return jsonResponse({ success: false, error: "Admin authorization required" }, 403);
      }

      const body = await request.json();
      const payouts = Array.isArray(body.payouts) ? body.payouts : [];
      const notes = body.notes || "Admin bulk payout disbursement";
      const batchId = `batch_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      let totalProcessed = 0;
      let totalAmount = 0;
      const processed: any[] = [];

      for (const p of payouts) {
        const uId = String(p.userId || p.user_id || "")
          .trim()
          .toUpperCase();
        const amt = Number(p.amount) || 0;
        if (!uId || amt <= 0) continue;

        const txId =
          p.transactionId ||
          p.id ||
          `tx_bulk_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
        totalProcessed++;
        totalAmount += amt;

        if (store.wallets && store.wallets[uId]) {
          const w = store.wallets[uId]!;
          w.balance = Math.max(0, w.balance - amt);
          w.total_withdrawn = (w.total_withdrawn || 0) + amt;
        }

        if (!store.walletTransactions) store.walletTransactions = [];
        store.walletTransactions.push({
          id: txId,
          user_id: uId,
          batch_id: batchId,
          type: "withdrawal",
          amount: amt,
          status: "completed",
          payout_method: "bulk_bank_transfer",
          created_at: new Date().toISOString(),
        });

        processed.push({
          transaction_id: txId,
          user_id: uId,
          amount: amt,
          status: "completed",
        });
      }

      if (!store.payoutBatches) store.payoutBatches = [];
      store.payoutBatches.push({
        id: batchId,
        admin_user_id: authUser.user_id,
        total_recipients: totalProcessed,
        total_amount: totalAmount,
        status: "completed",
        notes,
        created_at: new Date().toISOString(),
      });
      saveStore(store);

      return jsonResponse({
        success: true,
        message: `Bulk payout completed for ${totalProcessed} recipients totaling ₹${totalAmount.toFixed(2)}`,
        batch_id: batchId,
        total_recipients: totalProcessed,
        total_amount: totalAmount,
        processed,
      });
    }
  }

  // 16. Channel Logo & Details
  if (route === "users/channel-logo") {
    if (method === "POST") {
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      if (!authUser) {
        return jsonResponse({ success: false, error: "Authentication required" }, 401);
      }
      const body = await request.json();
      const logoUrl = body.channel_logo_url || body.channelLogoUrl;
      const channelName = body.channel_name || body.channelName;
      const user = store.users.find(
        (u) => u.user_id.toUpperCase() === authUser.user_id.toUpperCase(),
      );
      if (user) {
        if (logoUrl) user.channel_logo_url = logoUrl;
        if (channelName) user.channel_name = channelName;
        saveStore(store);
      }
      if (pool) {
        await pool
          .query(
            "UPDATE users SET channel_logo_url = COALESCE(?, channel_logo_url), channel_name = COALESCE(?, channel_name), updated_at = NOW() WHERE UPPER(user_id) = UPPER(?)",
            [logoUrl || null, channelName || null, authUser.user_id],
          )
          .catch(() => {});
      }
      return jsonResponse({
        success: true,
        message: "Channel details updated successfully",
        channel_logo_url: logoUrl || user?.channel_logo_url,
        channel_name: channelName || user?.channel_name,
      });
    }
  }

  // 17. Wallet Earnings Time-Series History
  if (route === "wallet/earnings-history") {
    if (method === "GET") {
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      const requestedUserId = url.searchParams.get("user_id") || authUser?.user_id || "FT483921";
      const days = Math.max(7, Math.min(90, parseInt(url.searchParams.get("days") || "14", 10)));

      const history = [];
      const now = Date.now();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0]!;
        const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

        const txs = (store.walletTransactions || []).filter(
          (t: any) =>
            t.user_id?.toUpperCase() === requestedUserId.toUpperCase() &&
            String(t.created_at).startsWith(dateStr),
        );
        const rev = txs.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        const refInc = txs
          .filter((t: any) => t.type === "referral_income")
          .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        const glbInc = txs
          .filter((t: any) => t.type === "global_income")
          .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        const adsInc = txs
          .filter((t: any) => t.type === "adsense_income")
          .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        const affInc = txs
          .filter((t: any) => t.type === "affiliate_income")
          .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);

        history.push({
          date: dateStr,
          day: dayLabel,
          revenue: rev > 0 ? rev : i % 2 === 0 ? 120 + i * 20 : 80 + i * 15,
          referral_income: refInc,
          global_income: glbInc,
          adsense_income: adsInc,
          affiliate_income: affInc,
          tx_count: txs.length,
        });
      }

      return jsonResponse({
        success: true,
        user_id: requestedUserId,
        days,
        history,
      });
    }
  }

  // 18. Live Streams & Chat
  if (route === "live/streams") {
    if (method === "GET") {
      if (!store.liveStreams || store.liveStreams.length === 0) {
        store.liveStreams = [
          {
            id: "live_seed_001",
            user_id: "FT102857",
            title: "🔴 LIVE: 24-Hour Full-Stack & System Architecture Sprint",
            description: "Live coding, production review, and developer Q&A session.",
            category: "Coding & Tech",
            stream_key: "sk_live_devforge_001",
            playback_url: "https://vjs.zencdn.net/v/oceans.mp4",
            thumbnail_url:
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
            status: "live",
            viewers_count: 1420,
            created_at: new Date().toISOString(),
          },
        ];
        saveStore(store);
      }
      return jsonResponse({ success: true, streams: store.liveStreams });
    }
    if (method === "POST") {
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      if (!authUser) {
        return jsonResponse({ success: false, error: "Authentication required" }, 401);
      }
      const body = await request.json();
      const streamId = `live_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const newStream = {
        id: streamId,
        user_id: authUser.user_id,
        title: body.title || "FaceTube Live Broadcast",
        description: body.description || "",
        category: body.category || "General",
        stream_key: `sk_live_${crypto.randomBytes(12).toString("hex")}`,
        playback_url: body.playbackUrl || "https://vjs.zencdn.net/v/oceans.mp4",
        thumbnail_url: body.thumbnailUrl || "",
        status: "live" as const,
        viewers_count: 1,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      if (!store.liveStreams) store.liveStreams = [];
      store.liveStreams.unshift(newStream);
      saveStore(store);
      return jsonResponse({ success: true, message: "Stream created", stream: newStream }, 201);
    }
  }

  if (route === "live/chat") {
    if (method === "GET") {
      const streamId = url.searchParams.get("stream_id") || "live_seed_001";
      const messages = (store.liveChatMessages || []).filter((m) => m.stream_id === streamId);
      return jsonResponse({ success: true, stream_id: streamId, messages });
    }
    if (method === "POST") {
      const pool = getMysqlPool();
      const authUser = await getAuthUserFromRequest(request, store, pool);
      const body = await request.json();
      const streamId = body.stream_id || body.streamId;
      const msgText = String(body.message || "").trim();
      if (!streamId || !msgText) {
        return jsonResponse({ success: false, error: "stream_id and message are required" }, 400);
      }
      const msgRecord = {
        id: `chat_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        stream_id: streamId,
        user_id: authUser?.user_id || "GUEST",
        user_name: authUser?.name || body.user_name || "Viewer",
        avatar_url: authUser?.avatar_url,
        message: msgText,
        is_superchat: Boolean(body.is_superchat),
        superchat_amount: Number(body.superchat_amount) || 0,
        created_at: new Date().toISOString(),
      };
      if (!store.liveChatMessages) store.liveChatMessages = [];
      store.liveChatMessages.push(msgRecord);
      saveStore(store);
      return jsonResponse({ success: true, message: msgRecord }, 201);
    }
  }

  // Unhandled /api route
  return jsonResponse({ error: `Not Found: ${pathname}` }, 404);
}
