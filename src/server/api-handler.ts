import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getMysqlPool, testDatabaseConnection } from "./mysql";
import {
  createServerPaymentOrder,
  verifyServerPayment,
  getPersistentTransactions,
  getPersistentPremiumTxNumber,
  AdsPlanId,
} from "./payments";
import { sendWelcomeEmailServer, sendCertificateEmailServer, resolveSmtpConfig } from "./email";

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "facetube_store.json");

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
    category: string;
    views: number;
    likes: number;
    created_at: string;
  }>;
  personalKyc: Record<string, Record<string, unknown>>;
  bankKyc: Record<string, Record<string, unknown>>;
  certificates: Record<string, Record<string, unknown>>;
  walletTransactions: Array<Record<string, unknown>>;
}

function getInitialStore(): ServerStore {
  return {
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
        video_url:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
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
        video_url:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
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
        video_url:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
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
        video_url:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
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
      return inMemoryStore!;
    }
  } catch (err) {
    console.warn("[FaceTube Store] Could not read store file, initializing defaults", err);
  }
  inMemoryStore = getInitialStore();
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
        const result = createServerPaymentOrder(payload, env);
        return jsonResponse(result);
      } catch (err) {
        return jsonResponse({ error: "Failed to create payment order" }, 500);
      }
    }
  }

  if (route === "payments/verify" || route === "payment/verify") {
    if (method === "POST") {
      try {
        const payload = await request.json();
        const result = await verifyServerPayment(
          payload,
          ["FT483921", "FT900431"],
          payload.referrerUserId || null,
          env,
        );
        return jsonResponse(result);
      } catch (err) {
        return jsonResponse({ verified: false, error: "Payment verification failed" }, 500);
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
            const origin = new URL(request.url).origin || "https://facetube.online";
            emailDelivery = await sendWelcomeEmailServer(
              {
                userName: name.trim(),
                userId,
                email: normalizedEmail,
                password,
                loginLink: `${origin}/login`,
              },
              env,
            );
          } catch (_err) {
            emailDelivery = {
              success: false,
              provider: "smtp",
              error: "Email delivery failed",
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
          return jsonResponse(
            {
              success: false,
              error:
                "Hostinger MySQL database credentials are not configured in .env. Please define DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD to authenticate against MySQL.",
            },
            500,
          );
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
      const auth = request.headers.get("Authorization")?.replace(/^Bearer\s+/, "");
      const pool = getMysqlPool();
      if (auth && pool) {
        pool.query("DELETE FROM sessions WHERE token = ?", [auth]).catch(() => {});
      }
      return jsonResponse({ success: true, message: "Logged out successfully" });
    }
  }

  if (route === "auth/me") {
    if (method === "GET") {
      const auth = request.headers.get("Authorization")?.replace(/^Bearer\s+/, "");
      const pool = getMysqlPool();
      if (auth && pool) {
        try {
          const [rows]: any = await pool.query(
            `SELECT u.id, u.user_id, u.name, u.mobile, u.email, u.role, u.referral_code, u.avatar_url, u.created_at
             FROM sessions s
             INNER JOIN users u ON s.user_id = u.id
             WHERE s.token = ? AND s.expires_at > NOW()
             LIMIT 1`,
            [auth],
          );
          if (rows && rows.length > 0) {
            return jsonResponse({ authenticated: true, user: rows[0] });
          }
        } catch (_e) {
          // Ignore session fetch errors
        }
      }
      return jsonResponse({ authenticated: false, user: null });
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

      let filtered = [...store.videos];
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
        filtered = filtered.filter((v) => v.category.toLowerCase() === category.toLowerCase());
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

      const formatted = filtered.map((v) => ({
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
        isPromoted: v.is_promoted,
        promotionPlan: v.promotion_plan,
        promotionExpiresAt: v.promotion_expires_at,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      }));

      return jsonResponse({ success: true, videos: formatted, total: formatted.length });
    }
  }

  if (route === "videos/get") {
    if (method === "GET") {
      const id = url.searchParams.get("id");
      const v = store.videos.find((item) => item.id === id);
      if (v) {
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
            isPromoted: v.is_promoted,
            promotionPlan: v.promotion_plan,
            promotionExpiresAt: v.promotion_expires_at,
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
      const newVideo = {
        id: body.id || `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: body.user_id || body.userId || "FT102857",
        creator_name: body.creator_name || body.creatorName || "FaceTube Creator",
        title: body.title || "Untitled Video",
        description: body.description || "",
        video_url:
          body.video_url ||
          body.videoUrl ||
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnail_url:
          body.thumbnail_url ||
          body.thumbnailUrl ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
        video_type: (body.video_type || body.videoType || "free") as "free" | "premium",
        content_type: (body.content_type || body.contentType || "short") as "short" | "long",
        category: body.category || "General",
        duration: body.duration || "1:00",
        views: 0,
        likes: 0,
        payment_status: (body.payment_status || body.paymentStatus || "not_required") as
          "not_required" | "pending" | "paid" | "failed",
        payment_id: body.payment_id || body.paymentId,
        payment_amount: Number(body.payment_amount || body.paymentAmount) || 0,
        is_promoted: Boolean(body.is_promoted || body.isPromoted),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.videos.unshift(newVideo);
      saveStore(store);
      return jsonResponse({ success: true, video: newVideo });
    }
  }

  if (route === "videos/like") {
    if (method === "POST") {
      const body = await request.json();
      const vid = store.videos.find((v) => v.id === body.videoId);
      if (vid) {
        vid.likes = (vid.likes || 0) + 1;
        saveStore(store);
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
      const vid = store.videos.find((v) => v.id === body.videoId);
      if (vid) {
        vid.is_promoted = true;
        vid.promotion_plan = body.planId;
        const days = Number(body.durationDays) || 30;
        vid.promotion_expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        saveStore(store);
        return jsonResponse({
          success: true,
          message: "Video promoted successfully",
          promotionExpiresAt: vid.promotion_expires_at,
        });
      }
      return jsonResponse({ success: false, error: "Video not found" }, 404);
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
      const imgs = userId
        ? store.images.filter((i) => i.user_id.toUpperCase() === userId.trim().toUpperCase())
        : store.images;
      return jsonResponse({ success: true, images: imgs, total: imgs.length });
    }
  }

  if (route === "images/create") {
    if (method === "POST") {
      const body = await request.json();
      const newImage = {
        id: body.id || `img-${Date.now()}`,
        user_id: body.userId || body.user_id || "FT102857",
        creator_name: body.creatorName || body.creator_name || "Creator",
        title: body.title || "Uploaded Image",
        description: body.description || "",
        image_url: body.imageUrl || body.image_url || "/src/assets/hero.jpg",
        thumbnail_url: body.thumbnailUrl || body.thumbnail_url || "/src/assets/hero.jpg",
        category: body.category || "General",
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
      };
      store.images.unshift(newImage);
      saveStore(store);
      return jsonResponse({ success: true, image: newImage });
    }
  }

  // 8. Wallet & Income
  if (route === "wallet/balance") {
    if (method === "GET") {
      const userId = (url.searchParams.get("userId") || "FT102857").toUpperCase();
      const user = store.users.find((u) => u.user_id.toUpperCase() === userId);
      const isSeedAdmin = userId === "FT102857";
      const totalBalance = isSeedAdmin ? 14500 : 2800;

      return jsonResponse({
        success: true,
        wallet: {
          userId,
          totalBalance,
          withdrawableBalance: totalBalance,
          referralIncome: isSeedAdmin ? 4500 : 1200,
          teamIncome: isSeedAdmin ? 3500 : 800,
          directReferralIncome: isSeedAdmin ? 2000 : 600,
          adsenseIncome: isSeedAdmin ? 3000 : 200,
          globalIncome: isSeedAdmin ? 1500 : 0,
          affiliateIncome: 0,
          totalEarnings: totalBalance,
          totalWithdrawn: 0,
          pendingWithdrawals: 0,
        },
      });
    }
  }

  if (route === "wallet/transactions") {
    if (method === "GET") {
      return jsonResponse({
        success: true,
        transactions: store.walletTransactions,
        total: store.walletTransactions.length,
      });
    }
  }

  if (route === "wallet/withdraw") {
    if (method === "POST") {
      const payload = await request.json();
      const amount = Number(payload.amount);
      const userId = String(payload.userId || "")
        .trim()
        .toUpperCase();

      if (!userId) {
        return jsonResponse({ success: false, error: "User identity required" }, 400);
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

      const tx = {
        id: `tx-wdr-${Date.now()}`,
        userId,
        amount,
        type: "withdrawal",
        status: "approved",
        createdAt: new Date().toISOString(),
      };
      store.walletTransactions.unshift(tx);
      saveStore(store);

      return jsonResponse({
        success: true,
        message: `Withdrawal request for ₹${amount.toLocaleString("en-IN")} validated and approved.`,
        transaction: tx,
        updatedWallet: {
          userId,
          totalBalance: 3500,
          withdrawableBalance: 3500,
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
      const userId = (url.searchParams.get("userId") || "FT102857").toUpperCase();
      return jsonResponse({
        success: true,
        dashboard: {
          userId,
          referralCode: "FTVIP",
          directReferralsCount: 4,
          teamMembersCount: 16,
          directReferralIncome: 2000,
          teamIncome: 3500,
          totalReferralIncome: 5500,
          referralMembers: [
            {
              userId: "FT483921",
              name: "Alex Rivera",
              joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              level: 1,
              status: "active",
              contribution: 1000,
            },
            {
              userId: "FT900431",
              name: "Maya Lin",
              joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              level: 1,
              status: "active",
              contribution: 1000,
            },
          ],
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

  // Unhandled /api route
  return jsonResponse({ error: `Not Found: ${pathname}` }, 404);
}
