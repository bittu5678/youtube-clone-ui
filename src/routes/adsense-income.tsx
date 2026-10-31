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
    cpm: "₹5.20",
    revenue: "₹374.92",
  },
  {
    title: "Building an Offline-First Audio Synthesizer",
    views: "52,400",
    monetizedPlays: "44,800",
    cpm: "₹4.80",
    revenue: "₹215.04",
  },
  {
    title: "Next.js 15 Server Actions & Edge Functions",
    views: "112,000",
    monetizedPlays: "98,400",
    cpm: "₹6.10",
    revenue: "₹600.24",
  },
  {
    title: "Cyberpunk 2077 Night City 4K Ray-Tracing Tour",
    views: "94,500",
    monetizedPlays: "82,000",
    cpm: "₹4.15",
    revenue: "₹340.30",
  },
  {
    title: "AI Video Generation Workflows in 2026",
    views: "64,100",
    monetizedPlays: "56,200",
    cpm: "₹6.40",
    revenue: "₹359.70",
  },
];

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

function AdSenseIncomePage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [adsenseTransactions, setAdsenseTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [wRes, txRes] = await Promise.all([
          api.wallet.getBalance(user?.user_id),
          api.wallet.getTransactions(user?.user_id, 50),
        ]);
        if (isMounted) {
          if (wRes && wRes.success && wRes.wallet) {
            setWallet(wRes.wallet);
          }
          if (txRes && txRes.success && Array.isArray(txRes.transactions)) {
            const filtered = txRes.transactions.filter(
              (t: any) =>
                t.income_type === "adsense_income" ||
                t.incomeType === "adsense_income" ||
                t.purpose === "adsense_income" ||
                String(t.description || "")
                  .toLowerCase()
                  .includes("adsense") ||
                String(t.description || "")
                  .toLowerCase()
                  .includes("video ad"),
            );
            setAdsenseTransactions(filtered);
          }
        }
      } catch (err) {
        console.error("Failed to load user AdSense data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.user_id]);

  const adsenseRevenue = Number(wallet?.adsense_income ?? 0);
  const totalEarned = Number(wallet?.total_earned ?? 0);
  const walletBalance = Number(wallet?.balance ?? 0);

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
                Google AdSense Income
              </h1>
              <p className="text-sm text-muted-foreground">
                In-stream video ad revenue (70% creator share), skippable pre-rolls, and monetized
                display impressions backed by your genuine Hostinger ledger.
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
            <p className="text-2xl font-black text-yellow-400">₹{adsenseRevenue.toFixed(2)}</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Authoritative ledger total
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">
              Available Wallet Balance
            </span>
            <p className="text-2xl font-black text-foreground">₹{walletBalance.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">Ready for creator payout</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Cumulative Earned</span>
            <p className="text-2xl font-black text-emerald-400">₹{totalEarned.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">All income channels combined</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Creator Rev Share</span>
            <p className="text-2xl font-black text-emerald-400">70.0%</p>
            <p className="text-[11px] text-muted-foreground">Direct net earnings</p>
          </div>
        </div>

        {/* Ledger Transactions Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Authoritative AdSense Ledger Transactions
              </h3>
              <p className="text-xs text-muted-foreground">
                Settled in Hostinger MySQL{" "}
                <code className="font-mono text-brand">income_ledger</code>
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {adsenseTransactions.length} records
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="text-xs">Loading ledger transactions...</p>
            </div>
          ) : adsenseTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <p>No settled AdSense transactions recorded yet for user account.</p>
              <p className="text-[11px]">
                Ad impressions and view-time monetization are settled directly to your wallet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Source / Video</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Net Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adsenseTransactions.map((tx: any) => (
                    <tr
                      key={tx.id || tx.transactionId || tx.transaction_id}
                      className="transition hover:bg-secondary/20"
                    >
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {tx.created_at || tx.createdAt
                          ? new Date(tx.created_at || tx.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Settled"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-foreground font-bold">
                        {tx.transaction_id || tx.transactionId || tx.id}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {tx.description || tx.video_title || "Video Ad Impression Revenue"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          {tx.status || "settled"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-yellow-400 text-sm font-mono">
                        +₹{Number(tx.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </VideoHubLayout>
  );
}
