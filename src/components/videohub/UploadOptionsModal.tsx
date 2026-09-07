import {
  DollarSign,
  Zap,
  Video,
  Clapperboard,
  Megaphone,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

export interface UploadOptionItem {
  id: "premium" | "shorts" | "long" | "movie" | "ads";
  title: string;
  subtitle: string;
  badge: string;
  icon: typeof DollarSign;
  accentClass: string;
  iconBgClass: string;
  description: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const UPLOAD_OPTIONS_LIST: UploadOptionItem[] = [
  {
    id: "premium",
    title: "Premium Video Upload (Ads Earnings + $)",
    subtitle: "Ads Earnings Enabled",
    badge: "Monetized · $ Revenue Share",
    icon: DollarSign,
    accentClass:
      "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10",
    iconBgClass: "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30",
    description: "Earn 70% ad revenue share with pre-roll, mid-roll, and sponsor placements.",
  },
  {
    id: "shorts",
    title: "Shorts Video Upload",
    subtitle: "Vertical · Fast Discovery",
    badge: "Up to 60s",
    icon: Zap,
    accentClass: "border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10",
    iconBgClass: "bg-red-500/20 text-red-500 ring-1 ring-red-500/30",
    description: "Publish quick vertical content optimized for mobile feed algorithm discovery.",
  },
  {
    id: "long",
    title: "Long Video Upload",
    subtitle: "Standard Video",
    badge: "Community Video",
    icon: Video,
    accentClass: "border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10",
    iconBgClass: "bg-blue-500/20 text-blue-500 ring-1 ring-blue-500/30",
    description: "Share extended tutorials, podcasts, documentaries, and community streams.",
  },
  {
    id: "movie",
    title: "New Movie Upload",
    subtitle: "Cinema & Series Master",
    badge: "Dolby 5.1 · 4K",
    icon: Clapperboard,
    accentClass:
      "border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 hover:bg-purple-500/10",
    iconBgClass: "bg-purple-500/20 text-purple-500 ring-1 ring-purple-500/30",
    description: "High-bitrate master uploads for indie films, full series, and cinema releases.",
  },
  {
    id: "ads",
    title: "Ads Promotions",
    subtitle: "Campaigns & Growth",
    badge: "Audience Growth",
    icon: Megaphone,
    accentClass:
      "border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10",
    iconBgClass: "bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/30",
    description: "Promote your channel, product, or video directly to targeted demographics.",
  },
];

interface UploadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadOptionsModal({ isOpen, onClose }: UploadOptionsModalProps) {
  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-options-title"
        className="relative z-10 w-full max-w-lg rounded-t-3xl border border-border bg-card p-5 shadow-2xl transition-all animate-in slide-in-from-bottom-5 sm:rounded-3xl sm:p-6"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden" />

        {/* Header */}
        <div className="mb-4 flex items-start justify-between border-b border-border/60 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand">
              <Sparkles className="h-3 w-3" />
              Creator Studio
            </div>
            <h2
              id="upload-options-title"
              className="mt-1.5 text-lg font-bold text-foreground sm:text-xl"
            >
              Upload Options
            </h2>
            <p className="text-xs text-muted-foreground">
              Select content format to begin publishing
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-95"
            aria-label="Close upload options"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 5 Upload Options List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {UPLOAD_OPTIONS_LIST.map((opt) => {
            const Icon = opt.icon;
            return (
              <Link
                key={opt.id}
                to="/upload"
                search={{ type: opt.id }}
                onClick={onClose}
                className={`group flex items-center justify-between rounded-2xl border p-3 text-left transition-all active:scale-[0.99] ${opt.accentClass}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${opt.iconBgClass} transition group-hover:scale-105`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground group-hover:text-brand transition-colors truncate">
                        {opt.title}
                      </span>
                      <span className="shrink-0 rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {opt.subtitle} · {opt.description}
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand ml-2" />
              </Link>
            );
          })}
        </div>

        {/* Direct Studio Link Footer */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Want to see the full overview?</span>
          <Link
            to="/upload"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-brand hover:text-white"
          >
            Open Full Studio
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
