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
    earned: "₹420.00",
  },
  {
    name: "Shure SM7B Vocal Microphone",
    partner: "Amazon Associates",
    clicks: "3,180",
    sales: "42",
    rate: "4.0%",
    earned: "₹210.80",
  },
  {
    name: "Complete UI/UX Design System Course",
    partner: "FaceTube Academy",
    clicks: "890",
    sales: "26",
    rate: "25.0%",
    earned: "₹310.00",
  },
];

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

function AffiliateIncomePage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [affiliateTransactions, setAffiliateTransactions] = useState<any[]>([]);
  const [marketingPercentage, setMarketingPercentage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [wRes, txRes, settingsRes] = await Promise.all([
          api.wallet.getBalance(user?.user_id),
          api.wallet.getTransactions(user?.user_id, 50),
          api.admin.getSettings().catch(() => null),
        ]);
        if (isMounted) {
          if (wRes && wRes.success && wRes.wallet) {
            setWallet(wRes.wallet);
          }
          if (settingsRes && settingsRes.success && settingsRes.settings) {
            setMarketingPercentage(settingsRes.settings.marketing_income_percentage ?? 10);
          }
          if (txRes && txRes.success && Array.isArray(txRes.transactions)) {
            const filtered = txRes.transactions.filter(
              (t: any) =>
                t.income_type === "affiliate_income" ||
                t.income_type === "marketing_income" ||
                t.incomeType === "affiliate_income" ||
                t.incomeType === "marketing_income" ||
                t.purpose === "affiliate_income" ||
                t.purpose === "marketing_income" ||
                String(t.description || "").toLowerCase().includes("affiliate") ||
                String(t.description || "").toLowerCase().includes("marketing") ||
                String(t.description || "").toLowerCase().includes("ad promotion"),
            );
            setAffiliateTransactions(filtered);
          }
        }
      } catch (err) {
        console.error("Failed to load user Affiliate data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.user_id]);

  const affiliateRevenue = Number(wallet?.affiliate_income ?? 0);
  const totalEarned = Number(wallet?.total_earned ?? 0);
  const walletBalance = Number(wallet?.balance ?? 0);

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
                Affiliate &amp; Marketing Income
              </h1>
              <p className="text-sm text-muted-foreground">
                Commissions earned from Ad Promotion marketing ({marketingPercentage}% platform rate),
                gear recommendations, and campaign referrals backed by your Hostinger ledger.
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
            <p className="text-2xl font-black text-indigo-400">₹{affiliateRevenue.toFixed(2)}</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Authoritative ledger total
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Available Balance</span>
            <p className="text-2xl font-black text-foreground">₹{walletBalance.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">Ready for creator withdrawal</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Cumulative Earned</span>
            <p className="text-2xl font-black text-foreground">₹{totalEarned.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">Across all income streams</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Marketing Rate</span>
            <p className="text-2xl font-black text-emerald-400">{marketingPercentage}%</p>
            <p className="text-[11px] text-muted-foreground">Admin platform setting</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Authoritative Affiliate &amp; Marketing Transactions
              </h3>
              <p className="text-xs text-muted-foreground">
                Settled in Hostinger MySQL <code className="font-mono text-brand">income_ledger</code>
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {affiliateTransactions.length} records
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="text-xs">Loading affiliate ledger...</p>
            </div>
          ) : affiliateTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <p>No settled affiliate or marketing transactions recorded yet for this account.</p>
              <p className="text-[11px]">
                Earn {marketingPercentage}% on Ad Promotion campaigns when creators register with your sponsor link.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Description / Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Net Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {affiliateTransactions.map((tx: any) => (
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
                        {tx.description || "Ad Promotion Affiliate Commission"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          {tx.status || "settled"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-indigo-400 text-sm font-mono">
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
