import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { handleApiRequest, calculateDownlineLevelsTs } from "./api-handler";

describe("Priority 2: Multi-Level Referral Downline & Team Members Verification", () => {
  // Test Suite 1: Direct Referrals vs Total Team Count
  describe("1. Direct Referrals vs Total Team Count Calculation", () => {
    it("differentiates direct referrals (Level 1) from multi-level descendants across Levels 1–10", () => {
      // Tree:
      // ROOT (FT1000)
      //   ├── L1_A (FT1001) [referred by FT1000]
      //   │     ├── L2_A1 (FT2001) [referred by FT1001]
      //   │     │     └── L3_A11 (FT3001) [referred by FT2001]
      //   │     └── L2_A2 (FT2002) [referred by FT1001]
      //   └── L1_B (FT1002) [referred by FT1000]
      //         └── L2_B1 (FT2003) [referred by FT1002]

      const sampleUsers = [
        { user_id: "FT1000", name: "Root User", referral_code: null },
        { user_id: "FT1001", name: "Level 1 A", referral_code: "FT1000" },
        { user_id: "FT1002", name: "Level 1 B", referral_code: "FT1000" },
        { user_id: "FT2001", name: "Level 2 A1", referral_code: "FT1001" },
        { user_id: "FT2002", name: "Level 2 A2", referral_code: "FT1001" },
        { user_id: "FT2003", name: "Level 2 B1", referral_code: "FT1002" },
        { user_id: "FT3001", name: "Level 3 A11", referral_code: "FT2001" },
      ];

      const res = calculateDownlineLevelsTs("FT1000", "FT1000", sampleUsers, 10);

      // Direct referrals must be exactly 2 (L1_A, L1_B)
      assert.equal(res.directCount, 2, "Direct referrals count must be strictly 2");

      // Total team count must be 6 (2 in L1 + 3 in L2 + 1 in L3)
      assert.equal(
        res.totalTeamCount,
        6,
        "Total team count must include all unique descendants across all levels",
      );

      // Verify levelCounts breakdown
      assert.equal(res.levelCounts[1], 2);
      assert.equal(res.levelCounts[2], 3);
      assert.equal(res.levelCounts[3], 1);
      assert.equal(res.levelCounts[4], 0);

      // Root must never be in allMembers
      const rootFound = res.allMembers.some((m) => m.userId === "FT1000");
      assert.equal(rootFound, false, "Root user must never appear in their own downline");
    });
  });

  // Test Suite 2: Correct Level Assignment Through Level 10
  describe("2. Correct Level Assignment Through Level 10", () => {
    it("accurately assigns levels 1 through 10 and stops at level 10 without leaking into level 11", () => {
      // Linear chain from Root down to Level 11:
      // Root -> L1 -> L2 -> L3 -> L4 -> L5 -> L6 -> L7 -> L8 -> L9 -> L10 -> L11
      const chainUsers: Array<{
        user_id: string;
        name: string;
        referral_code: string | null;
      }> = [{ user_id: "CHAIN_ROOT", name: "Chain Root", referral_code: null }];

      for (let i = 1; i <= 11; i++) {
        const parentId = i === 1 ? "CHAIN_ROOT" : `CHAIN_L${i - 1}`;
        chainUsers.push({
          user_id: `CHAIN_L${i}`,
          name: `Member Level ${i}`,
          referral_code: parentId,
        });
      }

      const res = calculateDownlineLevelsTs("CHAIN_ROOT", "CHAIN_ROOT", chainUsers, 10);

      assert.equal(res.directCount, 1, "Level 1 direct count must be 1");
      assert.equal(
        res.totalTeamCount,
        10,
        "Total team must include only up to Level 10 (10 members total)",
      );

      for (let lvl = 1; lvl <= 10; lvl++) {
        assert.equal(res.levelCounts[lvl], 1, `Level ${lvl} must have 1 member`);
        const member = res.membersByLevel[lvl]?.[0];
        assert.ok(member, `Member at level ${lvl} must exist`);
        assert.equal(member.level, lvl, `Member level property must equal ${lvl}`);
        assert.equal(member.userId, `CHAIN_L${lvl}`);
      }

      // Member Level 11 must be strictly excluded
      const l11Exists = res.allMembers.some((m) => m.userId === "CHAIN_L11");
      assert.equal(l11Exists, false, "Level 11 members must not be included beyond Level 10 limit");
    });
  });

  // Test Suite 3: Cycle Detection & Malformed Data Safety
  describe("3. Duplicate, Self-Referral, and Cycle Prevention", () => {
    it("handles circular referral loops safely without infinite loops or duplicate counting", () => {
      // Circular loop:
      // Root (FT_ROOT) -> A (FT_A) -> B (FT_B) -> C (FT_C) -> A (FT_A)
      const cyclicUsers = [
        { user_id: "FT_ROOT", name: "Root", referral_code: null },
        { user_id: "FT_A", name: "Member A", referral_code: "FT_ROOT" },
        { user_id: "FT_B", name: "Member B", referral_code: "FT_A" },
        { user_id: "FT_C", name: "Member C", referral_code: "FT_B" },
        // Malicious or corrupted loop pointing back to FT_A or FT_ROOT
        { user_id: "FT_LOOP", name: "Member Loop", referral_code: "FT_C" },
      ];

      // Add a circular reference where FT_A also has referral_code pointing to FT_C
      const res = calculateDownlineLevelsTs("FT_ROOT", "FT_ROOT", cyclicUsers, 10);

      // Members must be FT_A (L1), FT_B (L2), FT_C (L3), FT_LOOP (L4) = 4 members total
      assert.equal(res.totalTeamCount, 4);
      assert.equal(res.directCount, 1);

      // Verify no duplicates
      const ids = res.allMembers.map((m) => m.userId);
      const uniqueIds = new Set(ids);
      assert.equal(ids.length, uniqueIds.size, "All members in downline must be unique");
    });

    it("ignores self-referrals where referral_code points to user's own ID", () => {
      const selfReferralUsers = [
        { user_id: "FT_SELF_ROOT", name: "Self Root", referral_code: "FT_SELF_ROOT" },
        { user_id: "FT_CHILD", name: "Normal Child", referral_code: "FT_SELF_ROOT" },
        { user_id: "FT_SELF_CHILD", name: "Self Child", referral_code: "FT_SELF_CHILD" },
      ];

      const res = calculateDownlineLevelsTs("FT_SELF_ROOT", "FT_SELF_ROOT", selfReferralUsers, 10);
      assert.equal(res.directCount, 1);
      assert.equal(res.totalTeamCount, 1);
      assert.equal(res.allMembers[0]?.userId, "FT_CHILD");
    });
  });

  // Test Suite 4: Empty Teams and API Security
  describe("4. Empty Teams and Authentication Authorization", () => {
    it("returns zero counts and empty arrays when a user has zero referrals", () => {
      const users = [{ user_id: "FT_LONE", name: "Lone User", referral_code: null }];

      const res = calculateDownlineLevelsTs("FT_LONE", "FT_LONE", users, 10);
      assert.equal(res.directCount, 0);
      assert.equal(res.totalTeamCount, 0);
      assert.equal(res.allMembers.length, 0);
      assert.equal(res.sanitizedMembers.length, 0);
    });

    it("rejects unauthenticated requests to /api/referrals/team with HTTP 401", async () => {
      const req = new Request("http://localhost:3000/api/referrals/team", {
        method: "GET",
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 401, "Unauthenticated request must return 401");
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });

  // Test Suite 5: Sensitive-Field Protection
  describe("5. Sensitive Field Protection (Security)", () => {
    it("never exposes password hashes, reset tokens, KYC, or bank info in sanitized team members", () => {
      const usersWithSensitiveData = [
        {
          id: "uuid-1",
          user_id: "FT_PARENT",
          name: "Parent",
          password_hash: "$2a$10$abcdefghijklmnopqrstuvwxyz",
          token: "secret_token_123",
          bank_account: "1234567890",
          pan_card: "ABCDE1234F",
          referral_code: null,
        },
        {
          id: "uuid-2",
          user_id: "FT_MEMBER",
          name: "Member Sensitive",
          password_hash: "$2a$10$verysecretpasswordhash",
          token: "session_token_xyz",
          bank_account: "9876543210",
          pan_card: "XYZPK9999Z",
          referral_code: "FT_PARENT",
        },
      ];

      const res = calculateDownlineLevelsTs(
        "FT_PARENT",
        "FT_PARENT",
        usersWithSensitiveData as any,
        10,
      );

      assert.equal(res.sanitizedMembers.length, 1);
      const m = res.sanitizedMembers[0] as any;

      assert.equal(m.password, undefined);
      assert.equal(m.password_hash, undefined);
      assert.equal(m.token, undefined);
      assert.equal(m.bank_account, undefined);
      assert.equal(m.pan_card, undefined);
      assert.equal(m.aadhaar, undefined);

      // Safe fields must be present
      assert.equal(m.userId, "FT_MEMBER");
      assert.equal(m.name, "Member Sensitive");
      assert.equal(m.level, 1);
      assert.equal(m.status, "Active");
      assert.equal(m.access, "Granted");
    });
  });

  // Test Suite 6: Production PHP Endpoint Files Verification
  describe("6. Hostinger PHP Production Endpoint Verification", () => {
    it("verifies api/referrals/downline.php exists and defines calculateDownlineLevels", () => {
      const filePath = path.resolve(process.cwd(), "api/referrals/downline.php");
      assert.ok(fs.existsSync(filePath), "api/referrals/downline.php must exist");
      const content = fs.readFileSync(filePath, "utf-8");
      assert.match(
        content,
        /function calculateDownlineLevels/,
        "Must define calculateDownlineLevels",
      );
      assert.match(content, /\$maxLevels = 10/, "Must enforce maxLevels = 10");
      assert.match(
        content,
        /\$visitedUserIds/,
        "Must enforce visited tracker for cycle prevention",
      );
    });

    it("verifies api/referrals/dashboard.php uses downline.php and sets teamMembersCount to totalTeamCount", () => {
      const filePath = path.resolve(process.cwd(), "api/referrals/dashboard.php");
      assert.ok(fs.existsSync(filePath), "api/referrals/dashboard.php must exist");
      const content = fs.readFileSync(filePath, "utf-8");
      assert.match(
        content,
        /require_once __DIR__ \. '\/downline\.php'/,
        "dashboard.php must require downline.php",
      );
      assert.match(
        content,
        /'teamMembersCount'\s*=>\s*\$totalTeamCount/,
        "dashboard.php must return totalTeamCount",
      );
      assert.doesNotMatch(
        content,
        /'teamMembersCount'\s*=>\s*\$teamCount\b/,
        "dashboard.php must not assign teamCount = directCount",
      );
    });

    it("verifies api/referrals/team.php exists with authentication and level filtering", () => {
      const filePath = path.resolve(process.cwd(), "api/referrals/team.php");
      assert.ok(fs.existsSync(filePath), "api/referrals/team.php must exist");
      const content = fs.readFileSync(filePath, "utf-8");
      assert.match(content, /requireAuthUser/, "team.php must enforce session authentication");
      assert.match(
        content,
        /calculateDownlineLevels/,
        "team.php must use multi-level downline calculation",
      );
      assert.match(
        content,
        /\$filterLevel >= 1 && \$filterLevel <= 10/,
        "team.php must support level 1-10 filtering",
      );
    });
  });

  // Test Suite 7: Sponsor Relationship Correctness & Sibling Isolation (Priority 2 Bug Fix)
  describe("7. Sponsor Relationship Correctness & Sibling Isolation", () => {
    it("never counts sibling users as direct referrals when they share the same sponsor code", () => {
      // Scenario:
      // Admin (FT102857) has promotional code "FTVIP".
      // Alice (FT_ALICE) registers with referral_code = "FTVIP" (Admin is her sponsor).
      // Bob (FT_BOB) registers with referral_code = "FTVIP" (Admin is his sponsor).
      // Charlie (FT_CHARLIE) registers with referral_code = "FT_ALICE" (Alice is his sponsor).
      //
      // In the database:
      // Alice's users.referral_code is "FTVIP" (her upline sponsor).
      // Bob's users.referral_code is "FTVIP" (his upline sponsor).
      // Charlie's users.referral_code is "FT_ALICE".
      const treeUsers = [
        { user_id: "FT102857", name: "FaceTube Admin", referral_code: null, role: "admin" },
        { user_id: "FT_ALICE", name: "Alice", referral_code: "FTVIP", role: "user" },
        { user_id: "FT_BOB", name: "Bob", referral_code: "FTVIP", role: "user" },
        { user_id: "FT_CHARLIE", name: "Charlie", referral_code: "FT_ALICE", role: "user" },
      ];

      // 1. Calculate downline for Alice
      const aliceDownline = calculateDownlineLevelsTs("FT_ALICE", treeUsers, 10);

      // Alice's direct referrals count MUST be 1 (Charlie only)
      assert.equal(
        aliceDownline.directCount,
        1,
        "Alice must have exactly 1 direct referral (Charlie)",
      );
      assert.equal(
        aliceDownline.totalTeamCount,
        1,
        "Alice must have exactly 1 total team member (Charlie)",
      );
      assert.equal(aliceDownline.membersByLevel[1]?.[0]?.userId, "FT_CHARLIE");

      // Bob MUST NOT appear anywhere in Alice's downline (no sibling leakage!)
      const bobInAliceDownline = aliceDownline.allMembers.some((m) => m.userId === "FT_BOB");
      assert.equal(
        bobInAliceDownline,
        false,
        "Sibling Bob must NEVER appear in Alice's downline even though both registered with FTVIP",
      );

      // Admin MUST NOT appear in Alice's downline
      const adminInAliceDownline = aliceDownline.allMembers.some((m) => m.userId === "FT102857");
      assert.equal(adminInAliceDownline, false, "Admin must not appear in Alice's downline");

      // 2. Calculate downline for Admin (FT102857)
      const adminDownline = calculateDownlineLevelsTs("FT102857", treeUsers, 10);

      // Admin sponsored Alice and Bob directly via FTVIP (Level 1 = 2 members)
      assert.equal(
        adminDownline.directCount,
        2,
        "Admin must have 2 direct referrals (Alice and Bob)",
      );
      assert.equal(adminDownline.levelCounts[1], 2);

      // Charlie is Level 2 of Admin (sponsored by Alice)
      assert.equal(adminDownline.levelCounts[2], 1, "Charlie must be at Level 2 for Admin");
      assert.equal(adminDownline.membersByLevel[2]?.[0]?.userId, "FT_CHARLIE");

      // Admin total team = 3 (Alice, Bob, Charlie)
      assert.equal(
        adminDownline.totalTeamCount,
        3,
        "Admin total team must be 3 (Alice, Bob, Charlie)",
      );
    });

    it("correctly resolves verified promotional aliases (FTVIP and CREATOR50)", () => {
      const aliasUsers = [
        { user_id: "FT102857", name: "Admin", referral_code: null },
        { user_id: "FT483921", name: "Alex Rivera", referral_code: null },
        { user_id: "FT_FAN_ADMIN", name: "Admin Fan", referral_code: "ftvip" }, // case-insensitive alias
        { user_id: "FT_FAN_ALEX", name: "Alex Fan", referral_code: "creator50" }, // case-insensitive alias
        { user_id: "FT_FAN_DIRECT", name: "Direct User", referral_code: "ft483921" }, // direct user_id
      ];

      // Admin downline
      const adminDownline = calculateDownlineLevelsTs("FT102857", aliasUsers, 10);
      assert.equal(adminDownline.directCount, 1);
      assert.equal(adminDownline.allMembers[0]?.userId, "FT_FAN_ADMIN");

      // Alex Rivera downline
      const alexDownline = calculateDownlineLevelsTs("FT483921", aliasUsers, 10);
      assert.equal(alexDownline.directCount, 2);
      const alexChildren = alexDownline.allMembers.map((m) => m.userId);
      assert.ok(alexChildren.includes("FT_FAN_ALEX"));
      assert.ok(alexChildren.includes("FT_FAN_DIRECT"));
    });

    it("verifies PHP implementation uses getKnownPromotionalAliases and does not treat upline referral_code as personal sponsor code", () => {
      const downlinePhp = fs.readFileSync(
        path.resolve(process.cwd(), "api/referrals/downline.php"),
        "utf-8",
      );
      assert.match(
        downlinePhp,
        /function getKnownPromotionalAliases/,
        "downline.php must define getKnownPromotionalAliases",
      );
      assert.match(downlinePhp, /'FT102857'\s*=>\s*\['FTVIP'\]/);
      assert.match(downlinePhp, /'FT483921'\s*=>\s*\['CREATOR50'\]/);

      const dashboardPhp = fs.readFileSync(
        path.resolve(process.cwd(), "api/referrals/dashboard.php"),
        "utf-8",
      );
      assert.match(
        dashboardPhp,
        /'referralCode'\s*=>\s*\$shareCode/,
        "dashboard.php must output shareCode",
      );
      assert.match(
        dashboardPhp,
        /'referralLink'\s*=>\s*'https:\/\/facetube\.online\/register\?ref='\s*\.\s*urlencode\(\$shareCode\)/,
        "dashboard.php must build referralLink with shareCode",
      );

      const teamPhp = fs.readFileSync(
        path.resolve(process.cwd(), "api/referrals/team.php"),
        "utf-8",
      );
      assert.match(
        teamPhp,
        /calculateDownlineLevels\(\$pdo,\s*\$userNormId,\s*10\)/,
        "team.php must call calculateDownlineLevels with ($pdo, $userNormId, 10)",
      );
    });
  });
});
