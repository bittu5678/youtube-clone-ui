import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/direct-referral-income")({
  head: () => ({
    meta: [
      { title: "Direct Referral Income — FaceTube" },
      {
        name: "description",
        content:
          "Track your direct 10% referral commissions, earnings transactions, and payout history on FaceTube.",
      },
    ],
  }),
  component: DirectReferralIncomePage,
});

interface IncomeTransaction {
  id: string;
  referralName: string;
  referralId: string;
  sourceType: "Ad Revenue Share" | "Subscription" | "Super Thanks" | "Sponsor";
  videoOrPlan: string;
  grossAmount: string;
  commissionRate: string;
  earnedAmount: string;
  date: string;
  status: "Settled" | "Processing";
}

const mockTransactions: IncomeTransaction[] = [
  {
    id: "tx-1",
    referralName: "Alex Rivera",
    referralId: "FT928412",
    sourceType: "Ad Revenue Share",
    videoOrPlan: "4K Master: Unreal Engine 5.5",
    grossAmount: "$840.00",
    commissionRate: "10%",
    earnedAmount: "$84.00",
    date: "Today, 09:15 AM",
    status: "Settled",
  },
  {
    id: "tx-2",
    referralName: "Samantha Chen",
    referralId: "FT810492",
    sourceType: "Ad Revenue Share",
    videoOrPlan: "Premium Short: AI Workflow",
    grossAmount: "$320.00",
    commissionRate: "10%",
    earnedAmount: "$32.00",
    date: "Yesterday",
    status: "Settled",
  },
  {
    id: "tx-3",
    referralName: "Marcus Vance",
    referralId: "FT748190",
    sourceType: "Super Thanks",
    videoOrPlan: "Live Stream Super Thanks",
    grossAmount: "$250.00",
    commissionRate: "10%",
    earnedAmount: "$25.00",
    date: "Sep 17, 2026",
    status: "Settled",
  },
  {
    id: "tx-4",
    referralName: "Elena Rostova",
    referralId: "FT619024",
    sourceType: "Subscription",
    videoOrPlan: "Monthly Channel Membership",
    grossAmount: "$120.00",
    commissionRate: "10%",
    earnedAmount: "$12.00",
    date: "Sep 16, 2026",
    status: "Settled",
  },
  {
    id: "tx-5",
    referralName: "Priya Sharma",
    referralId: "FT419820",
    sourceType: "Ad Revenue Share",
    videoOrPlan: "4K Master: Cyberpunk City Tour",
    grossAmount: "$1,450.00",
    commissionRate: "10%",
    earnedAmount: "$145.00",
    date: "Sep 15, 2026",
    status: "Settled",
  },
  {
    id: "tx-6",
    referralName: "Alex Rivera",
    referralId: "FT928412",
    sourceType: "Sponsor",
    videoOrPlan: "Brand Integration Payout",
    grossAmount: "$500.00",
    commissionRate: "10%",
    earnedAmount: "$50.00",
    date: "Sep 14, 2026",
    status: "Processing",
  },
];

function DirectReferralIncomePage() {
  const [filterType, setFilterType] = useState<string>("All");

  const filteredTransactions = mockTransactions.filter((tx) =>
    filterType === "All" ? true : tx.sourceType === filterType,
  );

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Direct Referral Income
              </h1>
              <p className="text-sm text-muted-foreground">
                Earnings generated directly from your frontline registered referral creators (10%
                flat rate)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/referral-members"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              <Users className="h-3.5 w-3.5" />
              Referral List
            </Link>
            <Link
              to="/team-income"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              Team Income
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Available Balance</span>
            <p className="text-2xl font-black text-emerald-400">$1,079.50</p>
            <p className="text-[11px] text-muted-foreground">Ready for withdrawal</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">This Month</span>
            <p className="text-2xl font-black text-foreground">$418.00</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +24% vs August
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Commission Rate</span>
            <p className="text-2xl font-black text-amber-400">10.0%</p>
            <p className="text-[11px] text-muted-foreground">Direct tier benefit</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Paid Out</span>
            <p className="text-2xl font-black text-foreground">$3,620.00</p>
            <p className="text-[11px] text-muted-foreground">Lifetime settled</p>
          </div>
        </div>

        {/* Breakdown Banner */}
        <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-400" />
              Direct Referral Commission Mechanism
            </h3>
            <p className="text-xs text-muted-foreground">
              Every time a creator you directly referred earns from ads, subscriptions, or tips, 10%
              is immediately credited to your referral balance.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition hover:bg-secondary shrink-0 self-start sm:self-auto shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        {/* Transactions Section */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(["All", "Ad Revenue Share", "Subscription", "Super Thanks"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setFilterType(filter)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      filterType === filter
                        ? "bg-brand text-white shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {filter}
                  </button>
                ),
              )}
            </div>

            <span className="text-xs text-muted-foreground">
              Showing <strong>{filteredTransactions.length}</strong> transactions
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Referral Member</th>
                    <th className="px-4 py-3">Source / Activity</th>
                    <th className="px-4 py-3">Gross Total</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">You Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="transition hover:bg-secondary/20">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-foreground">{tx.referralName}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {tx.referralId}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground mb-0.5">
                          {tx.sourceType}
                        </span>
                        <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                          {tx.videoOrPlan}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-muted-foreground">
                        {tx.grossAmount}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-amber-400">{tx.commissionRate}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{tx.date}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tx.status === "Settled"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {tx.status === "Settled" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-400 text-sm">
                        +{tx.earnedAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
