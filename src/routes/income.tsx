import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Globe2,
  Tv,
  Share2,
  ArrowDownToLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { DashboardSummaryCards } from "@/components/videohub/DashboardSummaryCards";

export const Route = createFileRoute("/income")({
  head: () => ({
    meta: [
      { title: "Income Section — FaceTube" },
      {
        name: "description",
        content:
          "Unified creator income hub on FaceTube: Referral Income, Global Pool, AdSense, Affiliate Sales, Wallet and Withdrawals.",
      },
    ],
  }),
  component: IncomePage,
});

const incomeStreams = [
  {
    title: "Referral Income",
    desc: "10% direct sponsor rewards from creator subscriptions and tips",
    balance: "$1,079.50",
    badge: "10% Direct",
    icon: DollarSign,
    color: "text-emerald-400 bg-emerald-500/10",
    link: "/referral-income",
  },
  {
    title: "Global Income",
    desc: "Worldwide platform revenue pool distribution for Diamond ranks",
    balance: "$2,450.00",
    badge: "Global Pool",
    icon: Globe2,
    color: "text-cyan-400 bg-cyan-500/10",
    link: "/global-income",
  },
  {
    title: "AdSense Income",
    desc: "70% video player pre-roll, mid-roll, and display ad revenue",
    balance: "$1,890.20",
    badge: "70% Split",
    icon: Tv,
    color: "text-yellow-400 bg-yellow-500/10",
    link: "/adsense-income",
  },
  {
    title: "Affiliate Income",
    desc: "Product recommendations, gear commissions, and course referrals",
    balance: "$940.80",
    badge: "86 Sales",
    icon: Share2,
    color: "text-indigo-400 bg-indigo-500/10",
    link: "/affiliate-income",
  },
  {
    title: "Wallet Balance",
    desc: "Current aggregated balance ready for immediate transfer or withdrawal",
    balance: "$4,280.50",
    badge: "Available",
    icon: Wallet,
    color: "text-emerald-400 bg-emerald-500/10",
    link: "/wallet-balance",
  },
  {
    title: "Withdrawal Balance",
    desc: "History of completed bank ACH, PayPal, and crypto disbursements",
    balance: "$3,150.00",
    badge: "Processed",
    icon: ArrowDownToLine,
    color: "text-orange-400 bg-orange-500/10",
    link: "/withdrawal-balance",
  },
];

function IncomePage() {
  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Income Section
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage all 6 creator revenue streams, check balances, and withdraw earnings
              </p>
            </div>
          </div>

          <Link
            to="/wallet-balance"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
          >
            <Wallet className="h-3.5 w-3.5" />
            Withdrawal Balance
          </Link>
        </div>

        {/* Income Summary Cards */}
        <DashboardSummaryCards filterCategory="income" />

        {/* 6 Income Stream Cards */}
        <div className="space-y-3 pt-2">
          <h2 className="text-base font-extrabold text-foreground">Revenue Streams & Payouts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {incomeStreams.map((stream) => {
              const Icon = stream.icon;
              return (
                <Link
                  key={stream.title}
                  to={stream.link}
                  className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-xl transition-transform group-hover:scale-105 ${stream.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-foreground">
                      {stream.badge}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-foreground group-hover:text-brand transition-colors">
                    {stream.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed line-clamp-2">
                    {stream.desc}
                  </p>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold">
                    <span className="text-muted-foreground">Balance / Volume:</span>
                    <span className="text-foreground font-black text-sm">{stream.balance}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
