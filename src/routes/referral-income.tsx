import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/referral-income")({
  head: () => ({
    meta: [
      { title: "Referral Income — FaceTube" },
      {
        name: "description",
        content: "Track your 10% direct sponsor referral earnings and payout records on FaceTube.",
      },
    ],
  }),
  component: ReferralIncomePage,
});

const mockTransactions = [
  {
    id: "ref-tx-1",
    user: "Alex Rivera (FT928412)",
    type: "Ad Revenue Share",
    amount: "+$84.00",
    date: "Today, 09:15 AM",
    status: "Settled",
  },
  {
    id: "ref-tx-2",
    user: "Samantha Chen (FT810492)",
    type: "Channel Membership",
    amount: "+$32.00",
    date: "Yesterday",
    status: "Settled",
  },
  {
    id: "ref-tx-3",
    user: "Marcus Vance (FT748190)",
    type: "Super Thanks Tip",
    amount: "+$25.00",
    date: "Sep 17, 2026",
    status: "Settled",
  },
  {
    id: "ref-tx-4",
    user: "Elena Rostova (FT619024)",
    type: "Course Purchase",
    amount: "+$12.00",
    date: "Sep 16, 2026",
    status: "Settled",
  },
  {
    id: "ref-tx-5",
    user: "Priya Sharma (FT419820)",
    type: "Ad Revenue Share",
    amount: "+$145.00",
    date: "Sep 15, 2026",
    status: "Settled",
  },
];

function ReferralIncomePage() {
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
                Earn 10% direct sponsor rewards on all earnings from creators you personally invited
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
            <p className="text-2xl font-black text-emerald-400">$1,079.50</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +24% this month
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Direct Commission</span>
            <p className="text-2xl font-black text-foreground">10% Flat</p>
            <p className="text-[11px] text-muted-foreground">On all referral revenue</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Active Referrals</span>
            <p className="text-2xl font-black text-foreground">24 Members</p>
            <p className="text-[11px] text-muted-foreground">Generating commissions</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Pending Settlement</span>
            <p className="text-2xl font-black text-amber-400">$50.00</p>
            <p className="text-[11px] text-muted-foreground">Releasing in 24h</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Recent Referral Transactions</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Income Source</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockTransactions.map((tx) => (
                  <tr key={tx.id} className="transition hover:bg-secondary/20">
                    <td className="px-4 py-3.5 font-bold text-foreground">{tx.user}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{tx.type}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{tx.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-400 text-sm">
                      {tx.amount}
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
