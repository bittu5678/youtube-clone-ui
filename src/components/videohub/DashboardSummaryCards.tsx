import { Link } from "@tanstack/react-router";
import {
  Users,
  Network,
  Video,
  Sparkles,
  Clapperboard,
  Radio,
  Tv,
  Image,
  DollarSign,
  Globe2,
  TrendingUp,
  Share2,
  Wallet,
  ArrowDownToLine,
  Award,
  Bell,
  ArrowUpRight,
} from "lucide-react";

export interface SummaryCardItem {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Video;
  color: string;
  link: string;
  trend?: string;
  isPositive?: boolean;
}

export const DASHBOARD_SUMMARY_DATA: SummaryCardItem[] = [
  // 1. Total Referrals
  {
    id: "total-referrals",
    title: "Total Referrals",
    value: "24",
    subtitle: "Direct frontline members",
    icon: Users,
    color: "text-rose-400 bg-rose-500/10",
    link: "/referral-members",
    trend: "+4 this week",
    isPositive: true,
  },
  // 2. Total Team
  {
    id: "total-team",
    title: "Total Team",
    value: "89",
    subtitle: "Across 5 network tiers",
    icon: Network,
    color: "text-blue-400 bg-blue-500/10",
    link: "/team-members",
    trend: "+12 this month",
    isPositive: true,
  },
  // 3. Free Videos
  {
    id: "free-videos",
    title: "Free Videos",
    value: "14",
    subtitle: "Public standard content",
    icon: Video,
    color: "text-sky-400 bg-sky-500/10",
    link: "/free-videos",
    trend: "142.5K views",
  },
  // 4. Premium Videos
  {
    id: "premium-videos",
    title: "Premium Videos",
    value: "6",
    subtitle: "Monetized subscriber-only",
    icon: Sparkles,
    color: "text-amber-400 bg-amber-500/10",
    link: "/premium-videos",
    trend: "$840 ad revenue",
    isPositive: true,
  },
  // 5. Short Videos
  {
    id: "short-videos",
    title: "Short Videos",
    value: "18",
    subtitle: "Under 60s viral shorts",
    icon: Clapperboard,
    color: "text-brand bg-brand/10",
    link: "/short-videos",
    trend: "280K views",
  },
  // 6. Live Videos
  {
    id: "live-videos",
    title: "Live Videos",
    value: "3",
    subtitle: "Scheduled & archived streams",
    icon: Radio,
    color: "text-emerald-400 bg-emerald-500/10",
    link: "/live-videos",
    trend: "Active stream ready",
  },
  // 7. Advertisement Videos
  {
    id: "advertisement-videos",
    title: "Advertisement Videos",
    value: "5",
    subtitle: "Sponsor & promo campaigns",
    icon: Tv,
    color: "text-purple-400 bg-purple-500/10",
    link: "/advertisement-videos",
    trend: "3 active deals",
  },
  // 8. Images Uploaded
  {
    id: "images-uploaded",
    title: "Images Uploaded",
    value: "32",
    subtitle: "Thumbnails & community posts",
    icon: Image,
    color: "text-teal-400 bg-teal-500/10",
    link: "/images-uploaded",
    trend: "High-res assets",
  },
  // 9. Referral Income
  {
    id: "referral-income",
    title: "Referral Income",
    value: "$1,079.50",
    subtitle: "10% direct sponsor bonus",
    icon: DollarSign,
    color: "text-emerald-400 bg-emerald-500/10",
    link: "/referral-income",
    trend: "+24% vs last mo",
    isPositive: true,
  },
  // 10. Global Income
  {
    id: "global-income",
    title: "Global Income",
    value: "$2,450.00",
    subtitle: "Worldwide pool distribution",
    icon: Globe2,
    color: "text-cyan-400 bg-cyan-500/10",
    link: "/global-income",
    trend: "Top 5% creator pool",
    isPositive: true,
  },
  // 11. AdSense Income
  {
    id: "adsense-income",
    title: "AdSense Income",
    value: "$1,890.20",
    subtitle: "YouTube & video ad split",
    icon: TrendingUp,
    color: "text-yellow-400 bg-yellow-500/10",
    link: "/adsense-income",
    trend: "$4.12 CPM average",
    isPositive: true,
  },
  // 12. Affiliate Income
  {
    id: "affiliate-income",
    title: "Affiliate Income",
    value: "$940.80",
    subtitle: "Gear, courses & links",
    icon: Share2,
    color: "text-indigo-400 bg-indigo-500/10",
    link: "/affiliate-income",
    trend: "86 referral sales",
    isPositive: true,
  },
  // 13. Wallet Balance
  {
    id: "wallet-balance",
    title: "Wallet Balance",
    value: "$4,280.50",
    subtitle: "Available for instant payout",
    icon: Wallet,
    color: "text-emerald-400 bg-emerald-500/10",
    link: "/wallet-balance",
    trend: "Ready to withdraw",
  },
  // 14. Withdrawal Balance
  {
    id: "withdrawal-balance",
    title: "Withdrawal Balance",
    value: "$3,150.00",
    subtitle: "Total successfully paid out",
    icon: ArrowDownToLine,
    color: "text-orange-400 bg-orange-500/10",
    link: "/withdrawal-balance",
    trend: "Last paid Sep 18",
  },
  // 15. Current Rank
  {
    id: "current-rank",
    title: "Current Rank",
    value: "Diamond",
    subtitle: "Tier 5 Commission unlock",
    icon: Award,
    color: "text-amber-400 bg-amber-500/10",
    link: "/team-income",
    trend: "68.9% to Ambassador",
  },
  // 16. Subscriber Count
  {
    id: "subscriber-count",
    title: "Subscriber Count",
    value: "128.4K",
    subtitle: "Active channel followers",
    icon: Bell,
    color: "text-rose-400 bg-rose-500/10",
    link: "/subscriptions",
    trend: "+2.4K this month",
    isPositive: true,
  },
];

export function DashboardSummaryCards({
  filterCategory,
  limit,
}: {
  filterCategory?: "all" | "income" | "videos" | "network";
  limit?: number;
}) {
  let cards = DASHBOARD_SUMMARY_DATA;

  if (filterCategory === "income") {
    cards = cards.filter((c) =>
      [
        "referral-income",
        "global-income",
        "adsense-income",
        "affiliate-income",
        "wallet-balance",
        "withdrawal-balance",
      ].includes(c.id),
    );
  } else if (filterCategory === "videos") {
    cards = cards.filter((c) =>
      [
        "free-videos",
        "premium-videos",
        "short-videos",
        "live-videos",
        "advertisement-videos",
        "images-uploaded",
      ].includes(c.id),
    );
  } else if (filterCategory === "network") {
    cards = cards.filter((c) =>
      ["total-referrals", "total-team", "current-rank", "subscriber-count"].includes(c.id),
    );
  }

  if (limit) {
    cards = cards.slice(0, limit);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.id}
            to={card.link}
            className="group relative rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground truncate block">
                  {card.title}
                </span>
                <div className="text-2xl font-black text-foreground tracking-tight group-hover:text-brand transition-colors">
                  {card.value}
                </div>
              </div>
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105 ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
              <span className="text-muted-foreground truncate">{card.subtitle}</span>
              {card.trend && (
                <span
                  className={`font-semibold shrink-0 ml-1 flex items-center gap-0.5 ${
                    card.isPositive ? "text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {card.trend}
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
