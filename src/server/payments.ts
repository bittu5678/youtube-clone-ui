import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * FaceTube Monetization & Pricing Constants
 */
export const PRICING_CONFIG = {
  PREMIUM_VIDEO: {
    BASE_PRICE: 5.0, // ₹5 base price
    GST_RATE: 0.18, // 18% GST (₹0.90)
    PG_CHARGE_RATE: 0.02, // 2% PG Charge (₹0.10)
    TOTAL_PRICE: 6.0, // ₹6 total deduction
    REFERRAL_SHARE: 1.0, // ₹1 to direct referrer
    NORMAL_ADMIN_SHARE: 1.0, // ₹1 to admin / company on normal tx
    SPECIAL_ADMIN_SHARE: 4.0, // ₹4 to admin on SPECIAL tx (11th, 21st, 31st...)
    NORMAL_GLOBAL_POOL_SHARE: 3.0, // ₹3 to global income pool on normal tx
    SPECIAL_GLOBAL_POOL_SHARE: 0.0, // ₹0 to global pool on SPECIAL tx
    TAX_AND_FEES: 1.0, // ₹0.90 GST + ₹0.10 PG fee = ₹1.00
  },
  ADS_PROMOTION: {
    "plan-7-days": { days: 7, price: 100, label: "7 Days" },
    "plan-15-days": { days: 15, price: 200, label: "15 Days" },
    "plan-monthly": { days: 30, price: 300, label: "1 Month" },
    "plan-yearly": { days: 365, price: 3000, label: "1 Year" },
  },
} as const;

export type AdsPlanId = keyof typeof PRICING_CONFIG.ADS_PROMOTION;

/**
 * Task 33: 7-Level Ads Promotion Referral Commission Rates
 * Level 1: 15%
 * Level 2: 10%
 * Level 3: 5%
 * Level 4: 4%
 * Level 5: 3%
 * Level 6: 2%
 * Level 7: 1%
 * Total Referral = 40% (when all 7 valid uplines exist)
 * Base Admin Share = 60%
 * Missing level percentages dynamically redirect to Admin.
 */
export const ADS_REFERRAL_RATES = [
  { level: 1, percent: 15, rate: 0.15 },
  { level: 2, percent: 10, rate: 0.1 },
  { level: 3, percent: 5, rate: 0.05 },
  { level: 4, percent: 4, rate: 0.04 },
  { level: 5, percent: 3, rate: 0.03 },
  { level: 6, percent: 2, rate: 0.02 },
  { level: 7, percent: 1, rate: 0.01 },
] as const;

export interface AdsUplineSponsor {
  level: number;
  userId: string;
  name?: string | undefined;
}

export interface AdsLevelPayout {
  level: number;
  ratePercent: number;
  userId: string;
  name?: string | undefined;
  amount: number;
  amountPaise: number;
}

export interface AdsDistributionResult {
  planAmount: number;
  totalPaise: number;
  totalReferralAmount: number;
  totalReferralPaise: number;
  adminAmount: number;
  adminPaise: number;
  adminPercent: number;
  levelPayouts: AdsLevelPayout[];
  missingLevels: number[];
}

/**
 * Pure evaluation helper for 7-level Ads referral allocation.
 * Uses integer paise to ensure that the sum of level payouts and Admin remainder
 * strictly equals the exact plan amount with zero rounding loss.
 */
export function evaluateAdsDistribution(
  planAmount: number,
  uplines: (AdsUplineSponsor | { level: number; userId: string; name?: string | undefined })[] = [],
): AdsDistributionResult {
  const totalPaise = Math.round(planAmount * 100);
  const uplineMap = new Map<number, { userId: string; name?: string | undefined }>();
  for (const up of uplines) {
    if (up.level >= 1 && up.level <= 7 && up.userId && !uplineMap.has(up.level)) {
      uplineMap.set(up.level, { userId: up.userId, name: up.name });
    }
  }

  const levelPayouts: AdsLevelPayout[] = [];
  const missingLevels: number[] = [];
  let allocatedPaise = 0;

  for (const tier of ADS_REFERRAL_RATES) {
    const sponsor = uplineMap.get(tier.level);
    if (sponsor) {
      const commPaise = Math.round(totalPaise * (tier.percent / 100));
      allocatedPaise += commPaise;
      levelPayouts.push({
        level: tier.level,
        ratePercent: tier.percent,
        userId: sponsor.userId,
        name: sponsor.name,
        amount: commPaise / 100,
        amountPaise: commPaise,
      });
    } else {
      missingLevels.push(tier.level);
    }
  }

  // Admin allocation is the exact mathematical remainder of total minus all allocated sponsor shares
  const adminPaise = totalPaise - allocatedPaise;
  const adminAmount = adminPaise / 100;
  const totalReferralPaise = allocatedPaise;
  const totalReferralAmount = totalReferralPaise / 100;
  const adminPercent = Math.round((adminPaise / totalPaise) * 100);

  return {
    planAmount,
    totalPaise,
    totalReferralAmount,
    totalReferralPaise,
    adminAmount,
    adminPaise,
    adminPercent,
    levelPayouts,
    missingLevels,
  };
}

/**
 * Resolves up to 7 distinct valid upline sponsors using referral relationships.
 * Implements strict cycle detection and self-referral prevention.
 */
export function resolveUplineSponsors(
  uploaderUserId: string,
  users: Array<{
    user_id: string;
    referral_code?: string | null | undefined;
    name?: string | undefined;
  }>,
): AdsUplineSponsor[] {
  const normUploader = uploaderUserId.trim().toUpperCase();
  const visited = new Set<string>([normUploader]);
  const uplines: AdsUplineSponsor[] = [];

  let currentUserId = normUploader;

  for (let level = 1; level <= 7; level++) {
    const currentUser = users.find((u) => u.user_id.toUpperCase() === currentUserId);
    if (!currentUser || !currentUser.referral_code) break;

    const refCode = currentUser.referral_code.trim().toUpperCase();
    if (!refCode) break;

    const sponsor = users.find(
      (u) =>
        (u.user_id.toUpperCase() === refCode || u.referral_code?.toUpperCase() === refCode) &&
        u.user_id.toUpperCase() !== currentUserId,
    );

    if (!sponsor) break;

    const sponsorNormId = sponsor.user_id.toUpperCase();
    if (visited.has(sponsorNormId)) {
      // Loop or repeated sponsor detected — safely terminate chain
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

/**
 * Checks if a premium transaction sequence number is a Special Transaction:
 * 11th, 21st, 31st, 41st, 51st... and every 10th transaction after 11th.
 *
 * Formula:
 * transactionNumber >= 11 AND (transactionNumber - 11) % 10 === 0
 */
export function isSpecialGlobalTransaction(txNumber: number): boolean {
  if (txNumber < 11) return false;
  return (txNumber - 11) % 10 === 0;
}

/**
 * Calculates creator pool payouts weighted by each creator's actual video ad earnings.
 * If total ad earnings > 0, each creator receives floor(300 * (earnings_i / total_earnings)) paise.
 * Residual indivisible paise from floor division is safely redirected to Admin ledger (zero leakage).
 * If total ad earnings == 0, falls back gracefully to equal integer division floor(300 / N).
 */
export function calculateWeightedPoolPayouts(
  poolPaise: number,
  creators: Array<{ userId: string; videoId?: string; adEarnings: number }>,
): {
  payouts: Array<{
    userId: string;
    videoId?: string;
    amountPaise: number;
    amount: number;
    weight: number;
  }>;
  distributedPaise: number;
  residualPaise: number;
} {
  if (!creators || creators.length === 0) {
    return { payouts: [], distributedPaise: 0, residualPaise: poolPaise };
  }

  const totalAdEarnings = creators.reduce((sum, c) => sum + Math.max(0, c.adEarnings || 0), 0);

  if (totalAdEarnings <= 0) {
    const perCreatorPaise = Math.floor(poolPaise / creators.length);
    const distributedPaise = perCreatorPaise * creators.length;
    const residualPaise = poolPaise - distributedPaise;
    return {
      payouts: creators.map((c) => ({
        userId: c.userId,
        videoId: c.videoId,
        amountPaise: perCreatorPaise,
        amount: perCreatorPaise / 100,
        weight: 1 / creators.length,
      })),
      distributedPaise,
      residualPaise,
    };
  }

  let totalAllocated = 0;
  const payouts = creators.map((c) => {
    const earnings = Math.max(0, c.adEarnings || 0);
    const weight = earnings / totalAdEarnings;
    const amountPaise = Math.floor(weight * poolPaise);
    totalAllocated += amountPaise;
    return {
      userId: c.userId,
      videoId: c.videoId,
      amountPaise,
      amount: amountPaise / 100,
      weight,
    };
  });

  const residualPaise = Math.max(0, poolPaise - totalAllocated);

  return {
    payouts,
    distributedPaise: totalAllocated,
    residualPaise,
  };
}

/**
 * Pure evaluation helper for test & verification of distributions across any transaction number.
 * Supports both equal division and actual ad-earnings-weighted pool distribution (Requirement 9).
 */
export function evaluatePremiumDistribution(
  txNumber: number,
  referrerId?: string | null,
  eligibleCreatorsCount = 1,
  creatorEarnings?: Array<{ userId: string; videoId?: string; adEarnings: number }>,
): {
  txNumber: number;
  isSpecial: boolean;
  specialTag: "SPECIAL_GLOBAL_RULE" | "NORMAL_PREMIUM";
  directReferralAmount: number;
  adminAmount: number;
  globalPoolAmount: number;
  taxAndFees: number;
  totalAmount: number;
  eligibleMembersCount: number;
  perMemberShare: number;
  weightedPayouts?: Array<{
    userId: string;
    videoId?: string;
    amountPaise: number;
    amount: number;
    weight: number;
  }>;
} {
  const isSpecial = isSpecialGlobalTransaction(txNumber);
  const hasValidReferrer = Boolean(referrerId && referrerId.trim().length > 0);
  const directReferralAmount = hasValidReferrer ? PRICING_CONFIG.PREMIUM_VIDEO.REFERRAL_SHARE : 0.0;
  const unallocatedReferrerPaise = hasValidReferrer ? 0 : 100; // Option A: ₹1 redirected to Admin if no valid referrer

  let adminAmount = 0.0;
  let globalPoolAmount = 0.0;
  let perMemberShare = 0.0;
  let weightedPayouts:
    Array<{ userId: string; amountPaise: number; amount: number; weight: number }> | undefined =
    undefined;

  if (isSpecial) {
    // Special: ₹4 Admin + ₹1 (if no referrer redirected to Admin) = ₹4 or ₹5
    adminAmount = hasValidReferrer
      ? PRICING_CONFIG.PREMIUM_VIDEO.SPECIAL_ADMIN_SHARE // ₹4.00
      : PRICING_CONFIG.PREMIUM_VIDEO.SPECIAL_ADMIN_SHARE + 1.0; // ₹5.00
    globalPoolAmount = 0.0;
    perMemberShare = 0.0;
  } else {
    // Normal: Base Admin = ₹1.00 (+ ₹1.00 unallocated referrer if no referrer)
    const baseAdminPaise = 100 + unallocatedReferrerPaise;

    if (creatorEarnings && creatorEarnings.length > 0) {
      const poolPaise = 300;
      const weighted = calculateWeightedPoolPayouts(poolPaise, creatorEarnings);
      adminAmount = (baseAdminPaise + weighted.residualPaise) / 100;
      globalPoolAmount = weighted.distributedPaise / 100;
      perMemberShare = weighted.payouts.length > 0 ? weighted.payouts[0]?.amount || 0 : 0;
      weightedPayouts = weighted.payouts;
    } else if (eligibleCreatorsCount <= 0) {
      // First transaction / no eligible creators: redirect entire ₹3 pool to Admin
      adminAmount = (baseAdminPaise + 300) / 100;
      globalPoolAmount = 0.0;
      perMemberShare = 0.0;
    } else {
      const poolPaise = 300;
      const perCreatorPaise = Math.floor(poolPaise / eligibleCreatorsCount);
      const distributedPaise = perCreatorPaise * eligibleCreatorsCount;
      const residualPaise = poolPaise - distributedPaise;

      adminAmount = (baseAdminPaise + residualPaise) / 100;
      globalPoolAmount = distributedPaise / 100;
      perMemberShare = perCreatorPaise / 100;
    }
  }

  const result: {
    txNumber: number;
    isSpecial: boolean;
    specialTag: "SPECIAL_GLOBAL_RULE" | "NORMAL_PREMIUM";
    directReferralAmount: number;
    adminAmount: number;
    globalPoolAmount: number;
    taxAndFees: number;
    totalAmount: number;
    eligibleMembersCount: number;
    perMemberShare: number;
    weightedPayouts?: Array<{
      userId: string;
      amountPaise: number;
      amount: number;
      weight: number;
    }>;
  } = {
    txNumber,
    isSpecial,
    specialTag: isSpecial ? "SPECIAL_GLOBAL_RULE" : "NORMAL_PREMIUM",
    directReferralAmount,
    adminAmount,
    globalPoolAmount,
    taxAndFees: PRICING_CONFIG.PREMIUM_VIDEO.TAX_AND_FEES, // ₹1.00
    totalAmount: PRICING_CONFIG.PREMIUM_VIDEO.TOTAL_PRICE, // ₹6.00
    eligibleMembersCount: isSpecial
      ? 0
      : creatorEarnings
        ? creatorEarnings.length
        : eligibleCreatorsCount,
    perMemberShare,
  };

  if (weightedPayouts) {
    result.weightedPayouts = weightedPayouts;
  }

  return result;
}

export interface PersistentPremiumTxRecord {
  txNumber: number;
  paymentId: string;
  orderId: string;
  videoId: string;
  userId: string;
  userName?: string;
  referrerId: string | null;
  amount: number;
  transactionType: "premium_upload" | "ads_promotion";
  isSpecial: boolean;
  specialTag: "SPECIAL_GLOBAL_RULE" | "NORMAL_PREMIUM" | "ADS_PROMOTION";
  referralCommission: number;
  adminAllocation: number;
  globalPoolAllocation: number;
  createdAt: string;
}

interface PersistentPremiumState {
  lastTxNumber: number;
  transactions: PersistentPremiumTxRecord[];
}

// Persistent Storage Configuration
const DATA_DIR = path.resolve(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "premium_transactions.json");

// Mutex lock for atomic sequence generation and duplicate prevention
let sequenceMutex = Promise.resolve();

function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const result = sequenceMutex.then(fn, fn);
  sequenceMutex = result.then(
    () => {},
    () => {},
  );
  return result;
}

/**
 * Initializes or loads the persistent transaction state from disk/database.
 * Ensures the sequence starts with historical records 1..10, so the next transaction is #11.
 */
function loadPersistentState(): PersistentPremiumState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (typeof parsed?.lastTxNumber === "number" && Array.isArray(parsed?.transactions)) {
        return parsed as PersistentPremiumState;
      }
    }
  } catch (err) {
    console.warn("[Payments Server] Failed to read persistent state file, creating default:", err);
  }

  // Initial historical baseline: 10 prior settled premium transactions (1 to 10)
  const initialTransactions: PersistentPremiumTxRecord[] = [];
  const baseTime = Date.now() - 10 * 3600 * 1000;

  for (let i = 1; i <= 10; i++) {
    const isSpec = isSpecialGlobalTransaction(i);
    initialTransactions.push({
      txNumber: i,
      paymentId: `pay_seed_hist_${1000 + i}`,
      orderId: `order_seed_hist_${1000 + i}`,
      videoId: `vid_seed_${i}`,
      userId: i % 2 === 0 ? "FT483921" : "FT900431",
      userName: i % 2 === 0 ? "Alex Rivera" : "Maya Lin",
      referrerId: "FT102857",
      amount: 6.0,
      transactionType: "premium_upload",
      isSpecial: isSpec,
      specialTag: isSpec ? "SPECIAL_GLOBAL_RULE" : "NORMAL_PREMIUM",
      referralCommission: 1.0,
      adminAllocation: isSpec ? 4.0 : 1.0,
      globalPoolAllocation: isSpec ? 0.0 : 3.0,
      createdAt: new Date(baseTime + i * 3600 * 1000).toISOString(),
    });
  }

  const defaultState: PersistentPremiumState = {
    lastTxNumber: 10,
    transactions: initialTransactions,
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Payments Server] Could not write initial state file:", err);
  }

  return defaultState;
}

function savePersistentState(state: PersistentPremiumState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${STATE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf-8");
    fs.renameSync(tempFile, STATE_FILE);
  } catch (err) {
    console.error("[Payments Server] Error saving persistent state:", err);
  }
}

/**
 * Returns current persistent sequence number.
 */
export async function getPersistentPremiumTxNumber(): Promise<number> {
  return withLock(() => {
    const state = loadPersistentState();
    return state.lastTxNumber;
  });
}

/**
 * Returns all recorded persistent premium transactions.
 */
export async function getPersistentTransactions(): Promise<PersistentPremiumTxRecord[]> {
  return withLock(() => {
    const state = loadPersistentState();
    return [...state.transactions];
  });
}

/**
 * Resets the persistent transaction sequence and transaction list (for isolated testing).
 */
export async function resetPersistentPremiumState(
  txNumber = 0,
  transactions: PersistentPremiumTxRecord[] = [],
): Promise<void> {
  return withLock(() => {
    savePersistentState({
      lastTxNumber: txNumber,
      transactions,
    });
  });
}

export interface PaymentOrderRequest {
  purpose: "premium_video_upload" | "ads_promotion";
  userId: string;
  userName?: string;
  videoId?: string;
  contentType?: "short" | "long";
  planId?: AdsPlanId;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number; // in INR rupees
  amountInSubunits: number; // in paise (e.g. 600 for ₹6)
  currency: "INR";
  purpose: string;
  keyId: string;
  isSandbox: boolean;
  metadata: Record<string, unknown>;
}

export interface PaymentVerifyRequest {
  orderId: string;
  paymentId: string;
  signature?: string;
  userId: string;
  videoId?: string;
  userName?: string;
  purpose: "premium_video_upload" | "ads_promotion";
  planId?: AdsPlanId | string;
  referrerUserId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PaymentVerifyResult {
  verified: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  purpose: string;
  txNumber?: number;
  isSpecialTransaction?: boolean;
  specialTag?: "SPECIAL_GLOBAL_RULE" | "NORMAL_PREMIUM" | "ADS_PROMOTION";
  distribution?: {
    directReferralAmount: number;
    referrerId?: string | null;
    adminAmount: number;
    adminPercent?: number;
    globalPoolAmount: number;
    eligibleMembersCount: number;
    perMemberShare: number;
    creatorPayouts?: Array<{
      userId: string;
      videoId?: string;
      amount: number;
      amountPaise: number;
    }>;
    totalReferralAmount?: number;
    levelPayouts?: AdsLevelPayout[];
    missingLevels?: number[];
  };
  duplicate?: boolean;
  error?: string;
}

/**
 * Creates a server-side payment order (compatible with Razorpay Test Mode)
 */
function sanitizeSecret(val?: string | null): string {
  if (!val) return "";
  return String(val)
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

/**
 * Creates a server-side payment order with Razorpay Orders API
 * Fails closed if real credentials are not configured in environment variables.
 */
export async function createServerPaymentOrder(
  req: PaymentOrderRequest,
  env?: Record<string, string | undefined>,
): Promise<PaymentOrderResult> {
  let amount = 0;

  if (req.purpose === "premium_video_upload") {
    amount = PRICING_CONFIG.PREMIUM_VIDEO.TOTAL_PRICE; // ₹6
  } else if (req.purpose === "ads_promotion") {
    const plan = req.planId ? PRICING_CONFIG.ADS_PROMOTION[req.planId] : undefined;
    amount = plan ? plan.price : PRICING_CONFIG.ADS_PROMOTION["plan-monthly"].price;
  }

  const keyId = sanitizeSecret(env?.["RAZORPAY_KEY_ID"] || process.env["RAZORPAY_KEY_ID"]);
  const keySecret = sanitizeSecret(
    env?.["RAZORPAY_KEY_SECRET"] || process.env["RAZORPAY_KEY_SECRET"],
  );

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured on the server. Real payments cannot be initiated until valid credentials are provided.",
    );
  }

  const amountInSubunits = Math.round(amount * 100);

  // If running in a test suite where live calls are bypassed
  const skipRemote = Boolean(
    env?.["RAZORPAY_SKIP_REMOTE_CHECK"] || process.env["RAZORPAY_SKIP_REMOTE_CHECK"],
  );

  let orderId: string;
  if (skipRemote) {
    orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  } else {
    try {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInSubunits,
          currency: "INR",
          receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          notes: {
            purpose: req.purpose,
            userId: req.userId,
            userName: req.userName || "Creator",
            videoId: req.videoId || "",
            planId: req.planId || "",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Razorpay API responded with ${response.status}: ${errorText}`);
      }

      const orderData = (await response.json()) as { id: string };
      orderId = orderData.id;
    } catch (err: any) {
      throw new Error(`Failed to create Razorpay order: ${err?.message || "Gateway error"}`);
    }
  }

  return {
    orderId,
    amount,
    amountInSubunits,
    currency: "INR",
    purpose: req.purpose,
    keyId,
    isSandbox: keyId.startsWith("rzp_test_"),
    metadata: {
      userId: req.userId,
      userName: req.userName,
      videoId: req.videoId,
      contentType: req.contentType,
      planId: req.planId,
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Server-side payment verification and distribution logic with atomic, persistent transaction sequence.
 * 1. Checks RAZORPAY_KEY_SECRET and strictly fails closed if missing.
 * 2. Rejects mock signatures or bypass tokens.
 * 3. Verifies cryptographic HMAC-SHA256 signature.
 * 4. Confirms payment status and amount with Razorpay API (GET /v1/payments/{paymentId}).
 * 5. Deduplicates under lock to prevent double crediting.
 */
export async function verifyServerPayment(
  req: PaymentVerifyRequest,
  eligiblePremiumCreatorIds: Array<
    string | { userId: string; videoId?: string; adEarnings?: number }
  > = [],
  referrerUserId?: string | null,
  env?: Record<string, string | undefined>,
  uplines?: AdsUplineSponsor[],
): Promise<PaymentVerifyResult> {
  const keyId = sanitizeSecret(env?.["RAZORPAY_KEY_ID"] || process.env["RAZORPAY_KEY_ID"]);
  const secretKey = sanitizeSecret(
    env?.["RAZORPAY_KEY_SECRET"] || process.env["RAZORPAY_KEY_SECRET"],
  );

  // Strictly fail closed if secret key is missing
  if (!secretKey) {
    return {
      verified: false,
      paymentId: req.paymentId,
      orderId: req.orderId,
      amount: 0,
      purpose: req.purpose,
      error:
        "Payment verification failed closed: RAZORPAY_KEY_SECRET is not configured on the server",
    };
  }

  if (
    !req.signature ||
    req.signature === "mock_signature_bypass" ||
    req.signature.startsWith("mock_")
  ) {
    return {
      verified: false,
      paymentId: req.paymentId,
      orderId: req.orderId,
      amount: 0,
      purpose: req.purpose,
      error: "Payment signature missing or invalid mock signature rejected",
    };
  }

  // 1. Cryptographic HMAC signature check
  try {
    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(`${req.orderId}|${req.paymentId}`)
      .digest("hex");

    if (generatedSignature !== req.signature) {
      return {
        verified: false,
        paymentId: req.paymentId,
        orderId: req.orderId,
        amount: 0,
        purpose: req.purpose,
        error: "Invalid Razorpay payment signature verification failed",
      };
    }
  } catch (err: any) {
    return {
      verified: false,
      paymentId: req.paymentId,
      orderId: req.orderId,
      amount: 0,
      purpose: req.purpose,
      error: `Signature calculation error: ${err?.message || "Unknown error"}`,
    };
  }

  // Determine expected amount in subunits
  const rawPlanId = (req.planId || req.metadata?.["planId"] || "plan-monthly") as AdsPlanId;
  const expectedAmount =
    req.purpose === "premium_video_upload"
      ? PRICING_CONFIG.PREMIUM_VIDEO.TOTAL_PRICE // ₹6.00
      : PRICING_CONFIG.ADS_PROMOTION[rawPlanId]?.price || 300;
  const expectedPaise = Math.round(expectedAmount * 100);

  // 2. Real Razorpay API Confirmation
  const skipRemote = Boolean(
    env?.["RAZORPAY_SKIP_REMOTE_CHECK"] || process.env["RAZORPAY_SKIP_REMOTE_CHECK"],
  );

  if (keyId && !skipRemote) {
    try {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${secretKey}`).toString("base64")}`;
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${req.paymentId}`, {
        method: "GET",
        headers: { Authorization: authHeader },
      });

      if (!rzpRes.ok) {
        const errText = await rzpRes.text();
        return {
          verified: false,
          paymentId: req.paymentId,
          orderId: req.orderId,
          amount: 0,
          purpose: req.purpose,
          error: `Razorpay payment confirmation failed with status ${rzpRes.status}: ${errText}`,
        };
      }

      const pData = (await rzpRes.json()) as {
        id: string;
        order_id: string;
        status: string;
        amount: number;
        currency: string;
      };

      if (pData.order_id && pData.order_id !== req.orderId) {
        return {
          verified: false,
          paymentId: req.paymentId,
          orderId: req.orderId,
          amount: 0,
          purpose: req.purpose,
          error: `Razorpay payment order mismatch (expected ${req.orderId}, received ${pData.order_id})`,
        };
      }

      if (pData.amount !== expectedPaise) {
        return {
          verified: false,
          paymentId: req.paymentId,
          orderId: req.orderId,
          amount: 0,
          purpose: req.purpose,
          error: `Razorpay payment amount mismatch: expected ₹${expectedAmount}, got ₹${pData.amount / 100}`,
        };
      }

      if (pData.currency !== "INR") {
        return {
          verified: false,
          paymentId: req.paymentId,
          orderId: req.orderId,
          amount: 0,
          purpose: req.purpose,
          error: `Razorpay payment currency mismatch: expected INR, received ${pData.currency}`,
        };
      }

      if (pData.status !== "captured" && pData.status !== "authorized") {
        return {
          verified: false,
          paymentId: req.paymentId,
          orderId: req.orderId,
          amount: 0,
          purpose: req.purpose,
          error: `Razorpay payment status is not successful (status: ${pData.status})`,
        };
      }

      // If authorized, auto-capture to settle
      if (pData.status === "authorized") {
        const capRes = await fetch(
          `https://api.razorpay.com/v1/payments/${req.paymentId}/capture`,
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
          return {
            verified: false,
            paymentId: req.paymentId,
            orderId: req.orderId,
            amount: 0,
            purpose: req.purpose,
            error: `Failed to capture authorized Razorpay payment: ${capErr}`,
          };
        }
      }
    } catch (fetchErr: any) {
      return {
        verified: false,
        paymentId: req.paymentId,
        orderId: req.orderId,
        amount: 0,
        purpose: req.purpose,
        error: `Razorpay remote API connection error: ${fetchErr?.message || "Network error"}`,
      };
    }
  }

  // Atomic critical section for sequence allocation & duplicate prevention
  return withLock(async () => {
    const state = loadPersistentState();

    // 1. DUPLICATE CHECK: Prevent duplicate processing of the same Razorpay payment
    const existingTx = state.transactions.find((t) => t.paymentId === req.paymentId);
    if (existingTx) {
      const isAds =
        existingTx.specialTag === "ADS_PROMOTION" ||
        existingTx.transactionType === "ads_promotion" ||
        req.purpose === "ads_promotion";
      const isSpec = isAds ? false : existingTx.isSpecial;
      const eligibleCount = Math.max(1, eligiblePremiumCreatorIds.length);
      const perMemberShare =
        isSpec || isAds ? 0 : Number((existingTx.globalPoolAllocation / eligibleCount).toFixed(4));

      return {
        verified: true,
        paymentId: existingTx.paymentId,
        orderId: existingTx.orderId,
        amount: existingTx.amount,
        purpose: isAds ? "ads_promotion" : existingTx.transactionType,
        txNumber: isAds ? 0 : existingTx.txNumber,
        isSpecialTransaction: isSpec,
        specialTag: existingTx.specialTag,
        distribution: {
          directReferralAmount: existingTx.referralCommission,
          referrerId: existingTx.referrerId,
          adminAmount: existingTx.adminAllocation,
          globalPoolAmount: existingTx.globalPoolAllocation,
          eligibleMembersCount: isSpec || isAds ? 0 : eligibleCount,
          perMemberShare,
          totalReferralAmount: existingTx.referralCommission,
        },
        duplicate: true,
        error: "Payment has already been processed (idempotent duplicate request)",
      };
    }

    // 2. PREMIUM VIDEO UPLOAD PROCESSING
    if (req.purpose === "premium_video_upload") {
      // Increment global sequence persistently: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12...
      state.lastTxNumber += 1;
      const currentTxNumber = state.lastTxNumber;

      // Special Transaction Formula:
      // transactionNumber >= 11 AND (transactionNumber - 11) % 10 === 0
      const isSpecial = isSpecialGlobalTransaction(currentTxNumber);

      const refId = (referrerUserId || req.referrerUserId || null)?.trim().toUpperCase() || null;
      const hasValidReferrer = Boolean(refId && refId.length > 0);

      // Option A Approved Allocation:
      // If valid referrer: ₹1.00 to referrer
      // If NO valid referrer: unallocated ₹1.00 redirects to Admin
      const referralCommission = hasValidReferrer
        ? PRICING_CONFIG.PREMIUM_VIDEO.REFERRAL_SHARE
        : 0.0;
      const unallocatedReferrerPaise = hasValidReferrer ? 0 : 100;

      // Filter eligible previous videos / creators: strictly exclude current uploader and deduplicate
      const uploaderNorm = req.userId.trim().toUpperCase();
      const eligibleItems: Array<{ userId: string; videoId?: string; adEarnings: number }> = [];
      const seenCreatorKeys = new Set<string>();
      for (const item of eligiblePremiumCreatorIds) {
        if (typeof item === "string") {
          const norm = item.trim().toUpperCase();
          if (norm.length > 0 && norm !== uploaderNorm && !seenCreatorKeys.has(norm)) {
            seenCreatorKeys.add(norm);
            eligibleItems.push({ userId: norm, adEarnings: 0 });
          }
        } else if (item && typeof item === "object") {
          const norm = String(item.userId || "")
            .trim()
            .toUpperCase();
          const key = item.videoId ? `${norm}:${item.videoId}` : norm;
          if (norm.length > 0 && norm !== uploaderNorm && !seenCreatorKeys.has(key)) {
            seenCreatorKeys.add(key);
            eligibleItems.push({
              userId: norm,
              videoId: item.videoId,
              adEarnings: Math.max(0, Number(item.adEarnings) || 0),
            });
          }
        }
      }
      const eligibleCount = eligibleItems.length;

      let adminAllocation = 0.0;
      let globalPoolAllocation = 0.0;
      let perMemberShare = 0.0;
      const creatorPayouts: Array<{
        userId: string;
        videoId?: string;
        amount: number;
        amountPaise: number;
      }> = [];

      if (isSpecial) {
        // Special: ₹4 Admin + ₹1 (if no referrer redirected to Admin) = ₹4 or ₹5
        adminAllocation = hasValidReferrer ? 4.0 : 5.0;
        globalPoolAllocation = 0.0;
      } else {
        // Normal: Base Admin = ₹1.00 (+ ₹1.00 unallocated referrer if no referrer)
        const baseAdminPaise = 100 + unallocatedReferrerPaise;

        if (eligibleCount === 0) {
          // First transaction or no previous eligible creators: redirect entire ₹3 pool to Admin
          const adminPaise = baseAdminPaise + 300;
          adminAllocation = adminPaise / 100;
          globalPoolAllocation = 0.0;
        } else {
          // Distribute 300 paise using per-video weighted Ads Earnings Share (zero leakage)
          const poolPaise = 300;
          const weighted = calculateWeightedPoolPayouts(poolPaise, eligibleItems);

          adminAllocation = (baseAdminPaise + weighted.residualPaise) / 100;
          globalPoolAllocation = weighted.distributedPaise / 100;
          perMemberShare = weighted.payouts.length > 0 ? weighted.payouts[0]!.amount : 0;

          for (const p of weighted.payouts) {
            creatorPayouts.push({
              userId: p.userId,
              videoId: p.videoId,
              amount: p.amount,
              amountPaise: p.amountPaise,
            });
          }
        }
      }

      const specialTag = isSpecial ? "SPECIAL_GLOBAL_RULE" : "NORMAL_PREMIUM";

      // Create persistent transaction record
      const record: PersistentPremiumTxRecord = {
        txNumber: currentTxNumber,
        paymentId: req.paymentId,
        orderId: req.orderId,
        videoId: req.videoId || req.metadata?.["videoId"]?.toString() || `vid_${Date.now()}`,
        userId: req.userId,
        userName: req.userName || req.metadata?.["userName"]?.toString() || "FaceTube Creator",
        referrerId: refId,
        amount: PRICING_CONFIG.PREMIUM_VIDEO.TOTAL_PRICE, // ₹6.00
        transactionType: "premium_upload",
        isSpecial,
        specialTag,
        referralCommission,
        adminAllocation,
        globalPoolAllocation,
        createdAt: new Date().toISOString(),
      };

      state.transactions.unshift(record);
      savePersistentState(state);

      return {
        verified: true,
        paymentId: req.paymentId,
        orderId: req.orderId,
        amount: PRICING_CONFIG.PREMIUM_VIDEO.TOTAL_PRICE,
        purpose: req.purpose,
        txNumber: currentTxNumber,
        isSpecialTransaction: isSpecial,
        specialTag,
        distribution: {
          directReferralAmount: referralCommission,
          referrerId: refId,
          adminAmount: adminAllocation,
          globalPoolAmount: globalPoolAllocation,
          eligibleMembersCount: isSpecial ? 0 : eligibleCount,
          perMemberShare,
          creatorPayouts,
          totalReferralAmount: referralCommission,
        },
      };
    }

    // 3. ADS PROMOTION PROCESSING (Task 33: 7-Level Referral Distribution)
    const plan =
      PRICING_CONFIG.ADS_PROMOTION[rawPlanId] || PRICING_CONFIG.ADS_PROMOTION["plan-monthly"];
    const amount = plan.price;
    const refId = (referrerUserId || req.referrerUserId || null)?.trim().toUpperCase() || null;

    // Use passed uplines if available, otherwise fallback to single direct sponsor if provided
    const effectiveUplines =
      uplines && uplines.length > 0 ? uplines : refId ? [{ level: 1, userId: refId }] : [];

    const dist = evaluateAdsDistribution(amount, effectiveUplines);

    // Create persistent transaction record for ads promotion to enforce idempotency
    // Note: txNumber remains unchanged because Ads promotions do NOT advance the ₹6 Premium Video sequence!
    const adsRecord: PersistentPremiumTxRecord = {
      txNumber: state.lastTxNumber,
      paymentId: req.paymentId,
      orderId: req.orderId,
      videoId: req.videoId || req.metadata?.["videoId"]?.toString() || "",
      userId: req.userId,
      userName: req.userName || req.metadata?.["userName"]?.toString() || "FaceTube Creator",
      referrerId: refId,
      amount,
      transactionType: "ads_promotion",
      isSpecial: false,
      specialTag: "ADS_PROMOTION",
      referralCommission: dist.totalReferralAmount,
      adminAllocation: dist.adminAmount,
      globalPoolAllocation: 0,
      createdAt: new Date().toISOString(),
    };

    state.transactions.unshift(adsRecord);
    savePersistentState(state);

    const directL1 = dist.levelPayouts.find((p) => p.level === 1);

    return {
      verified: true,
      paymentId: req.paymentId,
      orderId: req.orderId,
      amount,
      purpose: req.purpose,
      isSpecialTransaction: false,
      specialTag: "ADS_PROMOTION",
      distribution: {
        directReferralAmount: directL1 ? directL1.amount : 0,
        referrerId: directL1 ? directL1.userId : null,
        adminAmount: dist.adminAmount,
        adminPercent: dist.adminPercent,
        globalPoolAmount: 0,
        eligibleMembersCount: 0,
        perMemberShare: 0,
        totalReferralAmount: dist.totalReferralAmount,
        levelPayouts: dist.levelPayouts,
        missingLevels: dist.missingLevels,
      },
    };
  });
}

export { verifyServerPayment as verifyPayment };
