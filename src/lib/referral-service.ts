import { api } from "./api";
import { getLocalDbUsers } from "./user-service";
import { getStoredVideos } from "./video-service";
import { getUserLedger } from "./ledger-service";

export interface ReferralMemberSummary {
  id: string;
  userId: string;
  name: string;
  email: string;
  mobile: string;
  joinedAt: string;
  status: "Active" | "Pending";
  tier: string;
  freeVideosCount: number;
  premiumVideosCount: number;
  totalVideosCount: number;
  directCommissionEarned: number; // ₹1 per premium video
  access: "Granted" | "Restricted";
}

export interface ReferralDashboardData {
  directReferralsCount: number;
  teamMembersCount: number; // MUST be labeled Team Members
  referralIncome: number; // Total direct commission in ₹
  referralCode: string;
  referralNumber: string;
  referralLink: string;
  members: ReferralMemberSummary[];
}

/**
 * Calculates referral network data from the actual database/users/videos records
 */
export async function getReferralDashboardData(
  currentUserId: string,
): Promise<ReferralDashboardData> {
  const normId = currentUserId.trim().toUpperCase();

  try {
    const res = await api.referrals.getDashboard(normId);
    if (res && res.dashboard) {
      const d = res.dashboard;
      return {
        directReferralsCount: Number(d.directReferralsCount) || 0,
        teamMembersCount: Number(d.teamMembersCount) || 0,
        referralIncome: Number(d.referralIncome) || 0,
        referralCode: d.referralCode || normId,
        referralNumber: d.referralNumber || normId,
        referralLink: d.referralLink || `https://facetube.online/register?ref=${normId}`,
        members: (d.members || []).map((m: any) => ({
          id: m.id,
          userId: m.userId || m.user_id,
          name: m.name,
          email: m.email,
          mobile: m.mobile,
          joinedAt: m.joinedAt || m.created_at || "Recent",
          status: m.status || "Active",
          tier: m.tier || "Creator Pro",
          freeVideosCount: Number(m.freeVideosCount) || 0,
          premiumVideosCount: Number(m.premiumVideosCount) || 0,
          totalVideosCount: Number(m.totalVideosCount) || 0,
          directCommissionEarned: Number(m.directCommissionEarned) || 0,
          access: m.access || "Granted",
        })),
      };
    }
  } catch (_e) {
    // fallback to local calculation
  }

  const dbUsers = getLocalDbUsers();
  const allVideos = getStoredVideos();
  const ledger = await getUserLedger(normId);

  // Direct referrals: users registered with referral_code matching this user's user_id or verified promotional alias
  const currentUserRecord = dbUsers.find((u) => u.user_id.toUpperCase() === normId);
  const knownAliases: Record<string, string[]> = {
    FT102857: ["FTVIP"],
    FT483921: ["CREATOR50"],
  };
  const mySponsorCodes = new Set([
    normId,
    ...(knownAliases[normId] || []).map((a) => a.toUpperCase()),
  ]);
  const shareCode = knownAliases[normId]?.[0] || normId;

  // Find direct referrals from genuine database / stored users
  const directUsers = dbUsers.filter(
    (u) =>
      u.user_id.toUpperCase() !== normId &&
      Boolean(u.referral_code && mySponsorCodes.has(u.referral_code.toUpperCase())),
  );

  const directUserIds = new Set(directUsers.map((u) => u.user_id.toUpperCase()));

  // Calculate multi-level downline across Levels 1–10 for fallback
  const visited = new Set<string>([normId]);
  let currentParents: string[] = [];
  const allDescendantIds = new Set<string>();

  for (const u of directUsers) {
    const uid = u.user_id.toUpperCase();
    visited.add(uid);
    allDescendantIds.add(uid);
    currentParents.push(uid);
  }

  for (let lvl = 2; lvl <= 10; lvl++) {
    if (currentParents.length === 0) break;
    const parentCodeSet = new Set<string>();
    for (const pId of currentParents) {
      parentCodeSet.add(pId);
      const aliases = knownAliases[pId] || [];
      for (const a of aliases) {
        parentCodeSet.add(a.toUpperCase());
      }
    }
    const nextLevelUsers = dbUsers.filter((u) => {
      const uid = u.user_id.toUpperCase();
      if (visited.has(uid)) return false;
      const ref = (u.referral_code || "").toUpperCase();
      return Boolean(ref && parentCodeSet.has(ref));
    });
    if (nextLevelUsers.length === 0) break;
    currentParents = [];
    for (const u of nextLevelUsers) {
      const uid = u.user_id.toUpperCase();
      visited.add(uid);
      allDescendantIds.add(uid);
      currentParents.push(uid);
    }
  }

  const teamMembersCount = allDescendantIds.size;

  // Calculate direct commission from real ledger / premium video records
  let directCommissionTotal = 0;
  const referralTransactions = ledger.filter(
    (t) => t.incomeType === "referral_income" || t.incomeType === "direct_commission",
  );

  if (referralTransactions.length > 0) {
    directCommissionTotal = referralTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  } else {
    // If no ledger entry yet, check referred members' actual paid premium videos
    for (const v of allVideos) {
      if (
        directUserIds.has(v.userId.toUpperCase()) &&
        v.videoType === "premium" &&
        v.paymentStatus === "paid"
      ) {
        directCommissionTotal += 1.0;
      }
    }
  }

  // Build member rows from genuine direct users only
  const members: ReferralMemberSummary[] = directUsers.map((m) => {
    const memberVideos = allVideos.filter(
      (v) => v.userId.toUpperCase() === m.user_id.toUpperCase(),
    );
    const freeCount = memberVideos.filter((v) => v.videoType === "free").length;
    const premiumCount = memberVideos.filter(
      (v) =>
        v.videoType === "premium" &&
        (v.paymentStatus === "paid" || v.paymentStatus === "not_required"),
    ).length;

    const directComm = premiumCount * 1.0;

    return {
      id: m.id || `mem_${m.user_id}`,
      userId: m.user_id,
      name: m.name,
      email: m.email,
      mobile: m.mobile || "",
      joinedAt: m.created_at || "Recent",
      status: "Active",
      tier: m.role === "admin" ? "Admin" : "Creator",
      freeVideosCount: freeCount,
      premiumVideosCount: premiumCount,
      totalVideosCount: freeCount + premiumCount,
      directCommissionEarned: directComm,
      access: "Granted",
    };
  });

  const directReferralsCount = directUsers.length;
  const referralNumber = currentUserRecord?.mobile || "";
  const referralCode = shareCode;
  const referralLink = `https://facetube.online/register?ref=${encodeURIComponent(referralCode)}`;

  return {
    directReferralsCount,
    teamMembersCount,
    referralIncome: directCommissionTotal,
    referralCode,
    referralNumber,
    referralLink,
    members,
  };
}

/**
 * Retrieves multi-level team members (Levels 1–10) from the authenticated API.
 */
export async function getTeamMembers(userId?: string, level?: number | "all") {
  return api.referrals.getTeam(userId, level);
}
