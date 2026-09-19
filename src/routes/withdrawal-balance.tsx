import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Download,
  Wallet,
  Building,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/withdrawal-balance")({
  head: () => ({
    meta: [
      { title: "Withdrawal Balance — FaceTube" },
      {
        name: "description",
        content: "Track your FaceTube payout history, completed bank transfers, and withdrawal receipts.",
      },
    ],
  }),
  component: WithdrawalBalancePage,
});

const mockWithdrawals = [
  {
    id: "wd-9821",
    amount: "$1,200.00",
    method: "Direct Bank Transfer (ACH)",
    account: "Chase Checking (****4819)",
    date: "Sep 18, 2026",
    status: "Completed",
    txHash: "ACH-981249102",
  },
  {
    id: "wd-9420",
    amount: "$950.00",
    method: "Crypto (USDT TRC-20)",
    account: "TX819...492b",
    date: "Sep 04, 2026",
    status: "Completed",
    txHash: "0x48f9...391a",
  },
  {
    id: "wd-8890",
    amount: "$1,000.00",
    method: "Direct Bank Transfer (ACH)",
    account: "Chase Checking (****4819)",
    date: "Aug 20, 2026",
    status: "Completed",
    txHash: "ACH-819240182",
  },
];

function WithdrawalBalancePage() {
  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-orange-400">
              <ArrowDownToLine className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Withdrawal Balance
              </h1>
              <p className="text-sm text-muted-foreground">
                History of completed payouts, transfer receipts, and settlement records
              </p>
            </div>
          </div>

          <Link
            to="/wallet-balance"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
          >
            <Wallet className="h-3.5 w-3.5" />
            Request New Withdrawal
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Withdrawn</span>
            <p className="text-2xl font-black text-orange-400">$3,150.00</p>
            <p className="text-[11px] text-muted-foreground">Lifetime successful</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Last Payout</span>
            <p className="text-2xl font-black text-foreground">$1,200.00</p>
            <p className="text-[11px] text-emerald-400 font-semibold">Settled Sep 18</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Payout Method</span>
            <p className="text-2xl font-black text-foreground">ACH Direct</p>
            <p className="text-[11px] text-muted-foreground">Chase ****4819</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Average Processing</span>
            <p className="text-2xl font-black text-emerald-400">&lt; 2 Hours</p>
            <p className="text-[11px] text-muted-foreground">Instant automated</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Withdrawal History & Receipts</h3>
            <span className="text-xs text-muted-foreground">3 Completed Transfers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Destination Method</th>
                  <th className="px-4 py-3">Account Details</th>
                  <th className="px-4 py-3">Settled Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockWithdrawals.map((item) => (
                  <tr key={item.id} className="transition hover:bg-secondary/20">
                    <td className="px-4 py-3.5 font-mono font-bold text-foreground">{item.id}</td>
                    <td className="px-4 py-3.5 font-medium text-foreground">{item.method}</td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]">
                      {item.account}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{item.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-orange-400 text-sm">
                      {item.amount}
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
