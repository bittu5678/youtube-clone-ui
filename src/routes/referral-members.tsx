import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  UserPlus,
  Copy,
  Check,
  Share2,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/referral-members")({
  head: () => ({
    meta: [
      { title: "Referral Members — FaceTube" },
      {
        name: "description",
        content: "View your direct referral members, invite link, and referral commission history on FaceTube.",
      },
    ],
  }),
  component: ReferralMembersPage,
});

interface ReferralMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
  status: "Active" | "Pending";
  tier: string;
  earnings: string;
  videosCount: number;
}

const mockReferrals: ReferralMember[] = [
  {
    id: "ref-1",
    userId: "FT928412",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    joinedAt: "Today, 11:20 AM",
    status: "Active",
    tier: "Creator Pro",
    earnings: "$184.50",
    videosCount: 14,
  },
  {
    id: "ref-2",
    userId: "FT810492",
    name: "Samantha Chen",
    email: "sam.chen@example.com",
    joinedAt: "Yesterday",
    status: "Active",
    tier: "Creator",
    earnings: "$92.00",
    videosCount: 8,
  },
  {
    id: "ref-3",
    userId: "FT748190",
    name: "Marcus Vance",
    email: "m.vance@example.com",
    joinedAt: "3 days ago",
    status: "Active",
    tier: "Creator Pro",
    earnings: "$310.80",
    videosCount: 29,
  },
  {
    id: "ref-4",
    userId: "FT619024",
    name: "Elena Rostova",
    email: "elena.r@example.com",
    joinedAt: "5 days ago",
    status: "Active",
    tier: "Creator",
    earnings: "$64.20",
    videosCount: 5,
  },
  {
    id: "ref-5",
    userId: "FT582019",
    name: "Devon Brooks",
    email: "d.brooks@example.com",
    joinedAt: "1 week ago",
    status: "Pending",
    tier: "Free",
    earnings: "$0.00",
    videosCount: 1,
  },
  {
    id: "ref-6",
    userId: "FT419820",
    name: "Priya Sharma",
    email: "priya.s@example.com",
    joinedAt: "2 weeks ago",
    status: "Active",
    tier: "Creator Pro",
    earnings: "$428.00",
    videosCount: 42,
  },
];

function ReferralMembersPage() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const referralCode = profile?.user_id || "FT610200";
  const referralLink = `https://facetube.app/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredMembers = mockReferrals.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Referral Members
              </h1>
              <p className="text-sm text-muted-foreground">
                Track and manage creators who registered using your direct referral link
              </p>
            </div>
          </div>

          <Link
            to="/direct-referral-income"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
            View Referral Earnings
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>

        {/* Invite Link Card */}
        <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-card to-card p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-brand/20 px-2 py-0.5 text-[11px] font-bold text-brand uppercase tracking-wider">
                  Your Referral Link
                </span>
                <span className="text-xs text-muted-foreground">Code: <strong className="text-foreground">{referralCode}</strong></span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                Share your link to earn 10% direct commissions on all member ad revenue & subscriptions.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-80 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-muted-foreground truncate font-mono select-all">
                {referralLink}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm shrink-0 ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-brand text-white hover:bg-brand-dark"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <p className="text-xs text-muted-foreground font-medium">Direct Referrals</p>
            <p className="text-2xl font-black text-foreground">24</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +4 this week
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <p className="text-xs text-muted-foreground font-medium">Active Members</p>
            <p className="text-2xl font-black text-emerald-400">21</p>
            <p className="text-[11px] text-muted-foreground">87.5% active rate</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <p className="text-xs text-muted-foreground font-medium">Total Direct Income</p>
            <p className="text-2xl font-black text-amber-400">$1,079.50</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 10% direct rate
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <p className="text-xs text-muted-foreground font-medium">Videos Uploaded</p>
            <p className="text-2xl font-black text-foreground">186</p>
            <p className="text-[11px] text-muted-foreground">Across all referrals</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, User ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Showing <strong>{filteredMembers.length}</strong> members
          </span>
        </div>

        {/* Members Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Videos</th>
                  <th className="px-4 py-3 text-right">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="transition hover:bg-secondary/20">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 font-bold text-brand">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{member.name}</div>
                          <div className="text-[11px] text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-rose-400">
                      {member.userId}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{member.joinedAt}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          member.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {member.status === "Active" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">
                      {member.videosCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                      {member.earnings}
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
