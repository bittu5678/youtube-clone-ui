import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Globe2,
  TrendingUp,
  Award,
  DollarSign,
  PieChart,
  Calendar,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Users,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import {
  getUserLedger,
  getUserWallet,
  getEligibleGlobalIncomeUsers,
  type LedgerTransaction,
  type UserWallet,
} from "@/lib/ledger-service";
import { isSpecialGlobalTransaction } from "@/server/payments";

export const Route = createFileRoute("/global-income")({
  head: () => ({
    meta: [
      { title: "Global Income Pool — FaceTube" },
      {
        name: "description",
        content:
          "Worldwide revenue share pool, database-driven ₹3 Premium Video distributions, and Special Transaction rules on FaceTube.",
      },
    ],
  }),
  component: GlobalIncomePage,
});

function GlobalIncomePage() {
  const { profile, dbUser, user } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [globalTransactions, setGlobalTransactions] = useState<LedgerTransaction[]>([]);
  const [eligibleCreators, setEligibleCreators] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      getUserWallet(userId),
      getUserLedger(userId),
      getEligibleGlobalIncomeUsers(),
    ]).then(([w, ledger, eligible]) => {
      setWallet(w);
      setGlobalTransactions(ledger.filter((t) => t.incomeType === "global_income"));
      setEligibleCreators(eligible);
    });
  }, [userId]);

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  Global Income Pool
                </h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400">
                  ₹3 / Premium Video Allocation
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automated platform revenue share distributed equally among all eligible Premium
                Video creators
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/wallet-balance"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Wallet className="h-3.5 w-3.5" />
              Transfer to Wallet
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* REQUIREMENT 8: GLOBAL INCOME ARCHITECTURE BANNER                   */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-card to-card p-6 shadow-card space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                Database-Driven Rule
              </span>
              <h2 className="text-xl font-black text-foreground mt-0.5">
                ₹6 Premium Video Transaction Distribution Breakup
              </h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground font-mono">
              Server-authoritative calculation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* ₹1 Direct Referrer */}
            <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-1">
              <span className="text-muted-foreground text-[11px] block">Direct Referrer</span>
              <div className="text-xl font-black text-emerald-400">₹1.00</div>
              <p className="text-[11px] text-muted-foreground">
                Direct commission to frontline inviter
              </p>
            </div>

            {/* ₹1 Admin Allocation */}
            <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-1">
              <span className="text-muted-foreground text-[11px] block">Admin Allocation</span>
              <div className="text-xl font-black text-foreground">₹1.00</div>
              <p className="text-[11px] text-muted-foreground">Company infrastructure & servers</p>
            </div>

            {/* ₹3 Global Income Pool */}
            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-4 space-y-1">
              <span className="text-cyan-300 font-bold text-[11px] block">Global Income Pool</span>
              <div className="text-xl font-black text-cyan-400">₹3.00</div>
              <p className="text-[11px] text-muted-foreground">
                Divided among eligible premium creators
              </p>
            </div>

            {/* ₹1 Taxes & PG */}
            <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-1">
              <span className="text-muted-foreground text-[11px] block">GST & Payment Fees</span>
              <div className="text-xl font-black text-foreground">₹1.00</div>
              <p className="text-[11px] text-muted-foreground">
                18% GST (₹0.90) + 2% PG Charge (₹0.10)
              </p>
            </div>
          </div>

          {/* Eligibility Rule Warning */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200/90 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Global Income Pool Eligibility Rule:</strong> Only
              eligible creators who have uploaded <strong>Premium Videos</strong> are counted for
              Global Income distribution. Creators who have uploaded only Free Videos are strictly
              excluded from the pool calculation. Currently{" "}
              <strong>{eligibleCreators.length} creators</strong> are eligible.
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* REQUIREMENT 9: SPECIAL PREMIUM TRANSACTION NUMBERS                 */}
        {/* 11th, 21st, 31st, 41st, 51st... SPECIAL_GLOBAL_RULE                */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-400 fill-purple-400" />
              <h2 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wide">
                Special Premium Video Transactions Engine
              </h2>
            </div>
            <span className="rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300 font-mono">
              SPECIAL_GLOBAL_RULE
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            By system business rule, the <strong>11th, 21st, 31st, 41st, 51st</strong>, and every
            10th transaction thereafter are designated as <strong>Special Transactions</strong>.
            These transactions do not follow normal Global Income Pool division and are tagged as{" "}
            <code>SPECIAL_GLOBAL_RULE</code> / <code>SPECIAL_TRANSACTION</code> with configurable
            allocations for administrative control.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
            {[11, 21, 31, 41, 51, 61].map((num) => (
              <div
                key={num}
                className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 text-center font-mono"
              >
                <span className="text-[10px] text-purple-300 uppercase block">Special Tx</span>
                <span className="text-base font-black text-purple-200">{num}th</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Your Global Income</span>
            <p className="text-2xl font-black text-cyan-400">
              {wallet ? `₹${wallet.globalIncome.toFixed(2)}` : "₹2,450.00"}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Eligible creator share
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Eligible Creators</span>
            <p className="text-2xl font-black text-foreground">{eligibleCreators.length}</p>
            <p className="text-[11px] text-muted-foreground">Sponsor uploaders only</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Pool Share Per Video</span>
            <p className="text-2xl font-black text-foreground">
              ₹{(3.0 / Math.max(1, eligibleCreators.length)).toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground">₹3 pool divided equally</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Distribution Status</span>
            <p className="text-2xl font-black text-emerald-400">Automated</p>
            <p className="text-[11px] text-muted-foreground">Server ledger synced</p>
          </div>
        </div>

        {/* Global Income Ledger Transactions */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Global Income Ledger Entries</h3>
            <span className="text-xs text-muted-foreground">Live database ledger records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Transaction ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Source Member</th>
                  <th className="px-4 py-3 whitespace-nowrap">Description</th>
                  <th className="px-4 py-3 whitespace-nowrap">Tag / Rule</th>
                  <th className="px-4 py-3 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {globalTransactions.length > 0 ? (
                  globalTransactions.map((tx) => (
                    <tr key={tx.id} className="transition hover:bg-secondary/20">
                      <td className="px-4 py-3 font-mono text-xs text-cyan-400">
                        {tx.transactionId}
                      </td>
                      <td className="px-4 py-3 text-foreground font-bold">
                        {tx.sourceUserName || tx.sourceUserId || "Global System"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {tx.specialTag ? (
                          <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 font-mono">
                            {tx.specialTag}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Normal Pool</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-black text-cyan-400">
                        +₹{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Settled
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No global income pool distributions found for this account. Distributions
                      occur automatically when users upload Premium Videos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
