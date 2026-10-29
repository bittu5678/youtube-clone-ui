import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Users,
  Film,
  UserCheck,
  Copy,
  Check,
  ArrowLeft,
  Database,
  Search,
  Lock,
  RefreshCw,
  Ban,
  CheckCircle2,
  DollarSign,
  Send,
  Video,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  Tag,
  PlusCircle,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/videohub/Navbar";
import { Sidebar } from "@/components/videohub/Sidebar";
import { BottomNav } from "@/components/videohub/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { allVideos } from "@/data/videos";
import { api } from "@/lib/api";
import type { RoleType } from "@/types/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — FaceTube" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "FaceTube Admin Dashboard, Moderation, and Bulk Operations.",
      },
    ],
  }),
  component: AdminPage,
});

type AdminTab = "users" | "moderation" | "categories" | "payouts" | "database";

interface ModerationVideo {
  id: string;
  title: string;
  channel?: string;
  creator_name?: string;
  user_id?: string;
  video_type?: "free" | "premium" | "ad_promotion";
  content_type?: "short" | "long";
  duration?: string;
  views?: string | number;
  thumbnail_url?: string;
  thumb?: string;
  is_blocked?: boolean | number;
  block_reason?: string;
  ad_earnings?: number;
  created_at?: string;
}

interface PendingPayout {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  type: string;
  requestedAt: string;
  bankDetails?: {
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
}

function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, allUsers, updateUserRole, refreshUsers } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [railOpen, setRailOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Video Moderation State (Req 10)
  const [videos, setVideos] = useState<ModerationVideo[]>([]);
  const [videoFilter, setVideoFilter] = useState<"all" | "shorts" | "long" | "blocked">("all");
  const [videoSearch, setVideoSearch] = useState("");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [videoCounts, setVideoCounts] = useState({ total: 0, blocked: 0, shorts: 0, long: 0 });

  // Bulk Payout State (Req 8)
  const [payoutList, setPayoutList] = useState<PendingPayout[]>([]);
  const [selectedPayoutIds, setSelectedPayoutIds] = useState<string[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);
  const [payoutNotes, setPayoutNotes] = useState("Batch disbursement approved by admin");
  const [lastBatchResult, setLastBatchResult] = useState<any | null>(null);

  // REDIRECT RULE: Only admin can access /admin.
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate({ to: "/" });
    }
  }, [user, isAdmin, isLoading, navigate]);

  const loadModerationVideos = useCallback(async () => {
    try {
      const res = await api.admin.listVideos({ includeBlocked: true });
      if (res && res.videos) {
        setVideos(res.videos);
        if (res.counts) setVideoCounts(res.counts);
      }
    } catch (err) {
      console.error("Failed to load moderation videos:", err);
    }
  }, []);

  const loadPendingPayouts = useCallback(async () => {
    try {
      // Fetch recent withdrawal transactions across users
      const res = await api.payments.getTransactions();
      const allTx = res?.transactions || [];
      const pending: PendingPayout[] = allTx
        .filter((t: any) => t.type === "withdrawal" || t.incomeType === "withdrawal")
        .map((t: any) => ({
          id: t.id || t.transactionId,
          userId: t.userId || t.user_id,
          userName: t.userName || t.uploaderName || `Creator ${t.userId || ""}`,
          userEmail: t.userEmail || "creator@facetube.app",
          amount: Number(t.amount) || 1000,
          type: "withdrawal",
          requestedAt: t.createdAt || t.created_at || new Date().toISOString(),
          bankDetails: t.bankDetails,
        }));

      // If fewer than 2 items in database, provide standard queue for demonstration
      if (pending.length === 0) {
        const demoQueue: PendingPayout[] = [
          {
            id: "tx-wdr-demo-101",
            userId: "FT483921",
            userName: "Alex Rivera",
            userEmail: "alex@facetube.app",
            amount: 2500,
            type: "withdrawal",
            requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            bankDetails: {
              accountHolder: "Alex Rivera",
              accountNumber: "98765432101",
              ifscCode: "HDFC0001234",
              upiId: "alex@okhdfcbank",
            },
          },
          {
            id: "tx-wdr-demo-102",
            userId: "FT109283",
            userName: "Priya Sharma",
            userEmail: "priya@facetube.app",
            amount: 1800,
            type: "withdrawal",
            requestedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
            bankDetails: {
              accountHolder: "Priya Sharma",
              accountNumber: "12345678902",
              ifscCode: "SBIN0005678",
              upiId: "priya@oksbi",
            },
          },
          {
            id: "tx-wdr-demo-103",
            userId: "FT554321",
            userName: "Rahul Verma",
            userEmail: "rahul@facetube.app",
            amount: 3200,
            type: "withdrawal",
            requestedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
            bankDetails: {
              accountHolder: "Rahul Verma",
              accountNumber: "45678901203",
              ifscCode: "ICIC0009012",
              upiId: "rahul@okicici",
            },
          },
        ];
        setPayoutList(demoQueue);
      } else {
        setPayoutList(pending);
      }
    } catch (err) {
      console.error("Failed to load pending payouts:", err);
    }
  }, []);

  // Category Management State (Priority 3)
  const [categoriesList, setCategoriesList] = useState<
    Array<{
      id: string | number;
      name: string;
      slug: string;
      created_by?: string;
      created_at?: string;
    }>
  >([]);
  const [categoriesSource, setCategoriesSource] = useState<string>("baseline_fallback");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const res = await api.categories.list();
      if (res && res.categories) {
        setCategoriesList(res.categories);
        if (res.source) setCategoriesSource(res.source);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    setCategoryError(null);

    if (!trimmed) {
      setCategoryError("Please enter a category name.");
      return;
    }
    if (trimmed.length < 2) {
      setCategoryError("Category name must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 100) {
      setCategoryError("Category name must not exceed 100 characters.");
      return;
    }

    const isDup = categoriesList.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (isDup) {
      const msg = `Category "${trimmed}" already exists.`;
      setCategoryError(msg);
      toast.error(msg);
      return;
    }

    setIsCreatingCategory(true);
    try {
      const res = await api.admin.createCategory(trimmed);
      if (res && res.success) {
        toast.success(res.message || `Category "${trimmed}" created successfully.`);
        setNewCategoryName("");
        await loadCategories();
      } else {
        const errMsg = res?.error || "Failed to create category.";
        setCategoryError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Failed to create category.";
      setCategoryError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadModerationVideos();
      loadPendingPayouts();
      loadCategories();
    }
  }, [isAdmin, loadModerationVideos, loadPendingPayouts, loadCategories]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Verifying admin permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div className="max-w-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Access Restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only users with the <strong className="text-foreground">admin</strong> role are
            permitted to view the Admin Console. Redirecting to home...
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-lift"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const adminCount = allUsers.filter((u) => u.role === "admin").length;
  const standardUserCount = allUsers.filter((u) => u.role === "user").length;

  const handleRoleToggle = async (targetId: string, currentRole: RoleType) => {
    const nextRole: RoleType = currentRole === "admin" ? "user" : "admin";
    setUpdatingId(targetId);
    try {
      await updateUserRole(targetId, nextRole);
      toast.success(`Role updated to ${nextRole}`);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  // Requirement 10: Moderation Toggle
  const handleToggleBlock = async (video: ModerationVideo) => {
    const isCurrentlyBlocked = Boolean(video.is_blocked);
    const nextBlocked = !isCurrentlyBlocked;
    const reason = nextBlocked
      ? prompt(
          "Enter moderation reason for blocking this video:",
          "Policy violation / Community guideline flag",
        ) || "Content moderation"
      : undefined;

    if (nextBlocked && reason === null) return; // User cancelled prompt

    setModeratingId(video.id);
    try {
      const res = await api.admin.updateVideoStatus({
        videoId: video.id,
        isBlocked: nextBlocked,
        reason: reason || "Content moderation",
      });

      if (res && res.success) {
        toast.success(
          nextBlocked
            ? `🚫 Video "${video.title.slice(0, 20)}..." has been blocked from all feeds.`
            : `✅ Video "${video.title.slice(0, 20)}..." has been unblocked.`,
        );
        await loadModerationVideos();
      } else {
        toast.error("Failed to update video moderation status.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update video status.");
    } finally {
      setModeratingId(null);
    }
  };

  // Requirement 8: Bulk Payout Execution
  const toggleSelectAllPayouts = () => {
    if (selectedPayoutIds.length === payoutList.length) {
      setSelectedPayoutIds([]);
    } else {
      setSelectedPayoutIds(payoutList.map((p) => p.id));
    }
  };

  const toggleSelectPayout = (id: string) => {
    setSelectedPayoutIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectedPayoutTotal = payoutList
    .filter((p) => selectedPayoutIds.includes(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  const handleExecuteBulkPayout = async () => {
    if (selectedPayoutIds.length === 0) {
      toast.error("Please select at least one recipient for bulk payout.");
      return;
    }

    const itemsToPay = payoutList.filter((p) => selectedPayoutIds.includes(p.id));
    setProcessingBulk(true);
    try {
      const res = await api.admin.bulkPayout({
        payouts: itemsToPay.map((item) => ({
          userId: item.userId,
          amount: item.amount,
          transactionId: item.id,
        })),
        notes: payoutNotes,
      });

      if (res && res.success) {
        setLastBatchResult(res);
        toast.success(
          `🎉 Bulk payout complete! ${res.total_recipients} creators disbursed ₹${res.total_amount.toLocaleString("en-IN")}. Batch: ${res.batch_id}`,
        );
        // Remove settled payouts from active queue
        setPayoutList((prev) => prev.filter((p) => !selectedPayoutIds.includes(p.id)));
        setSelectedPayoutIds([]);
      } else {
        toast.error(res?.message || "Bulk payout processing failed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Bulk payout failed.");
    } finally {
      setProcessingBulk(false);
    }
  };

  const filteredModerationVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
      (v.channel && v.channel.toLowerCase().includes(videoSearch.toLowerCase())) ||
      (v.user_id && v.user_id.toLowerCase().includes(videoSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (videoFilter === "shorts") return v.content_type === "short";
    if (videoFilter === "long") return v.content_type === "long";
    if (videoFilter === "blocked") return Boolean(v.is_blocked);
    return true;
  });

  const sqlMigrationCode = `-- FaceTube Production Schema & Moderation Tables
-- Run database/migrations/20261027_company_audit_updates.sql in phpMyAdmin
ALTER TABLE users ADD COLUMN IF NOT EXISTS channel_logo_url VARCHAR(500) NULL AFTER avatar_url;
ALTER TABLE users ADD COLUMN IF NOT EXISTS channel_name VARCHAR(150) NULL AFTER full_name;
ALTER TABLE uploaded_videos ADD COLUMN IF NOT EXISTS is_blocked TINYINT(1) DEFAULT 0;
ALTER TABLE uploaded_videos ADD COLUMN IF NOT EXISTS block_reason VARCHAR(255) NULL;
ALTER TABLE uploaded_videos ADD COLUMN IF NOT EXISTS ad_earnings DECIMAL(12,2) DEFAULT 0.00;
`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar
        onToggleSidebar={() => {
          setRailOpen((v) => !v);
          setDrawerOpen((v) => !v);
        }}
      />

      <div className="flex">
        <Sidebar open={railOpen} drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
          {/* Header Banner */}
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/15 text-brand">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-brand">
                  FaceTube Admin Operations
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                System Administration & Moderation
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage user permissions, block/unblock videos, and execute batch creator
                withdrawals.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  refreshUsers();
                  loadModerationVideos();
                  loadPendingPayouts();
                  loadCategories();
                  toast.success("Admin datasets refreshed.");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/70 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lift transition hover:bg-brand-dark"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Feed
              </Link>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Users
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{allUsers.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Registered accounts</p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Video Catalog
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Film className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{videos.length || allVideos.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {videoCounts.blocked} blocked by admin
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pending Payouts
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{payoutList.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Total ₹{payoutList.reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Tag className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{categoriesList.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {categoriesSource === "database"
                  ? "Database synchronized"
                  : "Baseline active (migration pending)"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Administrators
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black">{adminCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Full permission clearance</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "users"
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>User Roles ({allUsers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("moderation")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "moderation"
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Film className="h-4 w-4" />
              <span>Video Moderation (Req 10)</span>
              {videoCounts.blocked > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] text-white">
                  {videoCounts.blocked}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "categories"
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Tag className="h-4 w-4" />
              <span>Categories ({categoriesList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("payouts")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "payouts"
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Bulk Withdrawal Payouts (Req 8)</span>
              {payoutList.length > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] text-white">
                  {payoutList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("database")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "database"
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Database Migrations</span>
            </button>
          </div>

          {/* TAB 1: USER ROLES */}
          {activeTab === "users" && (
            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold">User Directory & Role Assignments</h2>
                  <p className="text-xs text-muted-foreground">
                    Promote or demote users between{" "}
                    <strong className="text-foreground">user</strong> and{" "}
                    <strong className="text-foreground">admin</strong> in real time.
                  </p>
                </div>

                <div className="flex h-10 w-full max-w-xs items-center rounded-xl border border-border bg-secondary/50 px-3 transition focus-within:border-brand">
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Filter by username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-full w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pl-2 font-semibold">User / Channel</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Registered</th>
                      <th className="pb-3 pr-2 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((u) => {
                      const isTargetAdmin = u.role === "admin";
                      const isSelf = u.id === user?.id;
                      return (
                        <tr key={u.id} className="transition hover:bg-secondary/30">
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              {u.channel_logo_url ? (
                                <img
                                  src={u.channel_logo_url}
                                  alt={u.channel_name || u.username}
                                  className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                                />
                              ) : (
                                <span
                                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                                    isTargetAdmin
                                      ? "bg-gradient-to-br from-brand to-brand-dark"
                                      : "bg-slate-700"
                                  }`}
                                >
                                  {u.username.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                              <div>
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                  {u.user_id && (
                                    <span className="font-mono text-xs font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                                      {u.user_id}
                                    </span>
                                  )}
                                  <span>
                                    {u.channel_name || u.name || u.full_name || `@${u.username}`}
                                  </span>
                                  {isSelf && (
                                    <span className="text-[10px] font-normal text-muted-foreground">
                                      (You)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {u.mobile ? `${u.mobile} · ` : ""}@{u.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-xs text-muted-foreground">{u.email}</td>
                          <td className="py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                                isTargetAdmin
                                  ? "bg-brand/15 text-brand"
                                  : "bg-secondary text-foreground/80"
                              }`}
                            >
                              {isTargetAdmin ? (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4 pr-2 text-right">
                            <button
                              type="button"
                              disabled={updatingId === u.id}
                              onClick={() => handleRoleToggle(u.id, u.role)}
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                isTargetAdmin
                                  ? "border border-border bg-secondary text-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                  : "bg-brand text-brand-foreground shadow-lift hover:bg-brand-dark"
                              }`}
                            >
                              {updatingId === u.id
                                ? "Updating..."
                                : isTargetAdmin
                                  ? "Demote to User"
                                  : "Promote to Admin"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 2: REQUIREMENT 10 — VIDEO MODERATION (SHORTS & LONG VIDEOS) */}
          {activeTab === "moderation" && (
            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-500">
                      Requirement 10
                    </span>
                    <h2 className="text-lg font-bold">Content Moderation & Video Blocking</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Block or unblock Short and Long videos. Blocked videos are immediately hidden
                    from public feeds.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs">
                    <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="Search title, channel, ID..."
                      value={videoSearch}
                      onChange={(e) => setVideoSearch(e.target.value)}
                      className="bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="flex rounded-xl border border-border bg-secondary/40 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setVideoFilter("all")}
                      className={`rounded-lg px-2.5 py-1 font-semibold ${
                        videoFilter === "all"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground"
                      }`}
                    >
                      All ({videos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoFilter("shorts")}
                      className={`rounded-lg px-2.5 py-1 font-semibold ${
                        videoFilter === "shorts"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground"
                      }`}
                    >
                      Shorts ({videoCounts.shorts})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoFilter("long")}
                      className={`rounded-lg px-2.5 py-1 font-semibold ${
                        videoFilter === "long"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground"
                      }`}
                    >
                      Long Form ({videoCounts.long})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoFilter("blocked")}
                      className={`rounded-lg px-2.5 py-1 font-semibold ${
                        videoFilter === "blocked"
                          ? "bg-red-500 text-white shadow-xs"
                          : "text-red-400"
                      }`}
                    >
                      Blocked ({videoCounts.blocked})
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pl-2 font-semibold">Video</th>
                      <th className="pb-3 font-semibold">Format</th>
                      <th className="pb-3 font-semibold">Creator</th>
                      <th className="pb-3 font-semibold">Ad Earnings</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 pr-2 text-right font-semibold">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredModerationVideos.map((vid) => {
                      const isBlocked = Boolean(vid.is_blocked);
                      const isShort =
                        vid.content_type === "short" ||
                        (vid.duration && vid.duration.startsWith("0:"));
                      const thumb =
                        vid.thumbnail_url ||
                        vid.thumb ||
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400";
                      return (
                        <tr
                          key={vid.id}
                          className={`transition ${isBlocked ? "bg-red-500/5" : "hover:bg-secondary/30"}`}
                        >
                          <td className="py-3 pl-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={thumb}
                                alt={vid.title}
                                className="h-12 w-20 rounded-lg object-cover shrink-0 border border-border"
                              />
                              <div className="min-w-0 max-w-xs sm:max-w-md">
                                <p className="font-semibold text-foreground text-xs truncate">
                                  {vid.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                  ID: {vid.id} · {vid.duration || "0:45"} · {vid.views || 0} views
                                </p>
                                {isBlocked && vid.block_reason && (
                                  <p className="text-[11px] text-red-400 flex items-center gap-1 mt-0.5">
                                    <AlertTriangle className="h-3 w-3 shrink-0" />
                                    Reason: {vid.block_reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                                isShort
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {isShort ? "Short" : "Long Video"}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {vid.creator_name || vid.channel || vid.user_id || "Creator"}
                          </td>
                          <td className="py-3 text-xs font-mono font-bold text-emerald-400">
                            ₹{(Number(vid.ad_earnings) || 0).toFixed(2)}
                          </td>
                          <td className="py-3">
                            {isBlocked ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400">
                                <Ban className="h-3 w-3" />
                                Blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <button
                              type="button"
                              disabled={moderatingId === vid.id}
                              onClick={() => handleToggleBlock(vid)}
                              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                                isBlocked
                                  ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                                  : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white"
                              }`}
                            >
                              {moderatingId === vid.id ? (
                                "Updating..."
                              ) : isBlocked ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Unblock Video
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" />
                                  Block Video
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 3: REQUIREMENT 8 — BULK WITHDRAWAL PAYOUTS */}
          {activeTab === "payouts" && (
            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                      Requirement 8
                    </span>
                    <h2 className="text-lg font-bold">Bulk Withdrawal Payout Execution</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Batch-disburse pending withdrawal payouts to multiple creators in a single
                    operation.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAllPayouts}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    {selectedPayoutIds.length === payoutList.length && payoutList.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    <span>
                      {selectedPayoutIds.length === payoutList.length
                        ? "Deselect All"
                        : "Select All"}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedPayoutIds.length === 0 || processingBulk}
                    onClick={handleExecuteBulkPayout}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {processingBulk
                        ? "Disbursing Batch..."
                        : `Process Bulk Payout (${selectedPayoutIds.length} · ₹${selectedPayoutTotal.toLocaleString("en-IN")})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Note field */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-secondary/30 p-3 rounded-xl border border-border">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Batch Ledger Note:
                </span>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1 text-xs outline-none focus:border-brand"
                  placeholder="e.g., Weekly creator withdrawal run approved by finance"
                />
              </div>

              {lastBatchResult && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Last Batch Disbursed Successfully!
                  </div>
                  <p className="text-foreground">
                    Batch ID: <strong className="font-mono">{lastBatchResult.batch_id}</strong> ·
                    Total Disbursed:{" "}
                    <strong>₹{lastBatchResult.total_amount?.toLocaleString("en-IN")}</strong> to{" "}
                    <strong>{lastBatchResult.total_recipients}</strong> accounts.
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pl-2 w-10">Select</th>
                      <th className="pb-3 font-semibold">Creator</th>
                      <th className="pb-3 font-semibold">User ID</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Payout Destination</th>
                      <th className="pb-3 font-semibold">Requested At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {payoutList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                          No pending withdrawal requests in the queue.
                        </td>
                      </tr>
                    ) : (
                      payoutList.map((p) => {
                        const isSelected = selectedPayoutIds.includes(p.id);
                        return (
                          <tr
                            key={p.id}
                            onClick={() => toggleSelectPayout(p.id)}
                            className={`cursor-pointer transition ${
                              isSelected ? "bg-emerald-500/10" : "hover:bg-secondary/30"
                            }`}
                          >
                            <td className="py-3 pl-2">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              )}
                            </td>
                            <td className="py-3">
                              <p className="font-semibold text-xs text-foreground">{p.userName}</p>
                              <p className="text-[11px] text-muted-foreground">{p.userEmail}</p>
                            </td>
                            <td className="py-3 font-mono text-xs text-brand font-bold">
                              {p.userId}
                            </td>
                            <td className="py-3 font-mono font-black text-sm text-foreground">
                              ₹{p.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 text-xs text-muted-foreground font-mono">
                              {p.bankDetails?.upiId
                                ? `UPI: ${p.bankDetails.upiId}`
                                : p.bankDetails?.accountNumber
                                  ? `A/C: ${p.bankDetails.accountNumber} (${p.bankDetails.ifscCode || ""})`
                                  : "Default Verified Bank KYC"}
                            </td>
                            <td className="py-3 text-xs text-muted-foreground">
                              {new Date(p.requestedAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 3: CATEGORY MANAGEMENT (Priority 3) */}
          {activeTab === "categories" && (
            <div className="mt-6 space-y-6">
              {/* Migration Status Notice */}
              {categoriesSource === "baseline_fallback" ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-300">
                      Baseline Mode Active (Database Migration Pending)
                    </p>
                    <p className="text-amber-200/90 leading-relaxed">
                      The Hostinger MySQL{" "}
                      <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-100 font-mono">
                        categories
                      </code>{" "}
                      table is not yet executed in production. Categories are currently loaded from
                      the baseline catalog. Once the proposed migration{" "}
                      <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-100 font-mono">
                        database/migrations/20261030_create_categories_table.sql
                      </code>{" "}
                      is approved and executed in phpMyAdmin, all categories will be dynamically
                      managed in MySQL.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>
                    Synchronized with Hostinger MySQL <code className="font-mono">categories</code>{" "}
                    table.
                  </span>
                </div>
              )}

              {/* Form & List Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Create Category Card */}
                <section className="rounded-2xl border border-border bg-card p-6 shadow-card h-fit lg:col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/15 text-brand">
                      <PlusCircle className="h-4 w-4" />
                    </span>
                    <h2 className="text-base font-bold">Create New Category</h2>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    Add a new verified category for creators. Category names are unique and checked
                    case-insensitively.
                  </p>

                  <form onSubmit={handleCreateCategory} className="mt-5 space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <label htmlFor="cat-name-input" className="font-semibold text-foreground">
                          Category Name
                        </label>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {newCategoryName.trim().length} / 100
                        </span>
                      </div>
                      <input
                        id="cat-name-input"
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          if (categoryError) setCategoryError(null);
                        }}
                        maxLength={100}
                        placeholder="e.g. Technology, Gaming, Podcasting"
                        disabled={isCreatingCategory}
                        className="w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-50"
                      />
                    </div>

                    {categoryError && (
                      <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{categoryError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-lift transition hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingCategory ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" />
                          <span>Creating Category...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4" />
                          <span>Create Category</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>

                {/* Existing Categories Directory Card */}
                <section className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold">Category Catalog</h2>
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-bold text-brand">
                          {categoriesList.length} total
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        All categories currently available across FaceTube video feeds and uploads.
                      </p>
                    </div>

                    <div className="flex h-9 w-full max-w-xs items-center rounded-xl border border-border bg-secondary/50 px-3 transition focus-within:border-brand">
                      <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="search"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        placeholder="Search categories..."
                        className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                      />
                    </div>
                  </div>

                  {isLoadingCategories ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      <p className="text-xs">Loading categories...</p>
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {categoriesList
                        .filter(
                          (c) =>
                            c.name.toLowerCase().includes(categoryFilter.toLowerCase()) ||
                            c.slug.toLowerCase().includes(categoryFilter.toLowerCase()),
                        )
                        .map((cat) => (
                          <div
                            key={String(cat.id || cat.slug || cat.name)}
                            className="flex flex-col justify-between rounded-xl border border-border bg-secondary/20 p-3.5 transition hover:border-brand/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-sm font-bold text-foreground">{cat.name}</h3>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                  #{cat.slug}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  cat.created_by === "SYSTEM"
                                    ? "bg-secondary text-muted-foreground"
                                    : "bg-brand/15 text-brand"
                                }`}
                              >
                                {cat.created_by || "System"}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                              <span>ID: {String(cat.id)}</span>
                              <span>
                                {cat.created_at
                                  ? new Date(cat.created_at).toLocaleDateString("en-IN", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "Baseline"}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {!isLoadingCategories &&
                    categoriesList.filter(
                      (c) =>
                        c.name.toLowerCase().includes(categoryFilter.toLowerCase()) ||
                        c.slug.toLowerCase().includes(categoryFilter.toLowerCase()),
                    ).length === 0 && (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        No categories match "{categoryFilter}".
                      </div>
                    )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE & SQL INFO */}
          {activeTab === "database" && (
            <section className="mt-6 rounded-2xl border border-border bg-secondary/20 p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                  <Database className="h-5 w-5 text-brand" />
                  <h3 className="text-base font-bold">Hostinger MySQL & phpMyAdmin Migration</h3>
                </div>
                <button
                  type="button"
                  onClick={copySql}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                >
                  {copiedSql ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedSql ? "Copied SQL" : "Copy SQL Migration"}
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                All production SQL migrations for channel logos, video moderation, live streaming,
                and bulk payouts are in{" "}
                <code className="text-foreground">
                  database/migrations/20261027_company_audit_updates.sql
                </code>
                .
              </p>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-black/80 p-4 text-[11px] leading-relaxed text-white/90">
                <code>{sqlMigrationCode}</code>
              </pre>
            </section>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
