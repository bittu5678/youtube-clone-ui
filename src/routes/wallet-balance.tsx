import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Globe2,
  Users,
  RefreshCw,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import {
  getUserWallet,
  getUserLedger,
  getDailyWithdrawnAmount,
  validateWithdrawalRequest,
  processWithdrawal,
  calculateWithdrawalBreakdown,
  WITHDRAWAL_RULES,
  WITHDRAWAL_CHARGES,
  type UserWallet,
  type LedgerTransaction,
  type WithdrawalChargesBreakdown,
} from "@/lib/ledger-service";
import { getPersonalKyc, getBankKyc } from "@/lib/kyc-service";

export const Route = createFileRoute("/wallet-balance")({
  head: () => ({
    meta: [
      { title: "Wallet Balance & Ledger — FaceTube" },
      {
        name: "description",
        content:
          "View your available FaceTube creator wallet balance, transaction ledger, referral income, and global pool dividends.",
      },
      { property: "og:title", content: "Wallet Balance & Ledger — FaceTube" },
    ],
  }),
  component: WalletBalancePage,
});

function WalletBalancePage() {
  const { user, profile, dbUser } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
  const [alreadyWithdrawnToday, setAlreadyWithdrawnToday] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState<string>("100");
  const [withdrawing, setWithdrawing] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState("");

  // KYC state check
  const [isKycVerified, setIsKycVerified] = useState(true);

  const loadWalletData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [w, txs, dailyWithdrawn, personalKyc, bankKyc] = await Promise.all([
        getUserWallet(userId),
        getUserLedger(userId),
        getDailyWithdrawnAmount(userId),
        getPersonalKyc(userId),
        getBankKyc(userId),
      ]);

      setWallet(w);
      setLedger(txs);
      setAlreadyWithdrawnToday(dailyWithdrawn);

      const kycOk = personalKyc?.status === "Verified" && bankKyc?.status === "Verified";
      setIsKycVerified(kycOk);
    } catch (err) {
      console.error("Failed to load wallet data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const balance = wallet ? wallet.balance : 0;
  const remainingDailyLimit = Math.max(0, WITHDRAWAL_RULES.MAX_DAILY_LIMIT - alreadyWithdrawnToday);
  const currentNumAmount = Number(withdrawAmount) || 0;
  const breakdown = calculateWithdrawalBreakdown(currentNumAmount);

  // Real-time validation on input change
  const handleAmountChange = (val: string) => {
    setWithdrawAmount(val);
    setValidationError("");
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      if (num < WITHDRAWAL_RULES.MIN_AMOUNT) {
        setValidationError(
          `Minimum withdrawal amount is ₹${WITHDRAWAL_RULES.MIN_AMOUNT.toLocaleString("en-IN")}. You cannot withdraw less than ₹100.`,
        );
      } else if (alreadyWithdrawnToday >= WITHDRAWAL_RULES.MAX_DAILY_LIMIT) {
        setValidationError(
          `Daily withdrawal limit of ₹${WITHDRAWAL_RULES.MAX_DAILY_LIMIT.toLocaleString("en-IN")} reached. Further withdrawals are blocked until tomorrow.`,
        );
      } else if (alreadyWithdrawnToday + num > WITHDRAWAL_RULES.MAX_DAILY_LIMIT) {
        setValidationError(
          `Daily limit exceeded. You have already withdrawn ₹${alreadyWithdrawnToday.toLocaleString("en-IN")} today. Maximum additional withdrawal allowed today is ₹${remainingDailyLimit.toLocaleString("en-IN")}.`,
        );
      } else if (num > balance) {
        setValidationError(
          `Insufficient wallet balance. Your available balance is ₹${balance.toFixed(2)}, which is less than requested ₹${num.toLocaleString("en-IN")}.`,
        );
      }
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setSuccessMsg("");

    const amount = Number(withdrawAmount);

    // 1. Frontend validation
    const validation = await validateWithdrawalRequest(userId, amount);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid withdrawal request.");
      toast.error(validation.error);
      return;
    }

    if (!isKycVerified) {
      setValidationError(
        "KYC verification required. Complete your Personal & Bank KYC before requesting a withdrawal.",
      );
      toast.error("KYC verification required for withdrawals.");
      return;
    }

    setWithdrawing(true);
    try {
      // Process withdrawal through the centralized ledger service (which invokes the configured api.wallet.withdraw client)
      const bankKyc = await getBankKyc(userId);
      const res = await processWithdrawal(userId, amount, {
        accountHolder: bankKyc?.accountHolderName,
        accountNumber: bankKyc?.accountNumber,
        bankName: bankKyc?.bankName,
        upiId: bankKyc?.upiId,
      });

      if (res.success && res.updatedWallet) {
        setWallet(res.updatedWallet);
        const breakdown = calculateWithdrawalBreakdown(amount);
        const netPayable = res.transaction?.netAmount ?? breakdown.netPayable;
        setSuccessMsg(
          `🎉 Withdrawal request for ₹${amount.toLocaleString("en-IN")} submitted successfully! Net payable: ₹${netPayable.toLocaleString("en-IN")} (after ₹${breakdown.totalCharge} Admin & GST charges). Reference: ${res.transaction?.transactionId}`,
        );
        toast.success(
          `Withdrawal of ₹${amount.toLocaleString("en-IN")} processed (Net: ₹${netPayable.toLocaleString("en-IN")})!`,
        );
        await loadWalletData();
        setWithdrawAmount("100");
      } else {
        setValidationError(res.error || "Could not process withdrawal.");
        toast.error(res.error || "Withdrawal failed.");
      }
    } catch (err: unknown) {
      setValidationError((err as Error).message || "Network error processing withdrawal.");
      toast.error("Network error processing withdrawal.");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  Wallet Balance &amp; Ledger
                </h1>
                <button
                  type="button"
                  onClick={loadWalletData}
                  disabled={isRefreshing}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                  title="Refresh wallet from database"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin text-brand" : ""}`}
                  />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Unified income ledger for User {userId} aggregating Referral Income, Global Pool,
                and Ad Revenue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/withdrawal-balance"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Withdrawal History
            </Link>
          </div>
        </div>

        {/* Big Balance Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 sm:p-8 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Total Available Balance
              </span>
              <div className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                ₹
                {balance.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified Ledger Protected
                </span>
                <span>•</span>
                <span>
                  Daily Limit:{" "}
                  <strong>₹{WITHDRAWAL_RULES.MAX_DAILY_LIMIT.toLocaleString("en-IN")}/day</strong>
                </span>
                <span>•</span>
                <span>
                  Remaining Today:{" "}
                  <strong className="text-foreground">
                    ₹{remainingDailyLimit.toLocaleString("en-IN")}
                  </strong>
                </span>
              </div>
            </div>

            {/* Withdrawal Form with strict ₹100 min, ₹10,000 daily max rules, and ₹12 Admin/GST breakdown */}
            <form
              onSubmit={handleWithdraw}
              className="rounded-xl border border-border bg-background/90 p-5 space-y-3 w-full lg:w-96 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Request Withdrawal:</span>
                <span className="text-emerald-400 font-bold">₹100 min · ₹10,000 max/day</span>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`w-full rounded-lg border pl-8 pr-3 py-2 text-sm font-bold text-foreground focus:outline-none ${
                    validationError
                      ? "border-red-500 focus:border-red-500 bg-red-500/5"
                      : "border-border bg-card focus:border-brand"
                  }`}
                  min={WITHDRAWAL_RULES.MIN_AMOUNT}
                  max={WITHDRAWAL_RULES.MAX_DAILY_LIMIT}
                  step="10"
                  placeholder="Enter amount (Min ₹100)"
                />
              </div>

              {/* Point 7: Payout Charges Breakdown Card */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-foreground pb-1.5 border-b border-border/60">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Payout Calculation Breakdown:
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Point 7 Rule
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Gross Withdrawal Amount:</span>
                    <span className="font-bold text-foreground">
                      ₹{currentNumAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span>Admin &amp; Processing Charges:</span>
                      <span className="text-[10px] text-orange-400 font-sans font-medium">
                        (Fixed)
                      </span>
                    </span>
                    <span className="font-bold text-orange-400">
                      -₹{breakdown.totalCharge.toFixed(2)}
                    </span>
                  </div>

                  {/* Sub-item charges breakdown as specified in handwritten note */}
                  <div className="pl-2 border-l-2 border-orange-500/40 space-y-0.5 text-[10px] text-muted-foreground font-sans">
                    <div className="flex justify-between">
                      <span>• Base Processing Fee:</span>
                      <span className="font-mono">₹5.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• GST (18% on ₹5):</span>
                      <span className="font-mono">₹0.90</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• PG Fee (2% on ₹5):</span>
                      <span className="font-mono">₹0.10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Admin Allocation:</span>
                      <span className="font-mono">₹6.00</span>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground pt-0.5 border-t border-border/40">
                      <span>Total Retained for Admin:</span>
                      <span className="font-mono text-orange-400">₹12.00</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-border/60 flex justify-between items-center text-xs font-sans">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-emerald-400" />
                      Net Payable to Bank / UPI:
                    </span>
                    <span className="font-mono text-sm font-black text-emerald-400">
                      ₹{breakdown.netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Warning Alert */}
              {validationError && (
                <div className="flex items-start gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{validationError}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="flex items-start gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{successMsg}</span>
                </div>
              )}

              {/* Daily Limit Status Indicator */}
              <div className="rounded-lg bg-secondary/50 p-2 text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Today's Withdrawals:</span>
                  <span className="text-foreground">
                    ₹{alreadyWithdrawnToday.toLocaleString("en-IN")} / ₹10,000
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (alreadyWithdrawnToday / WITHDRAWAL_RULES.MAX_DAILY_LIMIT) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  withdrawing ||
                  Boolean(validationError) ||
                  remainingDailyLimit === 0 ||
                  currentNumAmount < WITHDRAWAL_RULES.MIN_AMOUNT
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownToLine className="h-4 w-4" />
                {withdrawing
                  ? "Processing Payout..."
                  : remainingDailyLimit === 0
                    ? "Daily Limit Reached (₹10,000)"
                    : currentNumAmount < WITHDRAWAL_RULES.MIN_AMOUNT
                      ? `Enter Min ₹${WITHDRAWAL_RULES.MIN_AMOUNT}`
                      : `Withdraw ₹${currentNumAmount.toLocaleString("en-IN")} (Net ₹${breakdown.netPayable.toLocaleString("en-IN")})`}
              </button>
            </form>
          </div>
        </div>

        {/* 4 Streams Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* 1. Referral Income */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Users className="h-3 w-3 text-rose-400" />
              Referral Income
            </span>
            <p className="text-xl font-bold text-foreground">
              ₹{wallet ? wallet.referralIncome.toFixed(2) : "0.00"}
            </p>
            <p className="text-[11px] text-muted-foreground">Earned network commissions</p>
          </div>

          {/* 2. Video AdSense */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-yellow-400" />
              Video AdSense
            </span>
            <p className="text-xl font-bold text-yellow-400">
              ₹{wallet ? wallet.adsenseIncome.toFixed(2) : "0.00"}
            </p>
            <p className="text-[11px] text-muted-foreground">Ad revenue monetization</p>
          </div>

          {/* 3. Global Income */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Globe2 className="h-3 w-3 text-cyan-400" />
              Global Pool
            </span>
            <p className="text-xl font-bold text-cyan-400">
              ₹{wallet ? wallet.globalIncome.toFixed(2) : "0.00"}
            </p>
            <p className="text-[11px] text-muted-foreground">Global pool distributions</p>
          </div>

          {/* 4. Affiliate Income */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-indigo-400" />
              Affiliate Links
            </span>
            <p className="text-xl font-bold text-indigo-400">
              ₹{wallet ? wallet.affiliateIncome.toFixed(2) : "0.00"}
            </p>
            <p className="text-[11px] text-muted-foreground">Gear &amp; product sales</p>
          </div>
        </div>

        {/* Transaction History Ledger */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Official Transaction Ledger</h3>
              <p className="text-xs text-muted-foreground">
                Audit-trail synced records with instant balance re-calculation
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {ledger.length} Transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Transaction ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 whitespace-nowrap">Description</th>
                  <th className="px-4 py-3 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {ledger.map((tx) => (
                  <tr key={tx.id} className="transition hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-amber-400 whitespace-nowrap">
                      {tx.transactionId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          tx.incomeType === "withdrawal"
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {tx.incomeType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">
                      {tx.description}
                    </td>
                    <td
                      className={`px-4 py-3 font-mono text-xs font-black whitespace-nowrap ${
                        tx.amount < 0 ? "text-orange-400" : "text-emerald-400"
                      }`}
                    >
                      {tx.amount < 0
                        ? `-₹${Math.abs(tx.amount).toFixed(2)}`
                        : `+₹${tx.amount.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
