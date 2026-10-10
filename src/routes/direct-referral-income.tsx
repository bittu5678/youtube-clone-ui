import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  UserPlus,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Users,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Video,
  Zap,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import { getUserLedger, type LedgerTransaction } from "@/lib/ledger-service";
import { getReferralDashboardData, type ReferralDashboardData } from "@/lib/referral-service";

export const Route = createFileRoute("/direct-referral-income")({
  head: () => ({
    meta: [
      { title: "Direct Referral Income — FaceTube" },
      {
        name: "description",
        content:
          "Track your verified direct referral income and payout ledger records on FaceTube.",
      },
    ],
  }),
  component: DirectReferralIncomePage,
});

function DirectReferralIncomePage() {
  const { profile, dbUser, user } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";

  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [referralSummary, setReferralSummary] = useState<ReferralDashboardData | null>(null);

  useEffect(() => {
    Promise.all([getUserLedger(userId), getReferralDashboardData(userId)]).then(
      ([txList, refData]) => {
        const directOnly = txList.filter(
          (t) => t.incomeType === "referral_income" || t.incomeType === "direct_commission",
        );
        setTransactions(directOnly);
        setReferralSummary(refData);
      },
    );
  }, [userId]);

  const totalCommission =
    transactions.reduce((acc, t) => acc + t.amount, 0) || (referralSummary?.referralIncome ?? 0);

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  Referral Income / Direct Commission
                </h1>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Verified Ledger
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Track verified referral income earned from your network uploads
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

        {/* Audit Status Banner */}
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Referral Income Verification
              </h2>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
              Double-Entry Protected
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            All referral earnings are credited automatically to your wallet upon backend validation
            of qualifying upload activity. Each transaction is uniquely referenced in your audit
            ledger.
          </p>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">
              Total Direct Commission
            </span>
            <p className="text-2xl font-black text-emerald-400">₹{totalCommission.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">From verified uploads</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Direct Referrals</span>
            <p className="text-2xl font-black text-foreground">
              {referralSummary ? referralSummary.directReferralsCount : 0}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Active creators
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Team Members</span>
            <p className="text-2xl font-black text-blue-400">
              {referralSummary ? referralSummary.teamMembersCount : 0}
            </p>
            <p className="text-[11px] text-muted-foreground">Total network downline</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Settled Credits</span>
            <p className="text-2xl font-black text-amber-400">{transactions.length}</p>
            <p className="text-[11px] text-muted-foreground">Verified transactions</p>
          </div>
        </div>

        {/* Transactions Ledger Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Direct Referral Commission Ledger</h3>
            <span className="text-xs text-muted-foreground">Real database ledger entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Transaction ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Source Member</th>
                  <th className="px-4 py-3 whitespace-nowrap">Description</th>
                  <th className="px-4 py-3 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 whitespace-nowrap">Date & Time</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="transition hover:bg-secondary/20">
                      <td className="px-4 py-3 font-mono text-xs text-amber-400">
                        {tx.transactionId}
                      </td>
                      <td className="px-4 py-3 text-foreground font-bold">
                        {tx.sourceUserName || tx.sourceUserId || "Referral User"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-black text-emerald-400">
                        +₹{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Settled
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No referral commission transactions yet. Commission will trigger automatically
                      when directly referred members upload Premium Videos.
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
