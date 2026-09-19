import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Users,
  Video,
  ArrowUpRight,
  Sparkles,
  Award,
  Bell,
  Layers,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import {
  DashboardSummaryCards,
  DASHBOARD_SUMMARY_DATA,
} from "@/components/videohub/DashboardSummaryCards";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Summary — FaceTube" },
      {
        name: "description",
        content:
          "Unified creator and affiliate dashboard with all 16 summary metrics across video content, team referrals, and income streams on FaceTube.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [filter, setFilter] = useState<"all" | "income" | "videos" | "network">("all");

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                All 16 performance metrics, income streams, content statistics, and network ranks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/wallet-balance"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              <Wallet className="h-3.5 w-3.5" />
              Wallet: $4,280.50
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Video className="h-3.5 w-3.5" />
              Upload Video
            </Link>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === "all"
                ? "bg-brand text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All 16 Summary Cards
          </button>
          <button
            type="button"
            onClick={() => setFilter("income")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === "income"
                ? "bg-brand text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Income Streams (6)
          </button>
          <button
            type="button"
            onClick={() => setFilter("videos")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === "videos"
                ? "bg-brand text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Video Content (6)
          </button>
          <button
            type="button"
            onClick={() => setFilter("network")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === "network"
                ? "bg-brand text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Team & Subscribers (4)
          </button>
        </div>

        {/* 16 Summary Cards Grid */}
        <DashboardSummaryCards filterCategory={filter} />
      </div>
    </VideoHubLayout>
  );
}
