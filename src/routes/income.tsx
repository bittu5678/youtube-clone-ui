import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Users,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/income")({
  head: () => ({
    meta: [
      { title: "Income Section — FaceTube" },
      {
        name: "description",
        content:
          "View your FaceTube creator earnings, Direct Referral Income, and Team Override Income.",
      },
    ],
  }),
  component: IncomePage,
});

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
                Overview of your direct referral earnings and multi-tier team overrides
              </p>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">
              Combined Lifetime Income
            </span>
            <p className="text-3xl font-black text-emerald-400">$3,124.90</p>
            <p className="text-[11px] text-muted-foreground">Direct + Team Overrides</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">
              Direct Referral Share (10%)
            </span>
            <p className="text-3xl font-black text-foreground">$1,079.50</p>
            <p className="text-[11px] text-emerald-400 font-semibold">From 24 frontline creators</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Team Downline Income</span>
            <p className="text-3xl font-black text-amber-400">$2,045.40</p>
            <p className="text-[11px] text-muted-foreground">From 89 team members</p>
          </div>
        </div>

        {/* Two Main Cards for Direct Referral Income & Team Income */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Card 1: Direct Referral Income */}
          <Link
            to="/direct-referral-income"
            className="group block rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:border-brand/40 hover:shadow-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand transition-transform group-hover:scale-110">
                <DollarSign className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground">
                10% Direct
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-foreground group-hover:text-brand transition-colors">
              Direct Referral Income
            </h2>
            <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
              Track commissions earned directly from users who signed up with your personal invite
              code. Real-time payouts and member transaction histories.
            </p>
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-semibold">
              <span className="text-muted-foreground">Direct Balance:</span>
              <span className="text-emerald-400 font-bold text-sm">$1,079.50</span>
            </div>
          </Link>

          {/* Card 2: Team Income */}
          <Link
            to="/team-income"
            className="group block rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:border-amber-500/40 hover:shadow-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/10 text-amber-400 transition-transform group-hover:scale-110">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground">
                Tiers 1 - 5
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-foreground group-hover:text-amber-400 transition-colors">
              Team Income
            </h2>
            <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
              Earn override volume bonuses across your multi-level creator team. Monitor tier
              percentages, team volume milestones, and global bonus pools.
            </p>
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-semibold">
              <span className="text-muted-foreground">Team Balance:</span>
              <span className="text-emerald-400 font-bold text-sm">$2,045.40</span>
            </div>
          </Link>
        </div>
      </div>
    </VideoHubLayout>
  );
}
