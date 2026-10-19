import { api } from "./api";
import { getStoredVideos } from "./video-service";

export type IncomeType =
  | "referral_income"
  | "direct_commission"
  | "global_income"
  | "admin_allocation"
  | "withdrawal"
  | "ads_promotion_fee";

export interface LedgerTransaction {
  id: string;
  transactionId: string;
  userId: string;
  sourceUserId?: string | undefined;
  sourceUserName?: string | undefined;
  videoId?: string | undefined;
  incomeType: IncomeType;
  amount: number;
  status: "settled" | "pending" | "failed";
  specialTag?: "SPECIAL_GLOBAL_RULE" | "SPECIAL_TRANSACTION" | undefined;
  description: string;
  createdAt: string;
}

export interface UserWallet {
  userId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  referralIncome: number;
  globalIncome: number;
  adsenseIncome: number;
  affiliateIncome: number;
  updatedAt: string;
}

const LOCAL_STORAGE_LEDGER_KEY = "facetube_income_ledger_v3";
const LOCAL_STORAGE_WALLETS_KEY = "facetube_user_wallets_v3";

// Initial empty ledger and wallet storage (real earnings fetched from backend)
const INITIAL_SEED_LEDGER: LedgerTransaction[] = [];

const INITIAL_SEED_WALLETS: Record<string, UserWallet> = {};

export function getStoredLedger(): LedgerTransaction[] {
  if (typeof window === "undefined") return INITIAL_SEED_LEDGER;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LEDGER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(LOCAL_STORAGE_LEDGER_KEY, JSON.stringify(INITIAL_SEED_LEDGER));
    return INITIAL_SEED_LEDGER;
  } catch {
    return INITIAL_SEED_LEDGER;
  }
}

export function saveStoredLedger(transactions: LedgerTransaction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_LEDGER_KEY, JSON.stringify(transactions));
  } catch {
    // quota
  }
}

export function getStoredWallets(): Record<string, UserWallet> {
  if (typeof window === "undefined") return INITIAL_SEED_WALLETS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WALLETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
    localStorage.setItem(LOCAL_STORAGE_WALLETS_KEY, JSON.stringify(INITIAL_SEED_WALLETS));
    return INITIAL_SEED_WALLETS;
  } catch {
    return INITIAL_SEED_WALLETS;
  }
}

export function saveStoredWallets(wallets: Record<string, UserWallet>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_WALLETS_KEY, JSON.stringify(wallets));
  } catch {
    // quota
  }
}

/**
 * Retrieves the wallet for a user
 */
export async function getUserWallet(userId: string): Promise<UserWallet> {
  const norm = userId.trim().toUpperCase();

  try {
    const res = await api.wallet.getBalance(norm);
    if (res && res.wallet) {
      const data = res.wallet;
      return {
        userId: data.user_id || data.userId || norm,
        balance: Number(data.balance) || 0,
        totalEarned: Number(data.total_earned || data.totalEarned) || 0,
        totalWithdrawn: Number(data.total_withdrawn || data.totalWithdrawn) || 0,
        referralIncome: Number(data.referral_income || data.referralIncome) || 0,
        globalIncome: Number(data.global_income || data.globalIncome) || 0,
        adsenseIncome: Number(data.adsense_income || data.adsenseIncome) || 0,
        affiliateIncome: Number(data.affiliate_income || data.affiliateIncome) || 0,
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
      };
    }
  } catch (_e) {
    // fallback to local cache
  }

  const wallets = getStoredWallets();
  if (wallets[norm]) {
    return wallets[norm];
  }

  // Create default wallet
  const newWallet: UserWallet = {
    userId: norm,
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    referralIncome: 0,
    globalIncome: 0,
    adsenseIncome: 0,
    affiliateIncome: 0,
    updatedAt: new Date().toISOString(),
  };
  wallets[norm] = newWallet;
  saveStoredWallets(wallets);
  return newWallet;
}

/**
 * Gets ledger transactions for a user
 */
export async function getUserLedger(userId?: string): Promise<LedgerTransaction[]> {
  try {
    const res = await api.wallet.getTransactions(userId);
    if (res && res.transactions && res.transactions.length > 0) {
      return res.transactions.map((d: any) => ({
        id: d.id,
        transactionId: d.transaction_id || d.transactionId,
        userId: d.user_id || d.userId,
        sourceUserId: d.source_user_id || d.sourceUserId || undefined,
        sourceUserName: d.source_user_name || d.sourceUserName || undefined,
        videoId: d.video_id || d.videoId || undefined,
        incomeType: (d.income_type || d.incomeType) as IncomeType,
        amount: Number(d.amount) || 0,
        status: d.status || "settled",
        specialTag: d.special_tag || d.specialTag || undefined,
        description: d.description || "",
        createdAt: d.created_at || d.createdAt,
      }));
    }
  } catch (_e) {
    // fallback to local cache
  }

  const all = getStoredLedger();
  if (userId) {
    const norm = userId.trim().toUpperCase();
    return all.filter((tx) => tx.userId.trim().toUpperCase() === norm);
  }
  return all;
}

/**
 * Requirement 8: Finds eligible users for Global Income distribution.
 * Only users who have uploaded at least one PREMIUM video are eligible.
 * Users who have uploaded only Free Videos are NOT eligible.
 */
export async function getEligibleGlobalIncomeUsers(): Promise<string[]> {
  const videos = getStoredVideos();
  const eligibleSet = new Set<string>();

  for (const v of videos) {
    if (
      v.videoType === "premium" &&
      (v.paymentStatus === "paid" || v.paymentStatus === "not_required")
    ) {
      eligibleSet.add(v.userId.trim().toUpperCase());
    }
  }

  return Array.from(eligibleSet);
}

/**
 * Checks if a premium transaction sequence number is a Special Transaction:
 * 11th, 21st, 31st, 41st, 51st... and every 10th transaction after 11th.
 * Formula: transactionNumber >= 11 AND (transactionNumber - 11) % 10 === 0
 */
export function isSpecialGlobalTransaction(txNumber: number): boolean {
  if (txNumber < 11) return false;
  return (txNumber - 11) % 10 === 0;
}

export interface PremiumDistributionParams {
  uploaderUserId: string;
  uploaderName: string;
  videoId: string;
  paymentId: string;
  txNumber?: number | undefined;
  directReferrerId?: string | null | undefined;
  isSpecialTransaction?: boolean | undefined;
  specialTag?: "SPECIAL_GLOBAL_RULE" | "NORMAL_PREMIUM" | string | undefined;
  adminAmount?: number | undefined;
}

export interface PremiumDistributionResult {
  referralTransaction?: LedgerTransaction | undefined;
  adminTransaction?: LedgerTransaction | undefined;
  specialAuditTransaction?: LedgerTransaction | undefined;
  globalTransactions: LedgerTransaction[];
  isSpecial: boolean;
  txNumber?: number | undefined;
}

/**
 * Processes premium video payment distribution (Referral + Admin + Global Pool)
 * - Normal: ₹1 Direct Referral, ₹1 Admin, ₹3 Global Income Pool, ₹1 GST/PG
 * - Special (11th, 21st, 31st...): ₹1 Direct Referral (if valid referrer), ₹4 Admin, ₹0 Global Pool
 */
export async function distributePremiumVideoIncome(
  params: PremiumDistributionParams,
): Promise<PremiumDistributionResult> {
  const ledger = getStoredLedger();
  const wallets = getStoredWallets();

  // Deduplication check: Prevent duplicate processing of the same Razorpay payment
  const duplicate = ledger.some(
    (t) =>
      (t.videoId === params.videoId && t.transactionId.includes(params.paymentId)) ||
      t.transactionId.endsWith(params.paymentId) ||
      t.transactionId === `TX_SPEC_${params.paymentId}` ||
      t.transactionId === `TX_REF_${params.paymentId}` ||
      t.transactionId === `TX_ADM_${params.paymentId}`,
  );
  if (duplicate) {
    const duplicateResult: PremiumDistributionResult = {
      globalTransactions: [],
      isSpecial: Boolean(params.isSpecialTransaction),
    };
    if (params.txNumber !== undefined) {
      duplicateResult.txNumber = params.txNumber;
    }
    return duplicateResult;
  }

  // Determine special transaction state
  const isSpecial =
    typeof params.isSpecialTransaction === "boolean"
      ? params.isSpecialTransaction
      : params.txNumber
        ? isSpecialGlobalTransaction(params.txNumber)
        : false;

  const txSeqLabel = params.txNumber ? `#${params.txNumber}` : "";

  let referralTransaction: LedgerTransaction | undefined;
  let specialAuditTransaction: LedgerTransaction | undefined;
  const globalTransactions: LedgerTransaction[] = [];

  // 1. Direct Referral Commission (₹1.00)
  // If uploader has a valid direct referrer: credit ₹1 to referrer
  // If no valid referrer: do NOT create fake referral recipient; record safely for audit
  const normalizedReferrerId = params.directReferrerId?.trim().toUpperCase() || null;
  if (normalizedReferrerId && normalizedReferrerId.length > 0) {
    const txId = `TX_REF_${params.paymentId}`;
    referralTransaction = {
      id: `ref-tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionId: txId,
      userId: normalizedReferrerId,
      sourceUserId: params.uploaderUserId,
      sourceUserName: params.uploaderName,
      videoId: params.videoId,
      incomeType: "referral_income",
      amount: 1.0, // ₹1
      status: "settled",
      description: `Direct Referral Commission (₹1) for Premium Video ${txSeqLabel} upload by ${params.uploaderName} (${params.uploaderUserId})`,
      createdAt: new Date().toISOString(),
    };
    ledger.unshift(referralTransaction);

    // Credit referrer wallet
    if (!wallets[normalizedReferrerId]) {
      wallets[normalizedReferrerId] = {
        userId: normalizedReferrerId,
        balance: 1.0,
        totalEarned: 1.0,
        totalWithdrawn: 0,
        referralIncome: 1.0,
        globalIncome: 0,
        adsenseIncome: 0,
        affiliateIncome: 0,
        updatedAt: new Date().toISOString(),
      };
    } else {
      wallets[normalizedReferrerId].balance += 1.0;
      wallets[normalizedReferrerId].totalEarned += 1.0;
      wallets[normalizedReferrerId].referralIncome += 1.0;
      wallets[normalizedReferrerId].updatedAt = new Date().toISOString();
    }
  }

  // 2. Admin Allocation
  // Special: ₹4 Admin | Normal: ₹1 Admin
  const adminAmount = isSpecial ? 4.0 : (params.adminAmount ?? 1.0);
  const adminTransaction: LedgerTransaction = {
    id: `adm-tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    transactionId: `TX_ADM_${params.paymentId}`,
    userId: "ADMIN",
    sourceUserId: params.uploaderUserId,
    sourceUserName: params.uploaderName,
    videoId: params.videoId,
    incomeType: "admin_allocation",
    amount: adminAmount,
    status: "settled",
    ...(isSpecial ? { specialTag: "SPECIAL_GLOBAL_RULE" as const } : {}),
    description: isSpecial
      ? `Special Premium Transaction ${txSeqLabel}: Admin Allocation (₹4) under rule SPECIAL_GLOBAL_RULE`
      : `Admin / Platform Share (₹1) for Premium Video ${txSeqLabel}`,
    createdAt: new Date().toISOString(),
  };
  ledger.unshift(adminTransaction);

  // 3. Global Income Pool
  if (isSpecial) {
    // SPECIAL TRANSACTION (11th, 21st, 31st, 41st...):
    // MUST NOT allocate normal ₹3 Global Income Pool!
    // Do NOT distribute ₹3 among eligible creators. Do NOT credit Global Income to ANY user.
    // Record clearly in audit ledger as SPECIAL_GLOBAL_RULE with amount 0.
    specialAuditTransaction = {
      id: `spec-tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionId: `TX_SPEC_${params.paymentId}`,
      userId: params.uploaderUserId,
      sourceUserId: params.uploaderUserId,
      sourceUserName: params.uploaderName,
      videoId: params.videoId,
      incomeType: "global_income",
      amount: 0.0,
      status: "settled",
      specialTag: "SPECIAL_GLOBAL_RULE",
      description: `Special Premium Transaction ${txSeqLabel}: Rule SPECIAL_GLOBAL_RULE applied (₹4 Admin, ₹0 Global Pool, standard pool distribution bypassed)`,
      createdAt: new Date().toISOString(),
    };
    ledger.unshift(specialAuditTransaction);
  } else {
    // NORMAL TRANSACTION:
    // Normal ₹3 Global Income Pool distributed equally to eligible creators (uploaded >= 1 premium video)
    const eligibleUsers = await getEligibleGlobalIncomeUsers();
    // Include current uploader if they just paid for premium video
    const normUploader = params.uploaderUserId.trim().toUpperCase();
    if (!eligibleUsers.includes(normUploader)) {
      eligibleUsers.push(normUploader);
    }

    const poolTotal = 3.0; // ₹3.00
    const count = Math.max(1, eligibleUsers.length);
    const perUserShare = Number((poolTotal / count).toFixed(4));

    for (const uid of eligibleUsers) {
      const gTx: LedgerTransaction = {
        id: `glb-tx-${Date.now()}-${uid}`,
        transactionId: `TX_GLB_${params.paymentId}_${uid}`,
        userId: uid,
        sourceUserId: params.uploaderUserId,
        sourceUserName: params.uploaderName,
        videoId: params.videoId,
        incomeType: "global_income",
        amount: perUserShare,
        status: "settled",
        description: `Global Income Pool distribution (₹${perUserShare} share of ₹3 pool across ${count} eligible creators for Premium Video ${txSeqLabel})`,
        createdAt: new Date().toISOString(),
      };
      ledger.unshift(gTx);
      globalTransactions.push(gTx);

      // Update eligible user wallet
      if (!wallets[uid]) {
        wallets[uid] = {
          userId: uid,
          balance: perUserShare,
          totalEarned: perUserShare,
          totalWithdrawn: 0,
          referralIncome: 0,
          globalIncome: perUserShare,
          adsenseIncome: 0,
          affiliateIncome: 0,
          updatedAt: new Date().toISOString(),
        };
      } else {
        wallets[uid].balance += perUserShare;
        wallets[uid].totalEarned += perUserShare;
        wallets[uid].globalIncome += perUserShare;
        wallets[uid].updatedAt = new Date().toISOString();
      }
    }
  }

  saveStoredLedger(ledger);
  saveStoredWallets(wallets);

  const result: PremiumDistributionResult = {
    globalTransactions,
    isSpecial,
  };
  if (referralTransaction !== undefined) {
    result.referralTransaction = referralTransaction;
  }
  if (adminTransaction !== undefined) {
    result.adminTransaction = adminTransaction;
  }
  if (specialAuditTransaction !== undefined) {
    result.specialAuditTransaction = specialAuditTransaction;
  }
  if (params.txNumber !== undefined) {
    result.txNumber = params.txNumber;
  }

  return result;
}

/**
 * WITHDRAWAL LIMITS & RULES
 * - Minimum withdrawal amount: ₹1,000
 * - Maximum withdrawal amount: ₹10,000 per day
 * - If daily withdrawal total reaches ₹10,000, further withdrawals are blocked until next day
 */
export const WITHDRAWAL_RULES = {
  MIN_AMOUNT: 1000, // ₹1,000 minimum
  MAX_DAILY_LIMIT: 10000, // ₹10,000 per day maximum
} as const;

export async function getDailyWithdrawnAmount(userId: string, dateStr?: string): Promise<number> {
  const norm = userId.trim().toUpperCase();
  const targetDate = dateStr || new Date().toISOString().split("T")[0];
  const allTxs = await getUserLedger(norm);
  const dailyWithdrawals = allTxs.filter((tx) => {
    if (tx.incomeType !== "withdrawal") return false;
    const txDate = tx.createdAt.split("T")[0];
    return txDate === targetDate && tx.status !== "failed";
  });
  return dailyWithdrawals.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

export interface WithdrawalValidationResult {
  valid: boolean;
  error?: string | undefined;
  alreadyWithdrawnToday: number;
  remainingDailyLimit: number;
  currentBalance: number;
}

export async function validateWithdrawalRequest(
  userId: string,
  amount: number,
): Promise<WithdrawalValidationResult> {
  const norm = userId.trim().toUpperCase();
  const wallet = await getUserWallet(norm);
  const alreadyWithdrawnToday = await getDailyWithdrawnAmount(norm);
  const remainingDailyLimit = Math.max(0, WITHDRAWAL_RULES.MAX_DAILY_LIMIT - alreadyWithdrawnToday);

  if (isNaN(amount) || amount <= 0) {
    return {
      valid: false,
      error: "Please enter a valid withdrawal amount.",
      alreadyWithdrawnToday,
      remainingDailyLimit,
      currentBalance: wallet.balance,
    };
  }

  // Minimum withdrawal amount check: ₹1,000
  if (amount < WITHDRAWAL_RULES.MIN_AMOUNT) {
    return {
      valid: false,
      error: `Minimum withdrawal amount is ₹${WITHDRAWAL_RULES.MIN_AMOUNT.toLocaleString("en-IN")}. You cannot withdraw less than ₹1,000.`,
      alreadyWithdrawnToday,
      remainingDailyLimit,
      currentBalance: wallet.balance,
    };
  }

  // Check if daily total already reached ₹10,000
  if (alreadyWithdrawnToday >= WITHDRAWAL_RULES.MAX_DAILY_LIMIT) {
    return {
      valid: false,
      error: `Daily withdrawal limit of ₹${WITHDRAWAL_RULES.MAX_DAILY_LIMIT.toLocaleString("en-IN")} reached. Further withdrawals are blocked until tomorrow.`,
      alreadyWithdrawnToday,
      remainingDailyLimit: 0,
      currentBalance: wallet.balance,
    };
  }

  // Check if adding this amount exceeds daily ₹10,000 limit
  if (alreadyWithdrawnToday + amount > WITHDRAWAL_RULES.MAX_DAILY_LIMIT) {
    return {
      valid: false,
      error: `Daily limit exceeded. You have already withdrawn ₹${alreadyWithdrawnToday.toLocaleString("en-IN")} today. You can withdraw at most ₹${remainingDailyLimit.toLocaleString("en-IN")} more today.`,
      alreadyWithdrawnToday,
      remainingDailyLimit,
      currentBalance: wallet.balance,
    };
  }

  // Check insufficient balance
  if (wallet.balance < amount) {
    return {
      valid: false,
      error: `Insufficient wallet balance. Your available balance is ₹${wallet.balance.toFixed(2)}, which is less than requested ₹${amount.toLocaleString("en-IN")}.`,
      alreadyWithdrawnToday,
      remainingDailyLimit,
      currentBalance: wallet.balance,
    };
  }

  return {
    valid: true,
    alreadyWithdrawnToday,
    remainingDailyLimit: remainingDailyLimit - amount,
    currentBalance: wallet.balance,
  };
}

export interface ProcessWithdrawalResult {
  success: boolean;
  error?: string | undefined;
  transaction?: LedgerTransaction | undefined;
  updatedWallet?: UserWallet | undefined;
}

export async function processWithdrawal(
  userId: string,
  amount: number,
  bankDetails?: {
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    bankName?: string;
  },
): Promise<ProcessWithdrawalResult> {
  const norm = userId.trim().toUpperCase();
  const validation = await validateWithdrawalRequest(norm, amount);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || "Withdrawal validation failed",
    };
  }

  const ledger = getStoredLedger();
  const wallets = getStoredWallets();
  let wallet = wallets[norm] || (await getUserWallet(norm));

  const txId = `TX_WD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const destinationDesc = bankDetails?.upiId
    ? `UPI: ${bankDetails.upiId}`
    : bankDetails?.accountNumber
      ? `Bank: ${bankDetails.bankName || "Account"} (****${bankDetails.accountNumber.slice(-4)})`
      : "Direct Bank Settlement";

  const tx: LedgerTransaction = {
    id: `wd-tx-${Date.now()}`,
    transactionId: txId,
    userId: norm,
    incomeType: "withdrawal",
    amount: -amount,
    status: "settled",
    description: `Withdrawal payout to ${destinationDesc} - ₹${amount.toLocaleString("en-IN")}`,
    createdAt: new Date().toISOString(),
  };

  ledger.unshift(tx);
  wallet.balance = Math.max(0, wallet.balance - amount);
  wallet.totalWithdrawn += amount;
  wallet.updatedAt = new Date().toISOString();
  wallets[norm] = wallet;

  saveStoredLedger(ledger);
  saveStoredWallets(wallets);

  // Record in PHP MySQL API if backend is connected
  try {
    let withdrawBankPayload:
      | {
          accountHolder?: string;
          accountNumber?: string;
          ifscCode?: string;
          upiId?: string;
          bankName?: string;
        }
      | undefined = undefined;

    if (bankDetails) {
      const payload: {
        accountHolder?: string;
        accountNumber?: string;
        ifscCode?: string;
        upiId?: string;
        bankName?: string;
      } = {};
      if (bankDetails.accountHolder !== undefined && bankDetails.accountHolder !== "") {
        payload.accountHolder = bankDetails.accountHolder;
      }
      if (bankDetails.accountNumber !== undefined && bankDetails.accountNumber !== "") {
        payload.accountNumber = bankDetails.accountNumber;
      }
      if (bankDetails.ifscCode !== undefined && bankDetails.ifscCode !== "") {
        payload.ifscCode = bankDetails.ifscCode;
      }
      if (bankDetails.upiId !== undefined && bankDetails.upiId !== "") {
        payload.upiId = bankDetails.upiId;
      }
      if (bankDetails.bankName !== undefined && bankDetails.bankName !== "") {
        payload.bankName = bankDetails.bankName;
      }
      if (Object.keys(payload).length > 0) {
        withdrawBankPayload = payload;
      }
    }

    const res = await api.wallet.withdraw({
      userId: norm,
      amount,
      ...(withdrawBankPayload !== undefined ? { bankDetails: withdrawBankPayload } : {}),
    });
    if (res && res.updatedWallet) {
      wallet = {
        userId: norm,
        balance: Number(res.updatedWallet.balance) || 0,
        totalEarned:
          Number(res.updatedWallet.total_earned || res.updatedWallet.totalEarned) ||
          wallet.totalEarned,
        totalWithdrawn:
          Number(res.updatedWallet.total_withdrawn || res.updatedWallet.totalWithdrawn) ||
          wallet.totalWithdrawn,
        referralIncome:
          Number(res.updatedWallet.referral_income || res.updatedWallet.referralIncome) ||
          wallet.referralIncome,
        globalIncome:
          Number(res.updatedWallet.global_income || res.updatedWallet.globalIncome) ||
          wallet.globalIncome,
        adsenseIncome:
          Number(res.updatedWallet.adsense_income || res.updatedWallet.adsenseIncome) ||
          wallet.adsenseIncome,
        affiliateIncome:
          Number(res.updatedWallet.affiliate_income || res.updatedWallet.affiliateIncome) ||
          wallet.affiliateIncome,
        updatedAt:
          res.updatedWallet.updated_at || res.updatedWallet.updatedAt || new Date().toISOString(),
      };
      wallets[norm] = wallet;
      saveStoredWallets(wallets);
    }
  } catch (e) {
    console.warn("API withdraw note:", e);
  }

  return { success: true, transaction: tx, updatedWallet: wallet };
}
