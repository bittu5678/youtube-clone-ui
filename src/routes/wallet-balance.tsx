import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/wallet-balance")({
  head: () => ({
    meta: [
      { title: "Wallet Balance — FaceTube" },
      {
        name: "description",
        content: "View your available FaceTube creator wallet balance, payout methods, and transfer funds.",
      },
    ],
  }),
  component: WalletBalancePage,
});

function WalletBalancePage() {
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [withdrawing, setWithdrawing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setSuccessMsg(`Withdrawal request for $${withdrawAmount}.00 submitted successfully!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    }, 800);
  };

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Wallet Balance
              </h1>
              <p className="text-sm text-muted-foreground">
                Your unified creator wallet aggregating referral, ad, team, and affiliate payouts
              </p>
            </div>
          </div>

          <Link
            to="/withdrawal-balance"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Withdrawal History
          </Link>
        </div>

        {/* Big Balance Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 sm:p-8 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Total Available Balance
              </span>
              <div className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                $4,280.50
              </div>
              <p className="text-xs text-muted-foreground">
                Instant withdrawal eligible · No processing fees on direct ACH or Crypto
              </p>
            </div>

            {/* Quick Withdraw Form */}
            <form
              onSubmit={handleWithdraw}
              className="rounded-xl border border-border bg-background/80 p-4 space-y-3 w-full md:w-80 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Quick Withdraw:</span>
                <span className="text-emerald-400 font-bold">$4,280.50 max</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card pl-7 pr-3 py-1.5 text-sm font-bold text-foreground focus:border-brand focus:outline-none"
                  min="50"
                  max="4280"
                />
              </div>
              <button
                type="submit"
                disabled={withdrawing}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                <ArrowDownToLine className="h-4 w-4" />
                {withdrawing ? "Processing..." : `Withdraw $${withdrawAmount}.00`}
              </button>
              {successMsg && (
                <p className="text-[11px] font-bold text-emerald-400 text-center animate-fadeIn">
                  {successMsg}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Streams Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Referral & Team</span>
            <p className="text-xl font-bold text-foreground">$1,079.50</p>
            <p className="text-[11px] text-muted-foreground">Direct + downline</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Video AdSense</span>
            <p className="text-xl font-bold text-yellow-400">$1,890.20</p>
            <p className="text-[11px] text-muted-foreground">70% creator share</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Global Pool</span>
            <p className="text-xl font-bold text-cyan-400">$2,450.00</p>
            <p className="text-[11px] text-muted-foreground">Diamond rank bonus</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Affiliate Links</span>
            <p className="text-xl font-bold text-indigo-400">$940.80</p>
            <p className="text-[11px] text-muted-foreground">Product sales</p>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
