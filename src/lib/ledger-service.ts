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
  fee?: number | undefined;
  netAmount?: number | undefined;
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

  // 2. Admin Allocation & Global Pool Calculation (Server-Authoritative Option A)
  const normUploader = params.uploaderUserId.trim().toUpperCase();
  const allEligible = await getEligibleGlobalIncomeUsers();
  // Strictly EXCLUDE current uploader from their own transaction's global pool
  const eligibleUsers = Array.from(
    new Set(allEligible.map((id) => id.trim().toUpperCase()).filter((id) => id !== normUploader)),
  );
  const eligibleCount = eligibleUsers.length;

  const hasValidReferrer = Boolean(normalizedReferrerId && normalizedReferrerId.length > 0);
  const unallocatedReferrerPaise = hasValidReferrer ? 0 : 100; // Option A: unallocated ₹1 to Admin

  let adminAmount = 0.0;
  let globalPoolAllocation = 0.0;
  let perUserShare = 0.0;

  if (isSpecial) {
    // Special: ₹4 Admin + ₹1 (if no referrer redirected to Admin) = ₹4 or ₹5
    adminAmount = hasValidReferrer ? 4.0 : 5.0;
    globalPoolAllocation = 0.0;
  } else {
    const baseAdminPaise = 100 + unallocatedReferrerPaise;

    if (eligibleCount === 0) {
      // First transaction / no previous eligible creators: redirect entire ₹3 pool to Admin
      adminAmount = (baseAdminPaise + 300) / 100;
      globalPoolAllocation = 0.0;
    } else {
      // Distribute 300 paise in integer paise; residual paise goes to Admin
      const poolPaise = 300;
      const perCreatorPaise = Math.floor(poolPaise / eligibleCount);
      const distributedPaise = perCreatorPaise * eligibleCount;
      const residualPaise = poolPaise - distributedPaise;

      adminAmount = (baseAdminPaise + residualPaise) / 100;
      globalPoolAllocation = distributedPaise / 100;
      perUserShare = perCreatorPaise / 100;
    }
  }

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
      ? `Special Premium Transaction ${txSeqLabel}: Admin Allocation (₹${adminAmount.toFixed(2)}) under rule SPECIAL_GLOBAL_RULE`
      : `Admin Allocation (₹${adminAmount.toFixed(2)}) for Premium Video ${txSeqLabel}`,
    createdAt: new Date().toISOString(),
  };
  ledger.unshift(adminTransaction);

  // Credit Admin wallet
  const adminWalletKey = "ADMIN";
  if (!wallets[adminWalletKey]) {
    wallets[adminWalletKey] = {
      userId: adminWalletKey,
      balance: adminAmount,
      totalEarned: adminAmount,
      totalWithdrawn: 0,
      referralIncome: 0,
      globalIncome: 0,
      adsenseIncome: 0,
      affiliateIncome: 0,
      updatedAt: new Date().toISOString(),
    };
  } else {
    wallets[adminWalletKey].balance += adminAmount;
    wallets[adminWalletKey].totalEarned += adminAmount;
    wallets[adminWalletKey].updatedAt = new Date().toISOString();
  }

  // 3. Global Income Pool
  if (isSpecial) {
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
      description: `Special Premium Transaction ${txSeqLabel}: Rule SPECIAL_GLOBAL_RULE applied (₹${adminAmount.toFixed(2)} Admin, ₹0 Global Pool, standard pool distribution bypassed)`,
      createdAt: new Date().toISOString(),
    };
    ledger.unshift(specialAuditTransaction);
  } else if (eligibleCount > 0 && perUserShare > 0) {
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
        description: `Global Income Pool distribution (₹${perUserShare.toFixed(2)} share of ₹3 pool across ${eligibleCount} eligible creators for Premium Video ${txSeqLabel})`,
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
 * - Minimum withdrawal amount: ₹100
 * - Maximum withdrawal amount: ₹10,000 per day
 * - Total Admin & Processing Charge: ₹12 (₹5 Base + ₹0.90 GST [18%] + ₹0.10 PG fee [2%] ≈ ₹6, plus ₹6 Admin allocation)
 * - Charge is deducted from creator's requested payout amount (e.g. ₹100 withdrawal -> ₹88 net payable)
 * - If daily withdrawal total reaches ₹10,000, further withdrawals are blocked until next day
 */
export const WITHDRAWAL_RULES = {
  MIN_AMOUNT: 100, // ₹100 minimum
  MAX_DAILY_LIMIT: 10000, // ₹10,000 per day maximum
} as const;

export const WITHDRAWAL_CHARGES = {
  TOTAL_FEE: 12,
  BASE_PROCESSING: 5,
  GST_RATE: 0.18, // 18% GST (₹0.90)
  GST_AMOUNT: 0.9,
  PG_FEE_RATE: 0.02, // 2% PG fee (₹0.10)
  PG_FEE_AMOUNT: 0.1,
  ADMIN_ALLOCATION: 6,
} as const;

export interface WithdrawalChargesBreakdown {
  grossAmount: number;
  baseProcessing: number;
  gstRatePercent: number;
  gstAmount: number;
  pgFeePercent: number;
  pgFeeAmount: number;
  adminAllocation: number;
  totalCharge: number;
  netPayable: number;
}

export function calculateWithdrawalBreakdown(amount: number): WithdrawalChargesBreakdown {
  const grossAmount = Math.max(0, Number(amount) || 0);
  const totalCharge = grossAmount >= WITHDRAWAL_RULES.MIN_AMOUNT ? WITHDRAWAL_CHARGES.TOTAL_FEE : 0;
  const netPayable = Math.max(0, grossAmount - totalCharge);
  return {
    grossAmount,
    baseProcessing: WITHDRAWAL_CHARGES.BASE_PROCESSING,
    gstRatePercent: 18,
    gstAmount: WITHDRAWAL_CHARGES.GST_AMOUNT,
    pgFeePercent: 2,
    pgFeeAmount: WITHDRAWAL_CHARGES.PG_FEE_AMOUNT,
    adminAllocation: WITHDRAWAL_CHARGES.ADMIN_ALLOCATION,
    totalCharge,
    netPayable,
  };
}

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
  breakdown?: WithdrawalChargesBreakdown | undefined;
}

export async function validateWithdrawalRequest(
  userId: string,
  amount: number,
): Promise<WithdrawalValidationResult> {
  const norm = userId.trim().toUpperCase();
  const wallet = await getUserWallet(norm);
  const alreadyWithdrawnToday = await getDailyWithdrawnAmount(norm);
  const remainingDailyLimit = Math.max(0, WITHDRAWAL_RULES.MAX_DAILY_LIMIT - alreadyWithdrawnToday);
  const breakdown = calculateWithdrawalBreakdown(amount);

  if (isNaN(amount) || amount <= 0) {
    return {
      valid: false,
      error: "Please enter a valid withdrawal amount.",
      alreadyWithdrawnToday,
      remainingDailyLimit,
      currentBalance: wallet.balance,
      breakdown,
    };
  }

  // Minimum withdrawal amount check: ₹100
  if (amount < WITHDRAWAL_RULES.MIN_AMOUNT) {
    return {
      valid: false,
      error: `Minimum withdrawal amount is ₹${WITHDRAWAL_RULES.MIN_AMOUNT.toLocaleString("en-IN")}. You cannot withdraw less than ₹100.`,
      alreadyWithdrawnToday,
      remainingDailyLimit,
      currentBalance: wallet.balance,
      breakdown,
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

  const breakdown = calculateWithdrawalBreakdown(amount);

  const tx: LedgerTransaction = {
    id: `wd-tx-${Date.now()}`,
    transactionId: txId,
    userId: norm,
    incomeType: "withdrawal",
    amount: -amount,
    fee: breakdown.totalCharge,
    netAmount: breakdown.netPayable,
    status: "settled",
    description: `Withdrawal payout to ${destinationDesc} - Requested: ₹${amount.toLocaleString("en-IN")}, Admin/GST Charges: ₹${breakdown.totalCharge}, Net Payable: ₹${breakdown.netPayable.toLocaleString("en-IN")}`,
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
