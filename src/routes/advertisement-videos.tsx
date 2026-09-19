import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Tv,
  Plus,
  BarChart3,
  DollarSign,
  TrendingUp,
  Eye,
  MousePointerClick,
  CheckCircle2,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/advertisement-videos")({
  head: () => ({
    meta: [
      { title: "Advertisement Videos — Your Videos — FaceTube" },
      {
        name: "description",
        content:
          "Manage sponsor spots, promotional ad video campaigns, and brand deal deliverables on FaceTube.",
      },
    ],
  }),
  component: AdvertisementVideosPage,
});

const mockAdCampaigns = [
  {
    id: "ad-1",
    brand: "NordVPN Cyber Security Integration",
    slotType: "60s Mid-Roll Integration",
    status: "Active",
    budget: "$1,500.00",
    impressions: "142,000",
    clicks: "3,840",
    ctr: "2.7%",
    thumbnail:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "ad-2",
    brand: "Raycon Wireless Earbuds Showcase",
    slotType: "Pre-Roll Dedicated Spot",
    status: "Active",
    budget: "$1,200.00",
    impressions: "98,400",
    clicks: "2,410",
    ctr: "2.45%",
    thumbnail:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "ad-3",
    brand: "Supabase Cloud Database Sponsorship",
    slotType: "End-Screen Partner Card",
    status: "Completed",
    budget: "$2,000.00",
    impressions: "184,000",
    clicks: "5,120",
    ctr: "2.78%",
    thumbnail:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80",
  },
];

function AdvertisementVideosPage() {
  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-400">
              <Tv className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Advertisement Videos
              </h1>
              <p className="text-sm text-muted-foreground">
                Sponsor campaigns, pre-roll advert placements, and direct brand partner deliveries
              </p>
            </div>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create Ad Campaign
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Active Ad Videos</span>
            <p className="text-2xl font-black text-purple-400">5</p>
            <p className="text-[11px] text-muted-foreground">3 Live campaigns</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Sponsor Revenue</span>
            <p className="text-2xl font-black text-emerald-400">$4,700.00</p>
            <p className="text-[11px] text-emerald-400 font-semibold">+22% this quarter</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Ad Views</span>
            <p className="text-2xl font-black text-foreground">424.4K</p>
            <p className="text-[11px] text-muted-foreground">Across all sponsorships</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Average Click CTR</span>
            <p className="text-2xl font-black text-foreground">2.64%</p>
            <p className="text-[11px] text-muted-foreground">High brand engagement</p>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Active Ad Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {mockAdCampaigns.map((ad) => (
              <div
                key={ad.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                  <img
                    src={ad.thumbnail}
                    alt={ad.brand}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm flex items-center gap-1 ${
                      ad.status === "Active"
                        ? "bg-emerald-500 text-white"
                        : "bg-secondary/90 text-foreground"
                    }`}
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" /> {ad.status}
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    {ad.budget}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="line-clamp-1 text-xs font-bold text-foreground leading-snug group-hover:text-brand transition-colors">
                    {ad.brand}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{ad.slotType}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                    <span>{ad.impressions} Views</span>
                    <span className="font-semibold text-foreground">
                      {ad.ctr} CTR ({ad.clicks} clicks)
                    </span>
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
