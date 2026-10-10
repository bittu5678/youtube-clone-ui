import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import {
  getUserWallet,
  getUserLedger,
  type UserWallet,
  type LedgerTransaction,
} from "@/lib/ledger-service";
import { getReferralDashboardData, type ReferralDashboardData } from "@/lib/referral-service";

export const Route = createFileRoute("/referral-income")({
  head: () => ({
    meta: [
      { title: "Referral Income — FaceTube" },
      {
        name: "description",
        content: "Track your verified referral earnings and payout ledger records on FaceTube.",
      },
    ],
  }),
  component: ReferralIncomePage,
});

function ReferralIncomePage() {
  const { profile, dbUser, user } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralDashboardData | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [w, refData, txList] = await Promise.all([
          getUserWallet(userId),
          getReferralDashboardData(userId),
          getUserLedger(userId),
        ]);
        if (mounted) {
          setWallet(w);
          setReferralSummary(refData);
          const referralTxs = txList.filter(
            (t) => t.incomeType === "referral_income" || t.incomeType === "direct_commission",
          );
          setTransactions(referralTxs);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load referral income data:", err);
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const earnedReferralIncome = wallet?.referralIncome ?? referralSummary?.referralIncome ?? 0;
  const directCommissionTotal =
    transactions.reduce((acc, t) => acc + t.amount, 0) || earnedReferralIncome;
  const directCount = referralSummary?.directReferralsCount ?? 0;
  const teamCount = referralSummary?.teamMembersCount ?? 0;

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Referral Income
              </h1>
              <p className="text-sm text-muted-foreground">
                View your earned referral income and verified ledger payout records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/referral-members"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              <Users className="h-3.5 w-3.5" />
              Referral Members
            </Link>
            <Link
              to="/wallet-balance"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Wallet className="h-3.5 w-3.5" />
              Wallet Balance
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Referral Income</span>
            <p className="text-2xl font-black text-emerald-400">
              ₹{earnedReferralIncome.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground">From verified network activity</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Direct Commission</span>
            <p className="text-2xl font-black text-foreground">
              ₹{directCommissionTotal.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground">Earned directly to wallet</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Direct Referrals</span>
            <p className="text-2xl font-black text-foreground">{directCount} Members</p>
            <p className="text-[11px] text-muted-foreground">Directly registered members</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Team Members</span>
            <p className="text-2xl font-black text-foreground">{teamCount} Members</p>
            <p className="text-[11px] text-muted-foreground">Total network downline</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Recent Referral Transactions</h3>
            <span className="text-xs text-muted-foreground">Verified audit ledger records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Source Member</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="transition hover:bg-secondary/20">
                      <td className="px-4 py-3.5 font-mono text-xs text-amber-400 font-bold">
                        {tx.transactionId}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-foreground">
                        {tx.sourceUserName || tx.sourceUserId || "Referred Creator"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Settled
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-400 text-sm">
                        +₹{tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No referral commission transactions yet. Earnings will appear automatically
                      when referred members complete eligible video uploads.
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
