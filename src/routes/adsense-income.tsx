import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Tv,
  DollarSign,
  Eye,
  BarChart2,
  Calendar,
  Sparkles,
  Download,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/adsense-income")({
  head: () => ({
    meta: [
      { title: "AdSense Income — FaceTube" },
      {
        name: "description",
        content:
          "Track your video advertising revenue share, playback CPM, and monetized impressions on FaceTube.",
      },
    ],
  }),
  component: AdSenseIncomePage,
});

const videoAdEarnings = [
  {
    title: "Complete Modern React & TanStack Masterclass",
    views: "84,200",
    monetizedPlays: "72,100",
    cpm: "$5.20",
    revenue: "$374.92",
  },
  {
    title: "Building an Offline-First Audio Synthesizer",
    views: "52,400",
    monetizedPlays: "44,800",
    cpm: "$4.80",
    revenue: "$215.04",
  },
  {
    title: "Next.js 15 Server Actions & Edge Functions",
    views: "112,000",
    monetizedPlays: "98,400",
    cpm: "$6.10",
    revenue: "$600.24",
  },
  {
    title: "Cyberpunk 2077 Night City 4K Ray-Tracing Tour",
    views: "94,500",
    monetizedPlays: "82,000",
    cpm: "$4.15",
    revenue: "$340.30",
  },
  {
    title: "AI Video Generation Workflows in 2026",
    views: "64,100",
    monetizedPlays: "56,200",
    cpm: "$6.40",
    revenue: "$359.70",
  },
];

function AdSenseIncomePage() {
  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-500/10 text-yellow-400">
              <Tv className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                AdSense Income
              </h1>
              <p className="text-sm text-muted-foreground">
                In-stream video ad revenue (70% creator share), skippable pre-rolls, and display
                impressions
              </p>
            </div>
          </div>

          <Link
            to="/advertisement-videos"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
          >
            Manage Ad Campaigns
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total AdSense Revenue</span>
            <p className="text-2xl font-black text-yellow-400">$1,890.20</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +18.4% this month
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Average Playback CPM</span>
            <p className="text-2xl font-black text-foreground">$5.33</p>
            <p className="text-[11px] text-muted-foreground">Per 1,000 ad plays</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Monetized Plays</span>
            <p className="text-2xl font-black text-foreground">353.5K</p>
            <p className="text-[11px] text-muted-foreground">86.8% monetization rate</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Creator Rev Share</span>
            <p className="text-2xl font-black text-emerald-400">70.0%</p>
            <p className="text-[11px] text-muted-foreground">Direct net earnings</p>
          </div>
        </div>

        {/* Video Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Ad Revenue per Video</h3>
            <span className="text-xs text-muted-foreground">Top earning uploads</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Video Title</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Monetized Plays</th>
                  <th className="px-4 py-3">CPM</th>
                  <th className="px-4 py-3 text-right">Ad Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {videoAdEarnings.map((vid) => (
                  <tr key={vid.title} className="transition hover:bg-secondary/20">
                    <td className="px-4 py-3.5 font-bold text-foreground max-w-sm truncate">
                      {vid.title}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{vid.views}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{vid.monetizedPlays}</td>
                    <td className="px-4 py-3.5 font-bold text-amber-400">{vid.cpm}</td>
                    <td className="px-4 py-3.5 text-right font-black text-yellow-400 text-sm">
                      {vid.revenue}
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
