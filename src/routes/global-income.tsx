import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Globe2,
  TrendingUp,
  Award,
  DollarSign,
  PieChart,
  Calendar,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/global-income")({
  head: () => ({
    meta: [
      { title: "Global Income — FaceTube" },
      {
        name: "description",
        content:
          "Worldwide revenue share pool, global diamond bonus distributions, and international platform dividends on FaceTube.",
      },
    ],
  }),
  component: GlobalIncomePage,
});

const globalPools = [
  {
    name: "Global Creator Revenue Pool (2%)",
    qualifiedRank: "Diamond & Above",
    yourShare: "$1,250.00",
    poolTotal: "$84,000.00",
    participants: 68,
    status: "Active",
  },
  {
    name: "International Ad Distribution Bonus",
    qualifiedRank: "Platinum & Above",
    yourShare: "$800.00",
    poolTotal: "$42,500.00",
    participants: 142,
    status: "Active",
  },
  {
    name: "Quarterly Platform Milestone Pool",
    qualifiedRank: "Ambassador Rank",
    yourShare: "$400.00",
    poolTotal: "$120,000.00",
    participants: 24,
    status: "Processing",
  },
];

function GlobalIncomePage() {
  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Global Income
              </h1>
              <p className="text-sm text-muted-foreground">
                Worldwide platform pool dividends and international revenue share distributions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/wallet-balance"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Wallet className="h-3.5 w-3.5" />
              Transfer to Wallet
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Global Income</span>
            <p className="text-2xl font-black text-cyan-400">$2,450.00</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Diamond tier share
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Global Pool Share</span>
            <p className="text-2xl font-black text-foreground">1.48%</p>
            <p className="text-[11px] text-muted-foreground">Of active creator pool</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Next Distribution</span>
            <p className="text-2xl font-black text-amber-400">Oct 01, 2026</p>
            <p className="text-[11px] text-muted-foreground">12 days remaining</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Platform Total Pool</span>
            <p className="text-2xl font-black text-foreground">$246,500</p>
            <p className="text-[11px] text-muted-foreground">Quarterly volume</p>
          </div>
        </div>

        {/* Global Pool Cards */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Active Platform Dividend Pools
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {globalPools.map((pool) => (
              <div
                key={pool.name}
                className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                    {pool.qualifiedRank}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">{pool.status}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground leading-snug">{pool.name}</h3>
                <div className="border-t border-border/60 pt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Your Allocation:</span>
                    <strong className="text-cyan-400 font-bold text-sm">{pool.yourShare}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Pool Volume:</span>
                    <span>{pool.poolTotal}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Qualified Creators:</span>
                    <span>{pool.participants} members</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
