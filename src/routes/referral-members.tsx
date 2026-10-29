import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  Phone,
  MessageCircle,
  ShieldCheck,
  Network,
  Video,
  Zap,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import { Switch } from "@/components/ui/switch";
import {
  getReferralDashboardData,
  type ReferralDashboardData,
  type ReferralMemberSummary,
} from "@/lib/referral-service";

export const Route = createFileRoute("/referral-members")({
  head: () => ({
    meta: [
      { title: "Referral & Team Members — FaceTube" },
      {
        name: "description",
        content:
          "Track your Direct Referrals, Team Members, and earned referral commissions on FaceTube.",
      },
    ],
  }),
  component: ReferralMembersPage,
});

function getTelUrl(mobile: string): string {
  const hasPlus = mobile.trim().startsWith("+");
  const digits = mobile.replace(/\D/g, "");
  return `tel:${hasPlus ? "+" : ""}${digits}`;
}

function getWaUrl(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function ReferralMembersPage() {
  const { profile, dbUser, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";

  const [data, setData] = useState<ReferralDashboardData>({
    directReferralsCount: 0,
    teamMembersCount: 0,
    referralIncome: 0.0,
    referralCode: userId,
    referralNumber: profile?.mobile || dbUser?.mobile || "",
    referralLink: `https://facetube.online/register?ref=${userId}`,
    members: [],
  });

  useEffect(() => {
    getReferralDashboardData(userId).then((res) => {
      setData(res);
    });
  }, [userId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    toast.success("Referral Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopiedCode(true);
    toast.success("Referral Code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleAccess = (memberId: string) => {
    setData((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === memberId ? { ...m, access: m.access === "Granted" ? "Restricted" : "Granted" } : m,
      ),
    }));
  };

  const filteredMembers = data.members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.mobile.toLowerCase().includes(searchTerm.toLowerCase()),
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
                Referral & Team Members
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your registered direct referrals, team members, and earned commissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/direct-referral-income"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Referral Income Ledger
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </div>
        </div>

        {data.isStale && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Offline Cache:</strong> Showing locally cached referral data. Live team
              statistics could not be synced from the server.
            </span>
          </div>
        )}

        {/* Top Referral Information Card */}
        <div className="rounded-3xl border border-brand/40 bg-gradient-to-br from-brand/10 via-card to-card p-6 shadow-card space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border/70 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/15 px-3 py-1 text-xs font-bold text-brand">
                <Network className="h-3.5 w-3.5" />
                Referral Program Overview
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Invite Creators & Build Your Team
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl">
                Invite creators to register using your referral link or referral code to build your
                creator team.
              </p>
            </div>

            {/* Referral Credentials: Link, Code & Number */}
            <div className="space-y-3 w-full lg:w-auto min-w-[320px]">
              {/* Referral Link */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Referral Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={data.referralLink}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-muted-foreground select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm shrink-0 ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-brand text-white hover:bg-brand-dark"
                    }`}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                </div>
              </div>

              {/* Referral Code & Referral Number */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-background/80 p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Referral Code
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-sm font-black text-foreground">
                      {data.referralCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy Code"
                    >
                      {copiedCode ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/80 p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Referral Number
                  </span>
                  <div className="font-mono text-xs font-bold text-foreground mt-1 truncate">
                    {data.referralNumber}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* 1. Direct Referral */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-sm">
              <span className="text-xs text-muted-foreground font-medium block">
                Direct Referral
              </span>
              <p className="text-2xl font-black text-foreground">{data.directReferralsCount}</p>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Personally referred
              </p>
            </div>

            {/* 2. Team Members */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-1 shadow-sm">
              <span className="text-xs font-bold text-blue-400 block">Team Members</span>
              <p className="text-2xl font-black text-blue-300">{data.teamMembersCount}</p>
              <p className="text-[11px] text-muted-foreground">Full network downline</p>
            </div>

            {/* 3. Referral Income / Direct Commission */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1 shadow-sm">
              <span className="text-xs font-bold text-amber-400 block">
                Referral Income / Direct Commission
              </span>
              <p className="text-2xl font-black text-amber-300">
                ₹{data.referralIncome.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">From verified video activity</p>
            </div>

            {/* 4. Active Creators */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1 shadow-sm">
              <span className="text-xs font-bold text-emerald-400 block">Active Channels</span>
              <p className="text-2xl font-black text-emerald-300">
                {data.members.filter((m) => m.status === "Active").length}
              </p>
              <p className="text-[11px] text-muted-foreground">Active downline channels</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, User ID, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Showing <strong>{filteredMembers.length}</strong> direct members
          </span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* REQUIREMENT 7 & 11: MEMBERS & UPLOADED VIDEOS TABLE                */}
        {/* Displays Free vs Premium uploads and ₹1 commission per Premium vid */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-center w-12 whitespace-nowrap">S.No.</th>
                  <th className="px-4 py-3 whitespace-nowrap">Member</th>
                  <th className="px-4 py-3 whitespace-nowrap">User ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Mobile Number</th>
                  <th className="px-4 py-3 whitespace-nowrap">Joined</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Free Videos</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Sponsor Videos</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Direct Commission</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member, index) => (
                  <tr key={member.id} className="transition hover:bg-secondary/20">
                    {/* S.No. */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </td>

                    {/* Member Name & Email */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 font-bold text-brand shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{member.name}</div>
                          <div className="text-[11px] text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* User ID */}
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-rose-400 whitespace-nowrap">
                      {member.userId}
                    </td>

                    {/* Mobile with Click to Call & WhatsApp */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-foreground">
                          {member.mobile}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={getTelUrl(member.mobile)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary/60 text-foreground transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 active:scale-95"
                            title={`Call ${member.name}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={getWaUrl(member.mobile)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary/60 text-emerald-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:text-emerald-300 active:scale-95"
                            title={`WhatsApp chat with ${member.name}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                      {member.joinedAt}
                    </td>

                    {/* Free Videos Uploaded */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-sky-400 whitespace-nowrap">
                      {member.freeVideosCount}
                    </td>

                    {/* Premium Videos Uploaded */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-amber-400 whitespace-nowrap">
                      {member.premiumVideosCount}
                    </td>

                    {/* Direct Commission Earned */}
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-black text-emerald-400 whitespace-nowrap">
                      ₹{member.directCommissionEarned.toFixed(2)}
                    </td>

                    {/* Access Toggle */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleAccess(member.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          member.access === "Granted"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {member.access === "Granted" ? "Active" : "Restricted"}
                      </button>
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
