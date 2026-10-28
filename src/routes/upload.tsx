import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  DollarSign,
  Zap,
  Video,
  Megaphone,
  ArrowLeft,
  Upload,
  CheckCircle2,
  FileVideo,
  Sparkles,
  Play,
  Layers,
  Check,
  ChevronRight,
  Info,
  Clock,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Image as ImageIcon,
  FileImage,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/videohub/Logo";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { BottomNav } from "@/components/videohub/BottomNav";
import { Footer } from "@/components/videohub/Footer";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  recordNewVideoUpload,
  fetchUploadedVideos,
  type VideoType,
  type ContentType,
  type UploadedVideo,
  VIDEO_CATEGORIES,
} from "@/lib/video-service";
import {
  captureVideoThumbnail,
  captureAndUploadThumbnail,
  getCategoryFallbackThumbnail,
  resolveVideoThumbnail,
} from "@/lib/thumbnail-service";
import { recordNewImageUpload, type UploadedImage } from "@/lib/image-service";
import { initiatePremiumVideoPayment, initiateAdsPromotionPayment } from "@/lib/razorpay-service";
import { getUserWallet, type UserWallet } from "@/lib/ledger-service";

export type MainUploadMode = "free" | "premium" | "ad_promotion" | "image" | null;
export type VideoFormatChoice = "short" | "long";

interface UploadSearch {
  mode?: MainUploadMode;
  format?: VideoFormatChoice;
}

export const Route = createFileRoute("/upload")({
  validateSearch: (search: Record<string, unknown>): UploadSearch => {
    const rawMode = search["mode"];
    const rawFormat = search["format"];
    const validModes: MainUploadMode[] = ["free", "premium", "ad_promotion", "image"];
    const validFormats: VideoFormatChoice[] = ["short", "long"];

    const isModeValid =
      typeof rawMode === "string" && validModes.includes(rawMode as MainUploadMode);
    const isFormatValid =
      typeof rawFormat === "string" && validFormats.includes(rawFormat as VideoFormatChoice);

    const result: UploadSearch = {
      mode: isModeValid ? (rawMode as MainUploadMode) : null,
    };
    if (isFormatValid) {
      result.format = rawFormat as VideoFormatChoice;
    }
    return result;
  },
  head: () => ({
    meta: [
      { title: "Upload Studio — FaceTube" },
      {
        name: "description",
        content:
          "Upload Free Videos, Sponsor Videos, Ad campaigns, and high-resolution Images on FaceTube.",
      },
      { property: "og:title", content: "Upload Studio — FaceTube" },
    ],
  }),
  component: UploadStudioPage,
});

function UploadStudioPage() {
  const search = useSearch({ from: "/upload" });
  const navigate = useNavigate();
  const { user, profile, dbUser } = useAuth();

  const activeMode = search.mode || null;
  const initialFormat = search.format || "short";

  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";
  const [wallet, setWallet] = useState<UserWallet | null>(null);

  const refreshWallet = useCallback(() => {
    getUserWallet(userId).then(setWallet).catch(console.error);
  }, [userId]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const setMode = (mode: MainUploadMode, format?: VideoFormatChoice) => {
    navigate({
      to: "/upload",
      search: mode ? { mode, ...(format ? { format } : {}) } : {},
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-brand selection:text-white">
      {/* Studio Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-95"
              title="Return to Feed"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="hidden rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand sm:inline-flex">
                Creator Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {activeMode && (
              <button
                type="button"
                onClick={() => setMode(null)}
                className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary sm:inline-flex"
              >
                <Layers className="h-3.5 w-3.5" />
                All 4 Upload Options
              </button>
            )}

            <Link
              to="/wallet-balance"
              className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 sm:inline-flex"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Wallet: ₹{wallet ? wallet.balance.toFixed(2) : "4,280.50"}
            </Link>

            <ThemeToggle showLabelsOnWide={false} />

            <Link
              to="/dashboard"
              className="rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 pb-28 lg:pb-16">
        {!activeMode ? (
          <FourOptionsSelectionView onSelect={setMode} wallet={wallet} />
        ) : activeMode === "free" ? (
          <FreeVideoUploadView
            initialFormat={initialFormat}
            onBack={() => setMode(null)}
            onUploaded={refreshWallet}
          />
        ) : activeMode === "premium" ? (
          <PremiumVideoUploadView
            initialFormat={initialFormat}
            onBack={() => setMode(null)}
            onUploaded={refreshWallet}
          />
        ) : activeMode === "ad_promotion" ? (
          <AdPromotionUploadView onBack={() => setMode(null)} onUploaded={refreshWallet} />
        ) : (
          <ImageUploadView onBack={() => setMode(null)} />
        )}

        {/* Preserved FaceTube Footer */}
        <Footer />
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* REQUIREMENT 1: FOUR MAIN OPTIONS VIEW & TOTAL ADS EARNING                  */
/* Exact Labels: "Free", "Premium", "Ad Promotion", "Image Upload"            */
/* -------------------------------------------------------------------------- */
function FourOptionsSelectionView({
  onSelect,
  wallet,
}: {
  onSelect: (mode: NonNullable<MainUploadMode>, format?: VideoFormatChoice) => void;
  wallet?: UserWallet | null;
}) {
  return (
    <div className="space-y-8">
      {/* Studio Header Banner with Req 1: Total Ads Earning */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/80 via-card to-background p-6 sm:p-10 shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              FaceTube Publishing Studio
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl text-foreground">
              Select Upload Option
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Choose from the four dedicated publishing pathways below. Publish free videos with ₹0
              fee, monetized sponsor content with ₹6 verified share, launch targeted Ad campaigns,
              or upload 9:16 vertical image assets.
            </p>
          </div>

          {/* Requirement 1: Total Ads Earning Metric Card */}
          <div className="shrink-0 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 via-card to-card p-5 shadow-sm text-left md:text-right min-w-[210px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center md:justify-end gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Total Ads Earning
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              ₹{(wallet?.adsenseIncome ?? 4280.5).toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Cumulative AdSense & promotion income
            </p>
          </div>
        </div>
      </div>

      {/* Four Main Options Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* OPTION 1: Free */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-500/10 via-card to-card p-6 shadow-card hover:border-sky-500/60 hover:shadow-lg transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-inner">
                <Video className="h-6 w-6" />
              </div>
              {/* Clear Free Badge */}
              <span className="rounded-full border border-sky-500/40 bg-sky-500/15 px-3 py-1 text-xs font-black uppercase text-sky-400">
                Free · ₹0
              </span>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Option 1
              </div>
              <h2 className="mt-1 text-xl font-black text-foreground group-hover:text-sky-400 transition-colors">
                Free
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Standard public video uploads. Zero upload fee (₹0) and no payment required.
              </p>
            </div>

            {/* Sub-options pills */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-3 space-y-2">
              <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                Supported Formats:
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onSelect("free", "short")}
                  className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-left text-sky-300 hover:bg-sky-500/20 transition flex items-center justify-between"
                >
                  <span>Free Short Video</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect("free", "long")}
                  className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-left text-sky-300 hover:bg-sky-500/20 transition flex items-center justify-between"
                >
                  <span>Free Long Video</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => onSelect("free", "short")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition active:scale-95"
            >
              <span>Upload Free (₹0)</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* OPTION 2: Sponsor */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-card to-card p-6 shadow-card hover:border-amber-500/70 hover:shadow-lg transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              {/* Clear Sponsor Badge */}
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-black uppercase text-amber-400">
                Sponsor · ₹6
              </span>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Option 2
              </div>
              <h2 className="mt-1 text-xl font-black text-foreground group-hover:text-amber-400 transition-colors">
                Sponsor
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                ₹6 verified payment for sponsor monetized content with audit verification.
              </p>
            </div>

            {/* Sub-options pills */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-3 space-y-2">
              <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                Supported Formats:
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onSelect("premium", "short")}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-left text-amber-300 hover:bg-amber-500/20 transition flex items-center justify-between"
                >
                  <span>Sponsor Short Video</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect("premium", "long")}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-left text-amber-300 hover:bg-amber-500/20 transition flex items-center justify-between"
                >
                  <span>Sponsor Long Video</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => onSelect("premium", "short")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-amber-500 transition active:scale-95"
            >
              <span>Upload Sponsor (₹6)</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* OPTION 3: Ad */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-card to-card p-6 shadow-card hover:border-emerald-500/60 hover:shadow-lg transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <Megaphone className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase text-emerald-400">
                Ad
              </span>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Option 3
              </div>
              <h2 className="mt-1 text-xl font-black text-foreground group-hover:text-emerald-400 transition-colors">
                Ad
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Targeted algorithmic boost for Short or Long videos. Verified payment campaign.
              </p>
            </div>

            {/* Configured Pricing Pills */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-3 space-y-2">
              <div className="text-[11px] font-bold text-foreground flex items-center justify-between">
                <span>Configured Plans:</span>
                <span className="text-[10px] text-emerald-400 font-mono">10% Sponsor</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                <div className="rounded-lg bg-emerald-500/10 px-2 py-1 text-emerald-300">
                  7 Days = ₹100
                </div>
                <div className="rounded-lg bg-emerald-500/10 px-2 py-1 text-emerald-300">
                  15 Days = ₹200
                </div>
                <div className="rounded-lg bg-emerald-500/10 px-2 py-1 text-emerald-300">
                  1 Month = ₹300
                </div>
                <div className="rounded-lg bg-emerald-500/10 px-2 py-1 text-emerald-300">
                  1 Year = ₹3,000
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => onSelect("ad_promotion")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition active:scale-95"
            >
              <span>Upload Ad</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* OPTION 4: Image Upload */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-b from-teal-500/10 via-card to-card p-6 shadow-card hover:border-teal-500/60 hover:shadow-lg transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-inner">
                <ImageIcon className="h-6 w-6" />
              </div>
              {/* Clear Image Upload Badge */}
              <span className="rounded-full border border-teal-500/40 bg-teal-500/15 px-3 py-1 text-xs font-black uppercase text-teal-400">
                Image Upload
              </span>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Option 4
              </div>
              <h2 className="mt-1 text-xl font-black text-foreground group-hover:text-teal-400 transition-colors">
                Image Upload
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Upload image assets independently: thumbnails, channel graphics, and photo posts.
              </p>
            </div>

            {/* Supported formats */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-3 space-y-2">
              <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                Supported Formats:
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs font-mono font-semibold">
                <span className="rounded-lg bg-teal-500/10 px-2 py-0.5 text-teal-300">
                  JPG / JPEG
                </span>
                <span className="rounded-lg bg-teal-500/10 px-2 py-0.5 text-teal-300">PNG</span>
                <span className="rounded-lg bg-teal-500/10 px-2 py-0.5 text-teal-300">WEBP</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Appears in community stream after every 5 videos.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => onSelect("image")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-500 transition active:scale-95"
            >
              <span>Upload Image</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FREE VIDEO UPLOAD VIEW (Fee: ₹0)                                           */
/* -------------------------------------------------------------------------- */
function FreeVideoUploadView({
  initialFormat,
  onBack,
  onUploaded,
}: {
  initialFormat: VideoFormatChoice;
  onBack: () => void;
  onUploaded?: () => void;
}) {
  const { user, profile, dbUser } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";
  const creatorName =
    profile?.name || dbUser?.name || user?.user_metadata?.full_name || "Alex Rivera";

  const [format, setFormat] = useState<VideoFormatChoice>(initialFormat);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Coding");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [capturedThumbnail, setCapturedThumbnail] = useState<string>("");
  const [detectedDuration, setDetectedDuration] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [publishedVideo, setPublishedVideo] = useState<UploadedVideo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".mkv"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!file.type.startsWith("video/") && !validExts.includes(ext)) {
      toast.error("Unsupported video format. Please select an MP4, WebM, OGG, or MOV file.");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast.error("Video file size cannot exceed 150MB.");
      return;
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    // Capture real snapshot thumbnail frame from video
    captureVideoThumbnail(file).then((thumb) => {
      if (thumb) setCapturedThumbnail(thumb);
    });

    // Attempt duration detection via temporary video element
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const sec = Math.round(tempVideo.duration);
      if (!isNaN(sec) && sec > 0) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        setDetectedDuration(`${m}:${s.toString().padStart(2, "0")}`);
      }
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validExts = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".mkv"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!file.type.startsWith("video/") && !validExts.includes(ext)) {
      toast.error("Unsupported video format. Please drop an MP4, WebM, OGG, or MOV file.");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast.error("Video file size cannot exceed 150MB.");
      return;
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    captureVideoThumbnail(file).then((thumb) => {
      if (thumb) setCapturedThumbnail(thumb);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      toast.error("Please select a video file to upload.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a video title.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload the actual video file to production storage
      const uploadRes = await api.uploads.uploadVideo(videoFile);
      if (!uploadRes || !uploadRes.url) {
        const serverError =
          (uploadRes as any)?.error ||
          (uploadRes as any)?.message ||
          (uploadRes as any)?.msg ||
          (!uploadRes
            ? "Server returned an empty upload response."
            : typeof uploadRes === "string"
              ? uploadRes
              : (uploadRes as any)?.success === false
                ? "Server rejected video upload without providing an error message."
                : "Server storage upload succeeded with HTTP 200 but did not return a valid video URL.");
        throw new Error(serverError);
      }

      // 2. Persist video thumbnail to server storage or graceful category fallback
      let posterUrl = "";
      try {
        posterUrl = await captureAndUploadThumbnail(videoFile, category);
      } catch (_e) {
        posterUrl = capturedThumbnail || getCategoryFallbackThumbnail(category);
      }

      // 3. Persist video metadata to database through server API
      const newVideo = await recordNewVideoUpload({
        userId,
        creatorName,
        title: title.trim(),
        description: description.trim(),
        videoUrl: uploadRes.url,
        thumbnailUrl: posterUrl,
        videoType: "free",
        contentType: format,
        category,
        duration: detectedDuration || (format === "short" ? "0:45" : "14:20"),
        paymentStatus: "not_required",
        paymentAmount: 0,
      });

      setPublishedVideo(newVideo);
      setUploadSuccess(true);
      toast.success(
        `🎉 Free ${format === "short" ? "Short" : "Long"} Video uploaded and published successfully! Zero fee (₹0).`,
      );
      onUploaded?.();
    } catch (err: any) {
      console.error("Free video upload failed:", err);
      toast.error(err?.message || "Failed to upload and publish video.");
    } finally {
      setUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="mx-auto max-w-xl text-center py-12 space-y-6">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-sky-500/20 text-sky-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Free Video Published!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your {format === "short" ? "Short" : "Long"} Video &quot;{title}&quot; is live for ₹0
            with no payment.
          </p>
        </div>

        {publishedVideo?.videoUrl && (
          <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-border shadow-card bg-secondary/30 p-2">
            <video
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full rounded-xl bg-black object-contain"
              src={publishedVideo.videoUrl}
            />
            <div className="p-3 text-left">
              <div className="text-xs font-bold text-foreground truncate">
                {publishedVideo.title}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase">
                {publishedVideo.contentType} video · {publishedVideo.category} · Duration:{" "}
                {publishedVideo.duration}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {publishedVideo && (
            <Link
              to="/watch/$videoId"
              params={{ videoId: publishedVideo.id }}
              className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-dark transition shadow-lift inline-flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Watch Video Now
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setDescription("");
              setVideoFile(null);
              setPreviewUrl("");
              setPublishedVideo(null);
              setUploadSuccess(false);
            }}
            className="rounded-xl bg-secondary border border-border px-6 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
          >
            Upload Another Free Video
          </button>
          <Link
            to="/free-videos"
            search={{ refresh: Date.now() }}
            className="rounded-xl bg-secondary px-6 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
          >
            View Free Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Option 1 · Zero Fee
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Free Video Upload</h1>
          </div>
        </div>

        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-400">
          Fee: ₹0 (No Payment Required)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Format Selector: Short or Long */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
            Select Video Format <span className="text-brand">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat("short")}
              className={`rounded-xl border p-3 text-left transition ${
                format === "short"
                  ? "border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/50"
                  : "border-border bg-secondary/40 hover:bg-secondary/80"
              }`}
            >
              <div className="text-sm font-bold text-foreground">Free Short Video</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Vertical 9:16 format under 60 seconds
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFormat("long")}
              className={`rounded-xl border p-3 text-left transition ${
                format === "long"
                  ? "border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/50"
                  : "border-border bg-secondary/40 hover:bg-secondary/80"
              }`}
            >
              <div className="text-sm font-bold text-foreground">Free Long Video</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Horizontal 16:9 standard video
              </p>
            </button>
          </div>
        </div>

        {/* Video File Picker Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative cursor-pointer rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center transition hover:border-sky-500/60 hover:bg-sky-500/5 shadow-card"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.m4v"
            onChange={handleFileChange}
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-3">
              <video
                controls
                playsInline
                preload="metadata"
                className="mx-auto max-h-56 rounded-2xl bg-black object-contain border border-border shadow-sm"
                src={previewUrl}
              />
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-400">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{videoFile?.name}</span>
                <span className="text-muted-foreground font-normal">
                  ({((videoFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                  {detectedDuration ? ` · ${detectedDuration}` : ""})
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Click or drop another file to change video
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform">
                <FileVideo className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Click to select or drag and drop video file here
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports MP4, WebM, OGG, MOV (Up to 150 MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Video Metadata Inputs */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Video Title <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10 Coding Shortcuts Every React Dev Must Know"
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-sky-500 focus:outline-none"
              required
            />
          </div>

          {/* EXACT 11 CATEGORIES SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Video Category <span className="text-brand">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-sky-500 focus:outline-none"
            >
              {VIDEO_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of your video content..."
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-border bg-secondary/40 px-6 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-sky-600 px-8 py-3 text-xs font-bold text-white hover:bg-sky-500 transition shadow-sm disabled:opacity-50"
          >
            {uploading ? "Uploading & Publishing..." : `Publish Free Video (₹0)`}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PREMIUM VIDEO UPLOAD VIEW (Fee: ₹6 verified Razorpay)                      */
/* -------------------------------------------------------------------------- */
function PremiumVideoUploadView({
  initialFormat,
  onBack,
  onUploaded,
}: {
  initialFormat: VideoFormatChoice;
  onBack: () => void;
  onUploaded?: () => void;
}) {
  const { user, profile, dbUser } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";
  const creatorName =
    profile?.name || dbUser?.name || user?.user_metadata?.full_name || "Alex Rivera";
  const referrerId = profile?.referral_code || dbUser?.referral_code || undefined;

  const [format, setFormat] = useState<VideoFormatChoice>(initialFormat);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Coding");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [capturedThumbnail, setCapturedThumbnail] = useState<string>("");
  const [detectedDuration, setDetectedDuration] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".mkv"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!file.type.startsWith("video/") && !validExts.includes(ext)) {
      toast.error("Unsupported video format. Please select an MP4, WebM, OGG, or MOV file.");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast.error("Video file size cannot exceed 150MB.");
      return;
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    captureVideoThumbnail(file).then((thumb) => {
      if (thumb) setCapturedThumbnail(thumb);
    });

    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const sec = Math.round(tempVideo.duration);
      if (!isNaN(sec) && sec > 0) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        setDetectedDuration(`${m}:${s.toString().padStart(2, "0")}`);
      }
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validExts = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".mkv"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!file.type.startsWith("video/") && !validExts.includes(ext)) {
      toast.error("Unsupported video format. Please drop an MP4, WebM, OGG, or MOV file.");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast.error("Video file size cannot exceed 150MB.");
      return;
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    captureVideoThumbnail(file).then((thumb) => {
      if (thumb) setCapturedThumbnail(thumb);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      toast.error("Please select a video file for premium upload.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a video title.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload video file to server storage first
      const uploadRes = await api.uploads.uploadVideo(videoFile);
      if (!uploadRes || !uploadRes.url) {
        const serverError =
          (uploadRes as any)?.error ||
          (uploadRes as any)?.message ||
          (uploadRes as any)?.msg ||
          (!uploadRes
            ? "Server returned an empty upload response."
            : typeof uploadRes === "string"
              ? uploadRes
              : (uploadRes as any)?.success === false
                ? "Server rejected video upload without providing an error message."
                : "Server storage upload succeeded with HTTP 200 but did not return a valid video URL.");
        throw new Error(serverError);
      }

      const vidId = `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      let posterUrl = "";
      try {
        posterUrl = await captureAndUploadThumbnail(videoFile, category);
      } catch (_e) {
        posterUrl = capturedThumbnail || getCategoryFallbackThumbnail(category);
      }

      // 2. Initiate Razorpay ₹6 payment flow with server verification
      await initiatePremiumVideoPayment({
        uploaderUserId: userId,
        uploaderName: creatorName,
        userEmail: user?.email || "creator@facetube.app",
        videoId: vidId,
        videoTitle: title.trim(),
        description: description.trim(),
        videoUrl: uploadRes.url,
        thumbnailUrl: posterUrl,
        category,
        contentType: format,
        duration: detectedDuration || (format === "short" ? "0:45" : "14:20"),
        ...(referrerId ? { directReferrerId: referrerId } : {}),
        onSuccess: async () => {
          setUploading(false);
          setUploadSuccess(true);
          toast.success(
            `🎉 Sponsor ${format === "short" ? "Short" : "Long"} Video uploaded! ₹6 payment verified.`,
          );
          onUploaded?.();
        },
        onFailure: (err) => {
          setUploading(false);
          toast.error(err || "Payment failed. Video was not published.");
        },
        onCancel: () => {
          setUploading(false);
          toast.info("Payment cancelled.");
        },
      });
    } catch (err: any) {
      setUploading(false);
      toast.error(err?.message || "Failed to initiate sponsor upload.");
    }
  };

  if (uploadSuccess) {
    return (
      <div className="mx-auto max-w-xl text-center py-12 space-y-6">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-amber-500/20 text-amber-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Sponsor Video Published!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Payment of ₹6 was verified. Monetized video published with audit ledger protection.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setDescription("");
              setVideoFile(null);
              setPreviewUrl("");
              setUploadSuccess(false);
            }}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-amber-500 transition"
          >
            Upload Another Sponsor Video
          </button>
          <Link
            to="/premium-videos"
            search={{ refresh: Date.now() }}
            className="rounded-xl bg-secondary px-6 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
          >
            View Sponsor Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Option 2 · Monetized Video
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Sponsor Video Upload</h1>
          </div>
        </div>

        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
          Fee: ₹6 (Razorpay Verified)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Format Selector: Short or Long */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
            Select Video Format <span className="text-brand">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat("short")}
              className={`rounded-xl border p-3 text-left transition ${
                format === "short"
                  ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50"
                  : "border-border bg-secondary/40 hover:bg-secondary/80"
              }`}
            >
              <div className="text-sm font-bold text-foreground">Sponsor Short Video</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Monetized short-form under 60 seconds
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFormat("long")}
              className={`rounded-xl border p-3 text-left transition ${
                format === "long"
                  ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50"
                  : "border-border bg-secondary/40 hover:bg-secondary/80"
              }`}
            >
              <div className="text-sm font-bold text-foreground">Sponsor Long Video</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Monetized long-form standard video
              </p>
            </button>
          </div>
        </div>

        {/* Video File Picker Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative cursor-pointer rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center transition hover:border-amber-500/60 hover:bg-amber-500/5 shadow-card"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.m4v"
            onChange={handleFileChange}
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-3">
              <video
                controls
                playsInline
                preload="metadata"
                className="mx-auto max-h-56 rounded-2xl bg-black object-contain border border-border shadow-sm"
                src={previewUrl}
              />
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{videoFile?.name}</span>
                <span className="text-muted-foreground font-normal">
                  ({((videoFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                  {detectedDuration ? ` · ${detectedDuration}` : ""})
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Click or drop another file to change video
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <FileVideo className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Click to select or drag and drop video file here
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports MP4, WebM, OGG, MOV (Up to 150 MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Video Metadata Inputs */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Video Title <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pro Monetization Secrets: High-CPM Niches Explained"
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          {/* EXACT 11 CATEGORIES SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Video Category <span className="text-brand">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
            >
              {VIDEO_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of your monetized content..."
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Monetization Verification Notice */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs space-y-2">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> ₹6 Sponsor Upload Verification:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
            <div>
              • Monetized Status: <strong className="text-foreground">Active</strong>
            </div>
            <div>
              • Video Type: <strong className="text-foreground">Sponsor</strong>
            </div>
            <div>
              • Audit Security: <strong className="text-foreground">Ledger Protected</strong>
            </div>
            <div>
              • Processing: <strong className="text-foreground">Instant</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-border bg-secondary/40 px-6 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-amber-600 px-8 py-3 text-xs font-bold text-white hover:bg-amber-500 transition shadow-sm disabled:opacity-50"
          >
            {uploading ? "Uploading & Connecting Gateway..." : `Pay ₹6 & Publish Sponsor Video`}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* AD PROMOTION VIEW (Exact Pricing: 7d=100, 15d=200, 1mo=300, 1yr=3,000)    */
/* -------------------------------------------------------------------------- */
function AdPromotionUploadView({
  onBack,
  onUploaded,
}: {
  onBack: () => void;
  onUploaded?: () => void;
}) {
  const { user, profile, dbUser } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";
  const creatorName =
    profile?.name || dbUser?.name || user?.user_metadata?.full_name || "Alex Rivera";
  const referrerId = profile?.referral_code || dbUser?.referral_code || undefined;

  type AdsPlanKey = "plan-7-days" | "plan-15-days" | "plan-monthly" | "plan-yearly";

  interface DurationPlan {
    id: AdsPlanKey;
    name: string;
    label: string;
    days: number;
    price: number;
    rateText: string;
  }

  const DEFAULT_DURATION_PLAN: DurationPlan = {
    id: "plan-7-days",
    name: "7_days",
    label: "7 Days",
    days: 7,
    price: 100,
    rateText: "₹14.28/day",
  };

  const DURATION_PLANS: DurationPlan[] = [
    {
      id: "plan-7-days",
      name: "7_days",
      label: "7 Days",
      days: 7,
      price: 100,
      rateText: "₹14.28/day",
    },
    {
      id: "plan-15-days",
      name: "15_days",
      label: "15 Days",
      days: 15,
      price: 200,
      rateText: "₹13.33/day",
    },
    {
      id: "plan-monthly",
      name: "1_month",
      label: "1 Month",
      days: 30,
      price: 300,
      rateText: "₹10.00/day",
    },
    {
      id: "plan-yearly",
      name: "1_year",
      label: "1 Year",
      days: 365,
      price: 3000,
      rateText: "₹8.22/day",
    },
  ];

  const [format, setFormat] = useState<VideoFormatChoice>("short");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-7-days");
  const [availableVideos, setAvailableVideos] = useState<UploadedVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    fetchUploadedVideos(userId).then((vids) => {
      setAvailableVideos(vids);
      const firstVid = vids[0];
      if (firstVid) setSelectedVideoId(firstVid.id);
    });
  }, [userId]);

  const currentPlan: DurationPlan =
    DURATION_PLANS.find((p) => p.id === selectedPlanId) ??
    DURATION_PLANS[0] ??
    DEFAULT_DURATION_PLAN;

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoId && availableVideos.length === 0) {
      toast.error("Please upload a video first before promoting.");
      return;
    }

    setIsProcessing(true);
    await initiateAdsPromotionPayment({
      userId,
      userName: creatorName,
      userEmail: user?.email || "creator@facetube.app",
      videoId: selectedVideoId || "vid-custom",
      planId: currentPlan.id,
      planName: currentPlan.label,
      durationDays: currentPlan.days,
      price: currentPlan.price,
      ...(referrerId ? { directReferrerId: referrerId } : {}),
      onSuccess: () => {
        setIsProcessing(false);
        setActivated(true);
        toast.success(
          `🎉 Ad Promotion active for ${currentPlan.label}! Payment of ₹${currentPlan.price.toLocaleString("en-IN")} verified.`,
        );
        onUploaded?.();
      },
      onFailure: (err) => {
        setIsProcessing(false);
        toast.error(err || "Ad Promotion payment failed.");
      },
      onCancel: () => {
        setIsProcessing(false);
        toast.info("Payment cancelled.");
      },
    });
  };

  if (activated) {
    return (
      <div className="mx-auto max-w-xl text-center py-12 space-y-6">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">🎉 Ad Promotion Campaign Active!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Payment of <strong>₹{currentPlan.price.toLocaleString("en-IN")}</strong> was verified.
            Your video is now featured for <strong>{currentPlan.label}</strong>.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            to="/ads-promotions"
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
          >
            View Active Promotions
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl bg-secondary px-6 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Option 3 · Audience Growth
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Ad Video Campaign</h1>
          </div>
        </div>

        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
          Verified Payment Required
        </span>
      </div>

      <form onSubmit={handleLaunch} className="space-y-6">
        {/* Promotion Type: Short or Long */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
            Select Video Format to Promote <span className="text-brand">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat("short")}
              className={`rounded-xl border p-3 text-left transition ${
                format === "short"
                  ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50"
                  : "border-border bg-secondary/40 hover:bg-secondary/80"
              }`}
            >
              <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>Short Video</span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Ads
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Boost viral short-form video in feed
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFormat("long")}
              className={`rounded-xl border p-3 text-left transition ${
                format === "long"
                  ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50"
                  : "border-border bg-secondary/40 hover:bg-secondary/80"
              }`}
            >
              <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>Long Video</span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Ads
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Featured placement for standard long videos
              </p>
            </button>
          </div>
        </div>

        {/* Existing Video Selection */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
            Select Video From Your Channel <span className="text-brand">*</span>
          </label>
          {availableVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableVideos.map((vid) => (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => setSelectedVideoId(vid.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selectedVideoId === vid.id
                      ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40"
                      : "border-border bg-secondary/30 hover:bg-secondary/60"
                  }`}
                >
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    className="h-12 w-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-foreground truncate">{vid.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 capitalize font-mono">
                      {vid.videoType} · {vid.contentType}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No videos uploaded yet. A promotional placeholder campaign will be configured.
            </p>
          )}
        </div>

        {/* EXACT CONFIGURED PRICING PLANS */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
            Select Ad Promotion Duration &amp; Pricing <span className="text-brand">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DURATION_PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedPlanId === plan.id
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50 shadow-sm"
                    : "border-border bg-secondary/30 hover:bg-secondary/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{plan.label}</span>
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="mt-2 text-xl font-black text-foreground">
                  ₹{plan.price.toLocaleString("en-IN")}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                  {plan.rateText}
                </div>
                <div className="mt-3 text-[10px] font-semibold text-emerald-400">
                  Direct Referrer earns 10%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-border bg-secondary/40 px-6 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="rounded-xl bg-emerald-600 px-8 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
          >
            {isProcessing
              ? "Connecting Gateway..."
              : `Launch Ad Campaign (₹${currentPlan.price.toLocaleString("en-IN")})`}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* IMAGE UPLOAD VIEW (JPG/JPEG, PNG, WEBP)                                    */
/* -------------------------------------------------------------------------- */
function ImageUploadView({ onBack }: { onBack: () => void }) {
  const { user, profile, dbUser } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";
  const creatorName =
    profile?.name || dbUser?.name || user?.user_metadata?.full_name || "Alex Rivera";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Coding");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Requirement 11: 9:16 Aspect Ratio Validation (target ~0.5625 with 0.08 tolerance)
  const validate9to16Image = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const ratio = img.naturalWidth / img.naturalHeight;
        const targetRatio = 9 / 16; // 0.5625
        const tolerance = 0.08;
        if (Math.abs(ratio - targetRatio) > tolerance) {
          toast.error(
            `Aspect Ratio Error: Image must be in 9:16 vertical format (e.g. 1080x1920 or 720x1280). Selected image is ${img.naturalWidth}x${img.naturalHeight} (ratio: ${ratio.toFixed(2)}).`,
          );
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast.error("Could not read image file dimensions. Please select a valid image.");
        resolve(false);
      };
      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format: JPG/JPEG, PNG, WEBP
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported image format. Please select a JPG, JPEG, PNG, or WEBP image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const isValidRatio = await validate9to16Image(file);
    if (!isValidRatio) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported image format. Please drop a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    const isValidRatio = await validate9to16Image(file);
    if (!isValidRatio) {
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Please select an image file to upload.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter an image title.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload the image file to real persistent server storage
      const uploadRes = await api.uploads.uploadImage(imageFile);
      if (!uploadRes || !uploadRes.success || !uploadRes.url) {
        const serverError =
          (uploadRes as any)?.error ||
          (uploadRes as any)?.message ||
          (uploadRes as any)?.msg ||
          (!uploadRes
            ? "Server returned an empty upload response."
            : typeof uploadRes === "string"
              ? uploadRes
              : (uploadRes as any)?.success === false
                ? "Server rejected image upload without providing an error message."
                : "Server storage upload succeeded with HTTP 200 but did not return a valid image URL.");
        throw new Error(serverError);
      }

      // 2. Format and file size from server response or validated file
      let format: "jpg" | "jpeg" | "png" | "webp" = "jpg";
      if (uploadRes.format === "png" || imageFile.type === "image/png") format = "png";
      else if (uploadRes.format === "webp" || imageFile.type === "image/webp") format = "webp";
      else if (uploadRes.format === "jpeg" || imageFile.name.toLowerCase().endsWith(".jpeg"))
        format = "jpeg";

      const fileSize = uploadRes.fileSize || `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB`;

      // 3. Persist image metadata with persistent URL to database
      const created = await recordNewImageUpload({
        userId,
        creatorName,
        title: title.trim(),
        description: description.trim(),
        imageUrl: uploadRes.url,
        format,
        fileSize,
        category,
      });

      setUploadedImage(created);
      toast.success("🎉 Image uploaded successfully! Saved to your media library.");
    } catch (err: any) {
      console.error("Image upload failed:", err);
      toast.error(err?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  if (uploadedImage) {
    return (
      <div className="mx-auto max-w-xl text-center py-12 space-y-6">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-teal-500/20 text-teal-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Image Uploaded Successfully!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            &quot;{uploadedImage.title}&quot; has been recorded in your FaceTube asset gallery. It
            will appear in the stream feed after every 5 videos.
          </p>
        </div>

        {uploadedImage.imageUrl && (
          <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-border shadow-card bg-secondary/30">
            <img
              src={uploadedImage.imageUrl}
              alt={uploadedImage.title}
              className="h-48 w-full object-cover"
            />
            <div className="p-3 text-left">
              <div className="text-xs font-bold text-foreground truncate">
                {uploadedImage.title}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase">
                {uploadedImage.format} · {uploadedImage.fileSize} · {uploadedImage.category}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setDescription("");
              setImageFile(null);
              setPreviewUrl("");
              setUploadedImage(null);
            }}
            className="rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition"
          >
            Upload Another Image
          </button>
          <Link
            to="/images-uploaded"
            className="rounded-xl bg-secondary px-6 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
          >
            View Image Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
              Option 4 · Asset Studio
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Image Upload</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400">
            Formats: JPG, PNG, WEBP
          </span>
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400">
            Aspect Ratio: 9:16 Vertical
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative cursor-pointer rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center transition hover:border-teal-500/60 hover:bg-teal-500/5 shadow-card"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Selected Image Preview"
                className="mx-auto max-h-72 rounded-2xl object-contain border border-border shadow-sm aspect-[9/16]"
              />
              <p className="text-xs font-bold text-teal-400">
                Click or drop another file to change image (9:16 verified)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-transform">
                <FileImage className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Click to select or drag and drop 9:16 image here
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vertical format strictly required: 9:16 ratio (e.g. 1080x1920) · JPG, PNG, WEBP up
                  to 25 MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Image Metadata Inputs */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Image Title <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Masterclass 4K Artwork / Community Photo"
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none"
              required
            />
          </div>

          {/* EXACT 11 CATEGORIES SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Category <span className="text-brand">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none"
            >
              {VIDEO_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
              Description / Caption
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share thoughts, credits, or context for this image..."
              className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-border bg-secondary/40 px-6 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3 text-xs font-bold text-white hover:bg-teal-500 transition shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Uploading Image to Server...
              </>
            ) : (
              "Upload Image"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
