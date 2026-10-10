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
  WITHDRAWAL_RULES,
  type UserWallet,
  type LedgerTransaction,
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
  const [withdrawAmount, setWithdrawAmount] = useState<string>("1000");
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

  // Real-time validation on input change
  const handleAmountChange = (val: string) => {
    setWithdrawAmount(val);
    setValidationError("");
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      if (num < WITHDRAWAL_RULES.MIN_AMOUNT) {
        setValidationError(
          `Minimum withdrawal amount is ₹${WITHDRAWAL_RULES.MIN_AMOUNT.toLocaleString("en-IN")}. You cannot withdraw less than ₹1,000.`,
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
      // 2. Server-side validation check
      const serverRes = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount }),
      });

      const serverData = await serverRes.json();
      if (!serverRes.ok || !serverData.success) {
        setValidationError(serverData.error || "Server validation rejected withdrawal request.");
        toast.error(serverData.error || "Withdrawal failed server verification.");
        setWithdrawing(false);
        return;
      }

      // 3. Process withdrawal in ledger service
      const bankKyc = await getBankKyc(userId);
      const res = await processWithdrawal(userId, amount, {
        accountHolder: bankKyc?.accountHolderName,
        accountNumber: bankKyc?.accountNumber,
        bankName: bankKyc?.bankName,
        upiId: bankKyc?.upiId,
      });

      if (res.success && res.updatedWallet) {
        setWallet(res.updatedWallet);
        setSuccessMsg(
          `🎉 Withdrawal request for ₹${amount.toLocaleString("en-IN")} submitted successfully! Reference: ${res.transaction?.transactionId}`,
        );
        toast.success(`Withdrawal of ₹${amount.toLocaleString("en-IN")} processed!`);
        await loadWalletData();
        setWithdrawAmount("1000");
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

            {/* Withdrawal Form with strict ₹1,000 min and ₹10,000 daily max rules */}
            <form
              onSubmit={handleWithdraw}
              className="rounded-xl border border-border bg-background/90 p-5 space-y-3 w-full lg:w-96 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Request Withdrawal:</span>
                <span className="text-emerald-400 font-bold">₹1,000 min · ₹10,000 max/day</span>
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
                  step="100"
                  placeholder="Enter amount (Min ₹1,000)"
                />
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
                disabled={withdrawing || Boolean(validationError) || remainingDailyLimit === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownToLine className="h-4 w-4" />
                {withdrawing
                  ? "Processing Payout..."
                  : remainingDailyLimit === 0
                    ? "Daily Limit Reached (₹10,000)"
                    : `Withdraw ₹${Number(withdrawAmount || 0).toLocaleString("en-IN")}`}
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
