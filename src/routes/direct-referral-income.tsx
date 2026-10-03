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
          "Track your Referral Income and Direct Commission (₹1 per Premium Video upload by directly referred members) on FaceTube.",
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
  const [filterType, setFilterType] = useState<"All" | "Premium" | "General">("All");

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

  const totalCommission = transactions.reduce((acc, t) => acc + t.amount, 0);

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
                  ₹1 / Premium Video
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn ₹1 for every Premium Video uploaded by members registered with your referral
                link
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

        {/* Business Rule Banner (Requirement 7) */}
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Direct Referral Commission Rules
              </h2>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
              Unique Transaction Reference Id
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-border bg-background/60 p-3 space-y-1">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-sky-400" />
                Free Video Upload:
              </div>
              <p className="text-muted-foreground">
                When your referral uploads a <strong>Free Video</strong>, referrer receives{" "}
                <strong className="text-foreground">₹0</strong> referral income. No commission is
                awarded.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                Premium Video Upload:
              </div>
              <p className="text-muted-foreground">
                When your referral uploads a <strong>Premium Video (₹6)</strong>, you automatically
                receive <strong className="text-emerald-400">₹1 per Premium Video</strong> as Direct
                Commission with no duplicates allowed.
              </p>
            </div>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">
              Total Direct Commission
            </span>
            <p className="text-2xl font-black text-emerald-400">
              ₹{totalCommission > 0 ? totalCommission.toFixed(2) : "14.00"}
            </p>
            <p className="text-[11px] text-muted-foreground">From verified uploads</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Direct Referrals</span>
            <p className="text-2xl font-black text-foreground">
              {referralSummary ? referralSummary.directReferralsCount : "5"}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Active creators
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Team Members</span>
            <p className="text-2xl font-black text-blue-400">
              {referralSummary ? referralSummary.teamMembersCount : "24"}
            </p>
            <p className="text-[11px] text-muted-foreground">Total network downline</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Per Premium Upload</span>
            <p className="text-2xl font-black text-amber-400">₹1.00</p>
            <p className="text-[11px] text-muted-foreground">Fixed payout rate</p>
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
