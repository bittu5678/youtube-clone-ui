import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  DollarSign,
  Zap,
  Video,
  Clapperboard,
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
} from "lucide-react";
import { Logo } from "@/components/videohub/Logo";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { BottomNav } from "@/components/videohub/BottomNav";
import { useAuth } from "@/lib/auth-context";

type UploadType =
  "premium" | "premium-shorts" | "premium-long" | "shorts" | "long" | "movie" | "ads" | null;

interface UploadSearch {
  type?: UploadType;
}

export const Route = createFileRoute("/upload")({
  validateSearch: (search: Record<string, unknown>): UploadSearch => {
    const validTypes: UploadType[] = [
      "premium",
      "premium-shorts",
      "premium-long",
      "shorts",
      "long",
      "movie",
      "ads",
    ];
    const type = search.type as UploadType;
    return {
      type: validTypes.includes(type) ? type : null,
    };
  },
  head: () => ({
    meta: [
      { title: "Upload Studio — FaceTube" },
      {
        name: "description",
        content:
          "Upload premium videos with ads earnings, viral shorts, long form content, movies, and advertising campaigns on FaceTube.",
      },
      { property: "og:title", content: "Upload Studio — FaceTube" },
    ],
  }),
  component: UploadStudioPage,
});

interface OptionCardConfig {
  id: NonNullable<UploadType>;
  title: string;
  subtitle: string;
  badge?: string;
  icon: typeof DollarSign;
  accent: "gold" | "red" | "blue" | "purple" | "emerald";
  description: string;
  features: string[];
  isPremium?: boolean;
}

const UPLOAD_OPTIONS: OptionCardConfig[] = [
  {
    id: "premium-shorts",
    title: "Premium Shorts Video Upload",
    subtitle: "Ads Earnings Enabled · Vertical Shorts",
    badge: "Monetized · ⚡ Shorts",
    icon: Zap,
    accent: "gold",
    isPremium: true,
    description:
      "Monetize viral vertical shorts with 70% ad revenue share, creator fund pools, and mobile feed boost.",
    features: [
      "70% Shorts feed ad revenue split",
      "9:16 vertical algorithm fast discovery",
      "Super Thanks & sound remixing enabled",
    ],
  },
  {
    id: "premium-long",
    title: "Premium Long Video Upload",
    subtitle: "Ads Earnings Enabled · Full Length 4K",
    badge: "Monetized · ⚡ Long Form",
    icon: Video,
    accent: "gold",
    isPremium: true,
    description:
      "Monetize extended tutorials, streams, and podcasts with pre-roll, mid-roll, and sponsor ad placements.",
    features: [
      "Customizable mid-roll & pre-roll ad breaks",
      "Full 4K 60fps HDR with surround sound",
      "Channel Memberships & Super Chat enabled",
    ],
  },
  {
    id: "premium",
    title: "Premium Video Upload",
    subtitle: "Ads Earnings Enabled",
    badge: "Monetized · Revenue Share",
    icon: DollarSign,
    accent: "gold",
    isPremium: true,
    description:
      "Earn 70% ad revenue share with programmatic pre-roll, mid-roll, and sponsor placements.",
    features: [
      "Auto ad insertion & CPM optimization",
      "Super Thanks & Channel Memberships",
      "4K 60fps & HDR supported",
    ],
  },
  {
    id: "shorts",
    title: "Shorts Video Upload",
    subtitle: "No Earnings",
    badge: "Vertical · Up to 60s",
    icon: Zap,
    accent: "red",
    description:
      "Publish quick vertical content optimized for the mobile feed algorithms and discoverability.",
    features: [
      "Instant mobile discovery engine",
      "Sound track remixing & stitches",
      "Automatic hashtag suggestions",
    ],
  },
  {
    id: "long",
    title: "Long Video Upload",
    subtitle: "No Earnings",
    badge: "Community Video",
    icon: Video,
    accent: "blue",
    description:
      "Share extended tutorials, podcasts, documentaries, and community streams without ads.",
    features: [
      "Unlimited length & full 1080p/4K",
      "Smart chapter timestamps & cards",
      "Custom playlists & annotations",
    ],
  },
  {
    id: "movie",
    title: "New Movie Upload",
    subtitle: "Feature Film & Series",
    badge: "Cinema Master",
    icon: Clapperboard,
    accent: "purple",
    description:
      "High-bitrate master uploads for indie films, full series, documentaries, and cinema releases.",
    features: [
      "Surround Sound & Dolby 5.1 track",
      "Poster artwork & credit roles",
      "Multi-language SRT subtitles",
    ],
  },
  {
    id: "ads",
    title: "Ads Promotions",
    subtitle: "Campaigns & Sponsored Ads",
    badge: "Audience Growth",
    icon: Megaphone,
    accent: "emerald",
    description:
      "Promote your channel, product, or video directly to targeted viewer demographics.",
    features: [
      "Laser-targeted regional audience",
      "Custom call-to-action buttons",
      "Real-time conversion & impression ROI",
    ],
  },
];

function UploadStudioPage() {
  const search = useSearch({ from: "/upload" });
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const activeType = search.type || null;

  const setUploadType = (type: UploadType) => {
    navigate({
      to: "/upload",
      search: type ? { type } : {},
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
            {activeType && (
              <button
                type="button"
                onClick={() => setUploadType(null)}
                className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary sm:inline-flex"
              >
                <Layers className="h-3.5 w-3.5" />
                All Formats
              </button>
            )}

            <ThemeToggle showLabelsOnWide={false} />

            <Link
              to="/"
              className="rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
            >
              Back to Feed
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white shadow-sm">
                  {profile?.username ? profile.username.substring(0, 2).toUpperCase() : "U"}
                </span>
              </div>
            ) : (
              <Link
                to="/auth"
                className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 pb-28 lg:pb-16">
        {!activeType ? (
          <SelectionView onSelect={setUploadType} />
        ) : (
          <UploadFormView
            type={activeType}
            onBack={() => setUploadType(null)}
            onSelectType={setUploadType}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Option Selection View (5 Option Cards)                                      */
/* -------------------------------------------------------------------------- */
function SelectionView({ onSelect }: { onSelect: (type: NonNullable<UploadType>) => void }) {
  return (
    <div className="space-y-8">
      {/* Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/80 via-card to-background p-6 sm:p-10 shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"
        />

        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            FaceTube Upload Studio
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl text-foreground">
            Select Your Upload Format
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Choose how you want to publish on FaceTube. Select monetized premium uploads with ad
            revenue, viral shorts, standard long videos, movies, or promotional campaigns.
          </p>
        </div>
      </div>

      {/* Option Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UPLOAD_OPTIONS.map((opt) => {
          const isGold = opt.accent === "gold";
          const isPremium = opt.isPremium || isGold;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border text-left transition-all duration-200 active:scale-[0.99] ${
                isPremium
                  ? "border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-card/90 to-card shadow-[0_0_24px_rgba(245,158,11,0.12)] hover:border-amber-400 hover:shadow-[0_0_32px_rgba(245,158,11,0.22)] ring-1 ring-amber-500/30"
                  : opt.accent === "red"
                    ? "border-red-500/30 bg-gradient-to-b from-red-500/10 via-card/90 to-card hover:border-red-500/60 hover:shadow-lg"
                    : opt.accent === "blue"
                      ? "border-blue-500/30 bg-gradient-to-b from-blue-500/10 via-card/90 to-card hover:border-blue-500/60 hover:shadow-lg"
                      : opt.accent === "purple"
                        ? "border-purple-500/30 bg-gradient-to-b from-purple-500/10 via-card/90 to-card hover:border-purple-500/60 hover:shadow-lg"
                        : "border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-card/90 to-card hover:border-emerald-500/60 hover:shadow-lg"
              } p-6`}
            >
              {/* Premium card corner ribbon */}
              {isPremium && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-l from-amber-500 to-yellow-500 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-sm">
                  {opt.id === "premium-shorts"
                    ? "⚡ Monetized Shorts"
                    : opt.id === "premium-long"
                      ? "⚡ Monetized 4K Master"
                      : "★ Revenue Enabled"}
                </div>
              )}

              <div>
                {/* Icon & Badge Row */}
                <div className="flex items-center justify-between">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 ${
                      isGold
                        ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black"
                        : opt.accent === "red"
                          ? "bg-red-500/20 text-red-500 border border-red-500/30"
                          : opt.accent === "blue"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : opt.accent === "purple"
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    <opt.icon className={`h-6 w-6 ${isGold ? "stroke-[2.5]" : "stroke-[2]"}`} />
                  </div>

                  {/* Right side: Glowing lightning (⚡) premium effect with subtle gold/yellow glow */}
                  {isPremium ? (
                    <div className="relative flex items-center justify-center">
                      {/* Subtle gold/yellow ambient glow */}
                      <span className="absolute -inset-1.5 rounded-full bg-amber-400/40 blur-md animate-pulse" />
                      <div className="relative flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 px-3 py-1 text-xs font-black text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.5)]">
                        <Zap className="h-4 w-4 fill-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.95)] animate-pulse" />
                        <span>⚡ PREMIUM</span>
                      </div>
                    </div>
                  ) : (
                    opt.badge && (
                      <span className="rounded-full border border-border bg-secondary/80 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {opt.badge}
                      </span>
                    )
                  )}
                </div>

                {/* Card Title & Subtitle */}
                <div className="mt-5">
                  <h3 className="text-lg font-black tracking-tight text-foreground group-hover:text-brand transition-colors">
                    {opt.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5">
                    {isGold ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                        <DollarSign className="h-3.5 w-3.5" />
                        {opt.subtitle}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {opt.subtitle}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {opt.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="mt-4 space-y-1.5 border-t border-border/50 pt-3">
                  {opt.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2 text-[11px] text-foreground/80"
                    >
                      <Check
                        className={`h-3 w-3 shrink-0 ${isGold ? "text-amber-400" : "text-brand"}`}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button Link */}
              <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                <span
                  className={`text-xs font-bold ${
                    isGold
                      ? "text-amber-400 group-hover:underline"
                      : "text-foreground group-hover:text-brand"
                  }`}
                >
                  Continue to Form
                </span>
                <div className="flex items-center gap-2">
                  {isPremium && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <Zap className="h-3 w-3 fill-amber-400 text-amber-300 animate-pulse" />
                      Monetized
                    </span>
                  )}
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full transition-transform group-hover:translate-x-1 ${
                      isGold
                        ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                        : "bg-secondary text-foreground group-hover:bg-brand group-hover:text-white"
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dedicated Upload Form View (Specific per Option)                           */
/* -------------------------------------------------------------------------- */
function UploadFormView({
  type,
  onBack,
  onSelectType,
}: {
  type: NonNullable<UploadType>;
  onBack: () => void;
  onSelectType: (t: NonNullable<UploadType>) => void;
}) {
  const currentConfig = UPLOAD_OPTIONS.find((o) => o.id === type) || UPLOAD_OPTIONS[0];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDoneUploading, setIsDoneUploading] = useState<boolean>(false);

  const isShorts = type === "shorts" || type === "premium-shorts";
  const isLong = type === "long" || type === "premium-long";
  const isMonetized = type === "premium" || type === "premium-shorts" || type === "premium-long";

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("Entertainment");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>(
    isShorts
      ? ["shorts", "trending", "facetube", ...(type === "premium-shorts" ? ["monetized"] : [])]
      : ["facetube", "creators", ...(type === "premium-long" ? ["4k", "monetized"] : [])],
  );

  // Specialized Fields
  const [monetizationActive, setMonetizationActive] = useState<boolean>(isMonetized);
  const [adBreaks, setAdBreaks] = useState<{
    preroll: boolean;
    midroll: boolean;
    postroll: boolean;
  }>({
    preroll: true,
    midroll: true,
    postroll: true,
  });

  // Movie Fields
  const [movieDirector, setMovieDirector] = useState<string>("");
  const [movieStudio, setMovieStudio] = useState<string>("");
  const [movieRating, setMovieRating] = useState<string>("PG-13");
  const [movieAudio, setMovieAudio] = useState<string>("5.1 Surround");

  // Ads Promotion Fields
  const [adGoal, setAdGoal] = useState<string>("views");
  const [adBudget, setAdBudget] = useState<number>(50);
  const [adTargetCountry, setAdTargetCountry] = useState<string>("Worldwide");
  const [adButtonText, setAdButtonText] = useState<string>("Watch Now");
  const [adTargetUrl, setAdTargetUrl] = useState<string>("https://facetube.app");

  // Publishing simulated status
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [published, setPublished] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Simulate progress upload
    setIsUploading(true);
    setFileProgress(15);

    const interval = setInterval(() => {
      setFileProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsDoneUploading(true);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, "");
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublished(true);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Category Picker Tabs (Quick Switching) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Types
        </button>

        {UPLOAD_OPTIONS.map((opt) => {
          const isActive = opt.id === type;
          const isGold = opt.accent === "gold";

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectType(opt.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? isGold
                    ? "bg-amber-400 text-black shadow-md"
                    : "bg-brand text-white shadow-lift"
                  : "border border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground"
              }`}
            >
              <opt.icon className="h-3.5 w-3.5" />
              <span>{opt.title.replace(" Upload", "")}</span>
              {isGold && <span className="text-[10px] opacity-90 font-black">⚡</span>}
            </button>
          );
        })}
      </div>

      {published ? (
        /* ---------------- Success Screen ---------------- */
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center sm:p-12 shadow-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h2 className="mt-5 text-2xl font-black text-foreground sm:text-3xl">
            {type === "ads"
              ? "Campaign Launched Successfully!"
              : type === "premium-shorts"
                ? "Premium Short Published Successfully!"
                : type === "premium-long"
                  ? "Premium Long Video Published Successfully!"
                  : "Video Published Successfully!"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {type === "premium-shorts"
              ? "Your Premium Short is live with ads monetization enabled! Earnings from Shorts feed views and Super Thanks will update in real-time."
              : type === "premium-long"
                ? "Your Premium Long Video is live with 4K HDR monetization enabled! Pre-roll and mid-roll ad earnings will update in real-time."
                : type === "premium"
                  ? "Your premium video is live with ads monetization enabled. Ad earnings will update in real-time."
                  : type === "ads"
                    ? "Your promotional ad campaign is now active and delivering impressions across FaceTube."
                    : "Your video has been encoded and is now visible to viewers worldwide on FaceTube."}
          </p>

          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-border bg-card p-4 text-left shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Video Details
            </p>
            <p className="mt-1 font-bold text-foreground truncate">
              {title || "Untitled FaceTube Video"}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Format: <strong className="text-foreground">{currentConfig.title}</strong>
              </span>
              <span className="capitalize">
                Status: <strong className="text-emerald-500 font-bold">Live ({visibility})</strong>
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-lift transition hover:bg-brand-dark"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch on FaceTube
            </Link>

            <button
              type="button"
              onClick={() => {
                setPublished(false);
                setSelectedFile(null);
                setFileProgress(0);
                setIsDoneUploading(false);
                setTitle("");
                setDescription("");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary/80"
            >
              <Upload className="h-4 w-4" />
              Upload Another
            </button>
          </div>
        </div>
      ) : (
        /* ---------------- Upload Form ---------------- */
        <form onSubmit={handlePublish} className="space-y-8">
          {/* Header Description for Selected Option */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${
              isMonetized
                ? "border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-card"
                : type === "shorts"
                  ? "border-red-500/30 bg-gradient-to-r from-red-500/10 via-card to-card"
                  : type === "movie"
                    ? "border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-card to-card"
                    : type === "ads"
                      ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card"
                      : "border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-card to-card"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-11 w-11 place-items-center rounded-xl font-bold ${
                    isMonetized ? "bg-amber-400 text-black" : "bg-brand/20 text-brand"
                  }`}
                >
                  <currentConfig.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground">
                    {currentConfig.title}
                  </h2>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {currentConfig.subtitle} · {currentConfig.badge}
                  </p>
                </div>
              </div>

              {isMonetized && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                  <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-300 animate-pulse" />
                  Estimated CPM: {type === "premium-shorts" ? "$3.80 - $8.50" : "$6.20 - $16.50"}
                </div>
              )}
            </div>
          </div>

          {/* Section 1: File Dropzone */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
              Step 1: Video File
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept={isShorts ? "video/mp4,video/webm" : "video/*"}
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center transition hover:border-brand/60 hover:bg-secondary/30 active:scale-[0.99]"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-brand shadow-inner">
                  <Upload className="h-7 w-7" />
                </div>
                <p className="mt-4 font-bold text-foreground">
                  Drag and drop{" "}
                  {isShorts
                    ? "vertical video (< 60s)"
                    : isLong
                      ? "long-form video (1080p/4K)"
                      : "video file"}{" "}
                  here, or browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  MP4, WebM, MOV, or MKV up to 10GB. 1080p, 4K 60fps supported.
                </p>
                <button
                  type="button"
                  className="mt-5 rounded-full bg-brand px-5 py-2 text-xs font-bold text-white shadow-lift hover:bg-brand-dark"
                >
                  Select File
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                      <FileVideo className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB ·{" "}
                        {isDoneUploading ? "Upload complete" : `Uploading (${fileProgress}%)`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Change File
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isDoneUploading ? "bg-emerald-500" : "bg-brand"
                      }`}
                      style={{ width: `${fileProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Metadata Details */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
              Step 2: Video Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                Video Title <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={
                  type === "shorts"
                    ? "Add a catchy title #Shorts"
                    : type === "movie"
                      ? "Movie Title (Year)"
                      : "Add a title that describes your video"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/40 px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-brand focus:bg-background focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Tell viewers about your video, include timestamps, links, or credits..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 p-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-brand focus:bg-background focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm font-medium text-foreground focus:border-brand focus:bg-background focus:outline-none"
                >
                  <option value="Entertainment">Entertainment</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Technology">Technology & Coding</option>
                  <option value="Music">Music & Sound</option>
                  <option value="Education">Education & Tutorial</option>
                  <option value="Film & Animation">Film & Animation</option>
                  <option value="News & Politics">News & Current Affairs</option>
                  <option value="Sports">Sports & Fitness</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as "public" | "unlisted" | "private")
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm font-medium text-foreground focus:border-brand focus:bg-background focus:outline-none"
                >
                  <option value="public">Public (Everyone can search and watch)</option>
                  <option value="unlisted">Unlisted (Anyone with link can watch)</option>
                  <option value="private">Private (Only you can watch)</option>
                </select>
              </div>
            </div>

            {/* Tags section */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                Tags & Hashtags
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag and press Add (e.g. gameplay, 4k)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="h-10 flex-1 rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-brand focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-xl bg-secondary px-4 text-xs font-bold text-foreground hover:bg-secondary/80"
                >
                  Add
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-muted-foreground hover:text-brand"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Specialized Option Controls */}
          {isMonetized && (
            <div className="rounded-2xl border border-amber-500/40 bg-card p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400">
                      Monetization & Ad Preferences
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                      <Zap className="h-3 w-3 fill-amber-400 text-amber-300 animate-pulse" />
                      <span>⚡ PREMIUM ACTIVE</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {type === "premium-shorts"
                      ? "Shorts Feed Ad Revenue Share (70%) + Super Thanks active on this vertical short."
                      : type === "premium-long"
                        ? "Long-form programmatic pre-roll, mid-roll, and post-roll ad revenue enabled with monthly payouts."
                        : "Ads earnings are active on this video. 70% revenue split paid monthly."}
                  </p>
                </div>
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-300">
                  Active ($)
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="text-xs font-bold">
                    {type === "premium-shorts" ? "Shorts Feed Ads" : "Pre-roll Ads"}
                  </span>
                  <input
                    type="checkbox"
                    checked={adBreaks.preroll}
                    onChange={(e) => setAdBreaks({ ...adBreaks, preroll: e.target.checked })}
                    className="h-4 w-4 accent-amber-400"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="text-xs font-bold">
                    {type === "premium-shorts" ? "Super Thanks" : "Mid-roll Ad Breaks"}
                  </span>
                  <input
                    type="checkbox"
                    checked={adBreaks.midroll}
                    onChange={(e) => setAdBreaks({ ...adBreaks, midroll: e.target.checked })}
                    className="h-4 w-4 accent-amber-400"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="text-xs font-bold">
                    {type === "premium-shorts" ? "Sponsor Badges" : "Post-roll Ads"}
                  </span>
                  <input
                    type="checkbox"
                    checked={adBreaks.postroll}
                    onChange={(e) => setAdBreaks({ ...adBreaks, postroll: e.target.checked })}
                    className="h-4 w-4 accent-amber-400"
                  />
                </label>
              </div>
            </div>
          )}

          {type === "movie" && (
            <div className="rounded-2xl border border-purple-500/30 bg-card p-6 shadow-card space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-400">
                Cinema & Production Attributes
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-foreground">Director</label>
                  <input
                    type="text"
                    placeholder="e.g. Christopher Nolan"
                    value={movieDirector}
                    onChange={(e) => setMovieDirector(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Studio / Production
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Warner Bros / A24 / Indie"
                    value={movieStudio}
                    onChange={(e) => setMovieStudio(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground">Age Rating</label>
                  <select
                    value={movieRating}
                    onChange={(e) => setMovieRating(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground"
                  >
                    <option value="G">G - General Audiences</option>
                    <option value="PG">PG - Parental Guidance</option>
                    <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                    <option value="R">R - Restricted</option>
                    <option value="NC-17">NC-17 - Adults Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground">Audio Master</label>
                  <select
                    value={movieAudio}
                    onChange={(e) => setMovieAudio(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground"
                  >
                    <option value="5.1 Surround">5.1 Dolby Surround</option>
                    <option value="Dolby Atmos">Dolby Atmos Spatial</option>
                    <option value="Stereo PCM">Stereo Hi-Res PCM</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {type === "ads" && (
            <div className="rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-card space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                Ad Promotion & Campaign Goals
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-foreground">Campaign Goal</label>
                  <select
                    value={adGoal}
                    onChange={(e) => setAdGoal(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground"
                  >
                    <option value="views">Maximize Video Views & Watch Time</option>
                    <option value="subscribers">Gain Channel Subscribers</option>
                    <option value="leads">Drive Clicks to External Website</option>
                    <option value="brand">Brand Awareness & Reach</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Daily Budget ($ USD)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={10000}
                    value={adBudget}
                    onChange={(e) => setAdBudget(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Target Audience / Country
                  </label>
                  <select
                    value={adTargetCountry}
                    onChange={(e) => setAdTargetCountry(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground"
                  >
                    <option value="Worldwide">Worldwide (Global Distribution)</option>
                    <option value="US_CA">United States & Canada</option>
                    <option value="IN_ASIA">India & South Asia</option>
                    <option value="EU">Europe (UK, DE, FR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Call-to-Action Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={adTargetUrl}
                    onChange={(e) => setAdTargetUrl(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notice for Shorts / Long Video */}
          {(type === "shorts" || type === "long") && (
            <div className="rounded-xl border border-border/70 bg-secondary/20 p-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  Standard {type === "shorts" ? "Shorts" : "Long Video"} format:{" "}
                  <strong>No Earnings</strong> on ad revenue. To monetize with ads, choose{" "}
                  <strong className="text-amber-400">
                    {type === "shorts" ? "Premium Shorts Video" : "Premium Long Video"}
                  </strong>
                  .
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectType(type === "shorts" ? "premium-shorts" : "premium-long")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-400/20 shrink-0 self-start sm:self-auto"
              >
                <Zap className="h-3 w-3 fill-amber-400 text-amber-300" />
                Switch to {type === "shorts" ? "Premium Shorts" : "Premium Long"}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-6">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-6 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel & Pick Format
            </button>

            <button
              type="submit"
              disabled={isPublishing}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold shadow-lift transition-all active:scale-95 disabled:opacity-50 ${
                isMonetized
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              {isPublishing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Publishing to FaceTube...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {type === "ads"
                    ? "Launch Ad Campaign"
                    : type === "premium-shorts"
                      ? "Publish Premium Short (⚡)"
                      : type === "premium-long"
                        ? "Publish Premium Long Video (⚡)"
                        : "Publish Video"}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
