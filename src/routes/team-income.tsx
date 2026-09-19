import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp,
  Layers,
  Award,
  Users,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  Calendar,
  CheckCircle2,
  Download,
  Sparkles,
  Zap,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/team-income")({
  head: () => ({
    meta: [
      { title: "Team Income — FaceTube" },
      {
        name: "description",
        content: "Track your multi-tier creator team overrides, downline volume bonuses, and team earnings on FaceTube.",
      },
    ],
  }),
  component: TeamIncomePage,
});

interface TierBreakdown {
  level: number;
  label: string;
  membersCount: number;
  rate: string;
  totalVolume: string;
  earnedIncome: string;
}

const tierStats: TierBreakdown[] = [
  {
    level: 1,
    label: "Level 1 (Direct Referrals)",
    membersCount: 24,
    rate: "10.0%",
    totalVolume: "$10,795.00",
    earnedIncome: "$1,079.50",
  },
  {
    level: 2,
    label: "Level 2 (Downline Tier 1)",
    membersCount: 41,
    rate: "5.0%",
    totalVolume: "$14,320.00",
    earnedIncome: "$716.00",
  },
  {
    level: 3,
    label: "Level 3 (Downline Tier 2)",
    membersCount: 18,
    rate: "3.0%",
    totalVolume: "$6,240.00",
    earnedIncome: "$187.20",
  },
  {
    level: 4,
    label: "Level 4 (Downline Tier 3)",
    membersCount: 6,
    rate: "2.0%",
    totalVolume: "$3,135.00",
    earnedIncome: "$62.70",
  },
];

function TeamIncomePage() {
  const totalTeamIncome = "$2,045.40";
  const totalVolume = "$34,490.00";

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Team Income
              </h1>
              <p className="text-sm text-muted-foreground">
                Multi-level downline overrides, rank bonuses, and team volume performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/team-members"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              <Users className="h-3.5 w-3.5" />
              Team Members
            </Link>
            <Link
              to="/direct-referral-income"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              Direct Income
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Team Income</span>
            <p className="text-2xl font-black text-emerald-400">{totalTeamIncome}</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +16.8% this month
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Monthly Team Volume</span>
            <p className="text-2xl font-black text-foreground">{totalVolume}</p>
            <p className="text-[11px] text-muted-foreground">Combined ad & sales volume</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Current Creator Rank</span>
            <p className="text-2xl font-black text-amber-400">Diamond Tier</p>
            <p className="text-[11px] text-muted-foreground">Unlocks up to Level 5</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Next Milestone</span>
            <p className="text-2xl font-black text-foreground">$50,000</p>
            <p className="text-[11px] text-amber-400 font-semibold">68.9% completed</p>
          </div>
        </div>

        {/* Tier Override Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand" />
                Multi-Level Commission Structure
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Earn override commissions on every tier of your active creator network
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              Active Diamond Status
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {tierStats.map((tier) => (
              <div
                key={tier.level}
                className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-brand/20 px-2 py-0.5 text-[10px] font-black text-brand uppercase">
                    Level {tier.level}
                  </span>
                  <span className="text-xs font-black text-emerald-400">{tier.rate} Override</span>
                </div>
                <div className="space-y-0.5 pt-1">
                  <div className="text-lg font-black text-foreground">{tier.earnedIncome}</div>
                  <div className="text-[11px] text-muted-foreground">
                    From {tier.totalVolume} volume
                  </div>
                </div>
                <div className="border-t border-border/50 pt-2 text-[11px] text-muted-foreground flex justify-between">
                  <span>Creators:</span>
                  <strong className="text-foreground">{tier.membersCount}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rank Progression */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-6 space-y-3 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/20 text-amber-300">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Ambassador Rank Pool Bonus
                </h3>
                <p className="text-xs text-muted-foreground">
                  Reach $50,000 monthly team volume to participate in the 2% Global Creator Bonus Pool.
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-amber-400 shrink-0">
              $34,490 / $50,000
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
              style={{ width: "68.9%" }}
            />
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
