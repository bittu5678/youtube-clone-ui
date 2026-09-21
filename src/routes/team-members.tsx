import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/team-members")({
  head: () => ({
    meta: [
      { title: "Team Members — FaceTube" },
      {
        name: "description",
        content:
          "Manage your FaceTube creator network, team hierarchy, and multi-tier team members.",
      },
    ],
  }),
  component: TeamMembersPage,
});

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  level: number;
  sponsor: string;
  rank: string;
  teamSize: number;
  monthlyVolume: string;
  status: "Active" | "Inactive";
  access: "Granted" | "Restricted";
}

const mockTeamMembers: TeamMember[] = [
  {
    id: "tm-1",
    userId: "FT928412",
    name: "Alex Rivera",
    level: 1,
    sponsor: "You",
    rank: "Diamond Creator",
    teamSize: 38,
    monthlyVolume: "$12,400",
    status: "Active",
    access: "Granted",
  },
  {
    id: "tm-2",
    userId: "FT810492",
    name: "Samantha Chen",
    level: 1,
    sponsor: "You",
    rank: "Gold Creator",
    teamSize: 14,
    monthlyVolume: "$6,850",
    status: "Active",
    access: "Granted",
  },
  {
    id: "tm-3",
    userId: "FT748190",
    name: "Marcus Vance",
    level: 1,
    sponsor: "You",
    rank: "Platinum Creator",
    teamSize: 22,
    monthlyVolume: "$9,200",
    status: "Active",
    access: "Granted",
  },
  {
    id: "tm-4",
    userId: "FT381902",
    name: "Tariq Mansoor",
    level: 2,
    sponsor: "Alex Rivera (FT928412)",
    rank: "Silver Creator",
    teamSize: 9,
    monthlyVolume: "$3,400",
    status: "Active",
    access: "Granted",
  },
  {
    id: "tm-5",
    userId: "FT291048",
    name: "Clara Oswald",
    level: 2,
    sponsor: "Marcus Vance (FT748190)",
    rank: "Bronze Creator",
    teamSize: 4,
    monthlyVolume: "$1,890",
    status: "Active",
    access: "Restricted",
  },
  {
    id: "tm-6",
    userId: "FT194820",
    name: "Jordan Lee",
    level: 3,
    sponsor: "Tariq Mansoor (FT381902)",
    rank: "Rising Star",
    teamSize: 2,
    monthlyVolume: "$750",
    status: "Active",
    access: "Granted",
  },
];

function TeamMembersPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [selectedLevel, setSelectedLevel] = useState<number | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");

  const toggleAccess = (memberId: string) => {
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, access: m.access === "Granted" ? "Restricted" : "Granted" } : m,
      ),
    );
  };

  const filteredTeam = teamMembers.filter((m) => {
    const matchesLevel = selectedLevel === "All" || m.level === selectedLevel;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

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
                Your creator network hierarchy, tier breakdown, and multi-level team structure
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
            <p className="text-2xl font-black text-foreground">89 Members</p>
            <p className="text-[11px] text-emerald-400 font-semibold">Across 5 Tiers</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Level 1 (Direct)</span>
              <Network className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-foreground">24 Members</p>
            <p className="text-[11px] text-muted-foreground">Your direct frontline</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Level 2 (Secondary)</span>
              <Users className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-foreground">41 Members</p>
            <p className="text-[11px] text-muted-foreground">5% override tier</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Monthly Team Volume</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">$34,490</p>
            <p className="text-[11px] text-emerald-400 font-semibold">+18.2% vs last month</p>
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["All", 1, 2, 3] as const).map((lvl) => (
              <button
                key={String(lvl)}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedLevel === lvl
                    ? "bg-brand text-white shadow-sm"
                    : "border border-border bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {lvl === "All" ? "All Levels" : `Level ${lvl}`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {/* Team Table */}
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
                  <th className="px-4 py-3 text-right whitespace-nowrap">Monthly Volume</th>
                  <th className="px-4 py-3 whitespace-nowrap">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTeam.map((m, index) => (
                  <tr key={m.id} className="transition hover:bg-secondary/20">
                    {/* S.No. (auto-generated 1,2,3...) */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </td>

                    {/* Member */}
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-[11px] font-bold text-foreground">
                          {m.name.charAt(0)}
                        </div>
                        {m.name}
                      </div>
                    </td>

                    {/* User ID */}
                    <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-rose-400">
                      {m.userId}
                    </td>

                    {/* Level */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 font-bold text-foreground text-[10px]">
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
                      {m.teamSize} creators
                    </td>

                    {/* Monthly Volume */}
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-400 font-mono text-xs">
                      {m.monthlyVolume}
                    </td>

                    {/* Access (immediately after Monthly Volume) */}
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
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No team members found matching your search.
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
