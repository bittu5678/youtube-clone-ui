import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Download,
  Wallet,
  Building,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import {
  getUserWallet,
  getUserLedger,
  getDailyWithdrawnAmount,
  WITHDRAWAL_RULES,
  type UserWallet,
  type LedgerTransaction,
} from "@/lib/ledger-service";

export const Route = createFileRoute("/withdrawal-balance")({
  head: () => ({
    meta: [
      { title: "Withdrawal Balance — FaceTube" },
      {
        name: "description",
        content:
          "Track your FaceTube payout history, completed bank transfers, and withdrawal receipts with ₹1,000 min and ₹10,000 daily limit verification.",
      },
    ],
  }),
  component: WithdrawalBalancePage,
});

export function WithdrawalBalancePage() {
  const { user, profile, dbUser } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [withdrawalTxs, setWithdrawalTxs] = useState<LedgerTransaction[]>([]);
  const [dailyWithdrawn, setDailyWithdrawn] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, allTxs, daily] = await Promise.all([
        getUserWallet(userId),
        getUserLedger(userId),
        getDailyWithdrawnAmount(userId),
      ]);
      setWallet(w);
      setDailyWithdrawn(daily);
      const filtered = allTxs.filter((tx) => tx.incomeType === "withdrawal");
      setWithdrawalTxs(filtered);
    } catch (e) {
      console.error("Failed to load withdrawal data:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalWithdrawn = wallet ? wallet.totalWithdrawn : 3150.0;
  const remainingDaily = Math.max(0, WITHDRAWAL_RULES.MAX_DAILY_LIMIT - dailyWithdrawn);

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-orange-400">
              <ArrowDownToLine className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Withdrawal Balance
              </h1>
              <p className="text-sm text-muted-foreground">
                History of completed payouts, settlement receipts, and daily withdrawal quota
                tracking for User {userId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-brand" : ""}`} />
              Refresh
            </button>
            <Link
              to="/wallet-balance"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Wallet className="h-3.5 w-3.5" />
              Request New Withdrawal
            </Link>
          </div>
        </div>

        {/* Withdrawal Limits Notice Banner */}
        <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-card to-card p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-foreground text-sm">
                Enforced Withdrawal Limits: ₹1,000 Minimum · ₹10,000 Daily Maximum
              </div>
              <p className="text-muted-foreground">
                Minimum per transaction: <strong>₹1,000</strong>. Daily cumulative withdrawal cap:{" "}
                <strong>₹10,000 per day</strong>. If daily limit is reached, further payouts are
                blocked until next day.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 font-mono text-xs">
            <div className="text-muted-foreground">Remaining Today:</div>
            <div className="text-base font-black text-emerald-400">
              ₹{remainingDaily.toLocaleString("en-IN")} / ₹10,000
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Withdrawn</span>
            <p className="text-2xl font-black text-orange-400">
              ₹
              {totalWithdrawn.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-[11px] text-muted-foreground">Lifetime settled payouts</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Withdrawn Today</span>
            <p className="text-2xl font-black text-foreground">
              ₹{dailyWithdrawn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold">Of ₹10,000 daily limit</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Minimum Allowed</span>
            <p className="text-2xl font-black text-foreground">₹1,000.00</p>
            <p className="text-[11px] text-muted-foreground">Per request floor</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Average Processing</span>
            <p className="text-2xl font-black text-emerald-400">&lt; 2 Hours</p>
            <p className="text-[11px] text-muted-foreground">Instant automated settlement</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Withdrawal History &amp; Receipts</h3>
            <span className="text-xs text-muted-foreground">
              {withdrawalTxs.length} Transfers Recorded
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Settled Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawalTxs.length > 0 ? (
                  withdrawalTxs.map((item) => (
                    <tr key={item.id} className="transition hover:bg-secondary/20">
                      <td className="px-4 py-3.5 font-mono font-bold text-foreground">
                        {item.transactionId}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground max-w-sm truncate">
                        {item.description}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Settled
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-orange-400 text-sm">
                        ₹
                        {Math.abs(item.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No withdrawal records yet for User {userId}. Request a withdrawal above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
