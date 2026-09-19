import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Share2,
  TrendingUp,
  DollarSign,
  ExternalLink,
  ShoppingBag,
  MousePointerClick,
  CheckCircle2,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/affiliate-income")({
  head: () => ({
    meta: [
      { title: "Affiliate Income — FaceTube" },
      {
        name: "description",
        content:
          "Track affiliate sales commissions, sponsored product clicks, and conversion earnings on FaceTube.",
      },
    ],
  }),
  component: AffiliateIncomePage,
});

const affiliateLinks = [
  {
    name: "Sony FX3 Cinema Camera Bundle",
    partner: "B&H Photo Video",
    clicks: "1,420",
    sales: "18",
    rate: "6.0%",
    earned: "$420.00",
  },
  {
    name: "Shure SM7B Vocal Microphone",
    partner: "Amazon Associates",
    clicks: "3,180",
    sales: "42",
    rate: "4.0%",
    earned: "$210.80",
  },
  {
    name: "Complete UI/UX Design System Course",
    partner: "FaceTube Academy",
    clicks: "890",
    sales: "26",
    rate: "25.0%",
    earned: "$310.00",
  },
];

function AffiliateIncomePage() {
  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Affiliate Income
              </h1>
              <p className="text-sm text-muted-foreground">
                Commissions earned from product recommendations, gear links, and course referrals
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">
              Total Affiliate Earnings
            </span>
            <p className="text-2xl font-black text-indigo-400">$940.80</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12.5% vs August
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Product Clicks</span>
            <p className="text-2xl font-black text-foreground">5,490</p>
            <p className="text-[11px] text-muted-foreground">Across all video descriptions</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Conversions</span>
            <p className="text-2xl font-black text-foreground">86 Sales</p>
            <p className="text-[11px] text-muted-foreground">1.57% conversion rate</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Average Commission</span>
            <p className="text-2xl font-black text-emerald-400">$10.94</p>
            <p className="text-[11px] text-muted-foreground">Per completed checkout</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Top Performing Affiliate Links</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Product / Campaign</th>
                  <th className="px-4 py-3">Partner Program</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Sales</th>
                  <th className="px-4 py-3">Commission Rate</th>
                  <th className="px-4 py-3 text-right">Total Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {affiliateLinks.map((item) => (
                  <tr key={item.name} className="transition hover:bg-secondary/20">
                    <td className="px-4 py-3.5 font-bold text-foreground">{item.name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{item.partner}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{item.clicks}</td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{item.sales}</td>
                    <td className="px-4 py-3.5 font-bold text-amber-400">{item.rate}</td>
                    <td className="px-4 py-3.5 text-right font-black text-indigo-400 text-sm">
                      {item.earned}
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
