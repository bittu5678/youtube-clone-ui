import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Network,
  TrendingUp,
  Layers,
  Award,
  Search,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export const Route = createFileRoute("/team-members")({
  head: () => ({
    meta: [
      { title: "Team Members — FaceTube" },
      {
        name: "description",
        content:
          "Manage your FaceTube creator network, team hierarchy, and multi-tier team members across Levels 1–10.",
      },
    ],
  }),
  component: TeamMembersPage,
});

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  level: number;
  sponsor: string;
  sponsorUserId: string;
  joinedAt: string;
  role: string;
  rank: string;
  teamSize: number;
  status: "Active" | "Inactive";
  access: "Granted" | "Restricted";
}

const AVAILABLE_LEVELS = ["All", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function TeamMembersPage() {
  const { profile, dbUser, user } = useAuth();
  const currentUserId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "";

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [levelCounts, setLevelCounts] = useState<Record<number, number>>({});
  const [totalTeamCount, setTotalTeamCount] = useState(0);
  const [directCount, setDirectCount] = useState(0);

  const [selectedLevel, setSelectedLevel] = useState<number | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await api.referrals.getTeam(currentUserId || undefined);
      if (res && res.success) {
        setTeamMembers(res.members || []);
        setTotalTeamCount(Number(res.totalTeamCount) || 0);
        setDirectCount(Number(res.directCount) || 0);
        const counts: Record<number, number> = {};
        if (res.levelCounts) {
          for (const [k, v] of Object.entries(res.levelCounts)) {
            counts[Number(k)] = Number(v);
          }
        }
        setLevelCounts(counts);
      } else {
        const errorMsg = (res as any)?.error || "Failed to load team members from server.";
        setApiError(errorMsg);
        setTeamMembers([]);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Network error while connecting to team API.";
      setApiError(msg);
      setTeamMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const toggleAccess = (memberId: string) => {
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, access: m.access === "Granted" ? "Restricted" : "Granted" } : m,
      ),
    );
  };

  const filteredTeam = teamMembers.filter((m) => {
    const matchesLevel = selectedLevel === "All" || m.level === selectedLevel;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.userId.toLowerCase().includes(q) ||
      m.sponsor.toLowerCase().includes(q);
    return matchesLevel && matchesSearch;
  });

  const level1Count = levelCounts[1] ?? directCount;
  const level2Count = levelCounts[2] ?? 0;
  const extendedCount = Math.max(0, totalTeamCount - level1Count - level2Count);

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Team Members
              </h1>
              <p className="text-sm text-muted-foreground">
                Your creator network hierarchy and multi-level team structure across Levels 1–10
              </p>
            </div>
          </div>

          <Link
            to="/team-income"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
            View Team Income
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>

        {/* Team Tier Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Team Size</span>
              <Layers className="h-4 w-4 text-brand" />
            </div>
            <p className="text-2xl font-black text-foreground">
              {isLoading ? "—" : `${totalTeamCount} Members`}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold">Across Levels 1–10</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Level 1 (Direct)</span>
              <Network className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-foreground">
              {isLoading ? "—" : `${level1Count} Members`}
            </p>
            <p className="text-[11px] text-muted-foreground">Your direct frontline</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Level 2 (Secondary)</span>
              <Users className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-foreground">
              {isLoading ? "—" : `${level2Count} Members`}
            </p>
            <p className="text-[11px] text-muted-foreground">Secondary tier downline</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Levels 3–10 (Extended)</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">
              {isLoading ? "—" : `${extendedCount} Members`}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold">Extended network</p>
          </div>
        </div>

        {/* Level Filters & Search */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Level Pill Tabs (All, 1, 2, ... 10) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {AVAILABLE_LEVELS.map((lvl) => {
                const count = lvl === "All" ? totalTeamCount : (levelCounts[lvl] ?? 0);
                const isActive = selectedLevel === lvl;
                return (
                  <button
                    key={String(lvl)}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      isActive
                        ? "bg-brand text-white shadow-sm"
                        : "border border-border bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <span>{lvl === "All" ? "All Levels" : `Level ${lvl}`}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-background/80 text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search team by name, ID, sponsor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* API Error State */}
        {apiError && !isLoading && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center space-y-3">
            <AlertCircle className="h-7 w-7 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-rose-500">Failed to load real team members</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">{apiError}</p>
            <button
              type="button"
              onClick={fetchTeamMembers}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3 shadow-card">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">
              Loading multi-level team network from database...
            </p>
          </div>
        )}

        {/* Team Table */}
        {!isLoading && !apiError && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-center w-12 whitespace-nowrap">S.No.</th>
                    <th className="px-4 py-3 whitespace-nowrap">Member</th>
                    <th className="px-4 py-3 whitespace-nowrap">User ID</th>
                    <th className="px-4 py-3 whitespace-nowrap">Level</th>
                    <th className="px-4 py-3 whitespace-nowrap">Direct Sponsor</th>
                    <th className="px-4 py-3 whitespace-nowrap">Rank</th>
                    <th className="px-4 py-3 whitespace-nowrap">Downline Team</th>
                    <th className="px-4 py-3 whitespace-nowrap">Joined Date</th>
                    <th className="px-4 py-3 whitespace-nowrap">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTeam.map((m, index) => (
                    <tr key={m.id} className="transition hover:bg-secondary/20">
                      {/* S.No. (auto-generated 1, 2, 3...) */}
                      <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </td>

                      {/* Member */}
                      <td className="px-4 py-3.5 font-bold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-[11px] font-bold text-foreground">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{m.name}</span>
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-rose-400">
                        {m.userId}
                      </td>

                      {/* Level */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 font-bold text-[10px] ${
                            m.level === 1
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : m.level === 2
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-secondary text-foreground"
                          }`}
                        >
                          Level {m.level}
                        </span>
                      </td>

                      {/* Direct Sponsor */}
                      <td className="px-4 py-3.5 text-muted-foreground">{m.sponsor}</td>

                      {/* Rank */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <Award className="h-3 w-3" />
                          {m.rank}
                        </span>
                      </td>

                      {/* Downline Team */}
                      <td className="px-4 py-3.5 text-muted-foreground font-semibold">
                        {m.teamSize} {m.teamSize === 1 ? "referral" : "referrals"}
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="h-3 w-3 opacity-60" />
                          {m.joinedAt ? m.joinedAt.split(" ")[0]?.split("T")[0] : "Recent"}
                        </div>
                      </td>

                      {/* Access Toggle */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={m.access === "Granted"}
                            onCheckedChange={() => toggleAccess(m.id)}
                            aria-label={`Toggle access for ${m.name}`}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              m.access === "Granted"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {m.access}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredTeam.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                        {searchTerm ? (
                          <span>No team members found matching "{searchTerm}".</span>
                        ) : selectedLevel !== "All" ? (
                          <span>No team members found in Level {selectedLevel}.</span>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              No team members found in your network yet.
                            </p>
                            <p className="text-xs">
                              Share your unique referral link to sponsor creators and build your
                              multi-level team.
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </VideoHubLayout>
  );
}
