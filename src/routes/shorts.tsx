import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Search,
} from "lucide-react";
import { Logo } from "@/components/videohub/Logo";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { BottomNav } from "@/components/videohub/BottomNav";
import { SHORTS_LIST, type ShortItem } from "@/data/shorts";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts — FaceTube" },
      {
        name: "description",
        content:
          "Watch trending short-form vertical videos, tutorials, and moments on FaceTube Shorts.",
      },
    ],
  }),
  component: ShortsPage,
});

function ShortsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [disliked, setDisliked] = useState<Record<string, boolean>>({});
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const activeShort: ShortItem = SHORTS_LIST[currentIndex] || SHORTS_LIST[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SHORTS_LIST.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SHORTS_LIST.length) % SHORTS_LIST.length);
  };

  // Keyboard navigation: ArrowUp, ArrowDown, Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "m") {
        setIsMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleLike = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!liked[id] && disliked[id]) {
      setDisliked((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleDislike = (id: string) => {
    setDisliked((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!disliked[id] && liked[id]) {
      setLiked((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleSubscribe = (handle: string) => {
    setSubscribed((prev) => ({ ...prev, [handle]: !prev[handle] }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-brand selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={30} />
            <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-red-500">
              Shorts
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Search FaceTube"
            >
              <Search className="h-4 w-4" />
            </Link>
            <ThemeToggle showLabelsOnWide={false} />
          </div>
        </div>
      </header>

      {/* Main Shorts Theater */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-4 pb-24 md:pb-28">
        <div className="relative flex flex-col md:flex-row items-center gap-4 max-w-full">
          {/* Vertical Video Reel Card */}
          <div className="relative w-[340px] xs:w-[380px] sm:w-[420px] aspect-[9/16] max-h-[calc(100vh-160px)] rounded-3xl overflow-hidden bg-black shadow-2xl border border-border/70 flex flex-col justify-between">
            {/* Background Thumbnail Image with Gradient Accent */}
            <div className="absolute inset-0 z-0">
              <img
                src={activeShort.thumb}
                alt={activeShort.title}
                className="h-full w-full object-cover opacity-80"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${activeShort.aspectColor} via-black/30 to-black/70`}
              />
            </div>

            {/* Top Bar on Video: Sound, Status, Progress Bar */}
            <div className="relative z-10 flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-red-400" />
                  {currentIndex + 1} of {SHORTS_LIST.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 active:scale-95"
                  aria-label={isMuted ? "Unmute sound" : "Mute sound"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 active:scale-95"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Middle tap area to Play/Pause */}
            <div
              className="relative z-10 flex-1 cursor-pointer flex items-center justify-center"
              onClick={() => setIsPlaying((p) => !p)}
            >
              {!isPlaying && (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-black/70 text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in">
                  <Play className="h-8 w-8 translate-x-0.5 fill-white" />
                </div>
              )}
            </div>

            {/* Bottom Meta & Creator Info */}
            <div className="relative z-10 p-4 pb-5 space-y-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
              {/* Creator Row with Subscribe */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white font-bold text-xs ring-2 ring-white/50">
                    {activeShort.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white drop-shadow-sm">
                      {activeShort.creator}
                    </p>
                    <p className="text-[11px] text-white/80">{activeShort.creatorHandle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSubscribe(activeShort.creatorHandle)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-md active:scale-95 ${
                    subscribed[activeShort.creatorHandle]
                      ? "bg-white/20 text-white backdrop-blur-md"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {subscribed[activeShort.creatorHandle] ? "Subscribed" : "Subscribe"}
                </button>
              </div>

              {/* Title & Caption */}
              <p className="text-sm font-medium text-white line-clamp-2 leading-snug drop-shadow-sm">
                {activeShort.title}
              </p>

              {/* Sound Track Badge */}
              <div className="flex items-center gap-2 text-xs text-white/85">
                <Music2 className="h-3.5 w-3.5 shrink-0 animate-bounce text-red-400" />
                <span className="truncate">{activeShort.soundTrack}</span>
              </div>
            </div>

            {/* Animated Playback Progress Bar */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/25 z-20">
              <div className="h-full bg-red-600 w-2/3 animate-pulse" />
            </div>
          </div>

          {/* Right Action Rail (YouTube Shorts Style) */}
          <div className="flex md:flex-col items-center justify-center gap-3 sm:gap-4 z-20">
            {/* Like */}
            <button
              type="button"
              onClick={() => toggleLike(activeShort.id)}
              className="flex flex-col items-center gap-1 group active:scale-90 transition"
              aria-label="Like this short"
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur-md transition ${
                  liked[activeShort.id]
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "bg-secondary/80 text-foreground hover:bg-secondary"
                }`}
              >
                <ThumbsUp className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">
                {liked[activeShort.id] ? "Liked" : activeShort.likes}
              </span>
            </button>

            {/* Dislike */}
            <button
              type="button"
              onClick={() => toggleDislike(activeShort.id)}
              className="flex flex-col items-center gap-1 group active:scale-90 transition"
              aria-label="Dislike this short"
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur-md transition ${
                  disliked[activeShort.id]
                    ? "bg-foreground text-background"
                    : "bg-secondary/80 text-foreground hover:bg-secondary"
                }`}
              >
                <ThumbsDown className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">Dislike</span>
            </button>

            {/* Comments */}
            <button
              type="button"
              onClick={() => setCommentsOpen((c) => !c)}
              className="flex flex-col items-center gap-1 group active:scale-90 transition"
              aria-label="View comments"
            >
              <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary/80 text-foreground hover:bg-secondary backdrop-blur-md transition">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">
                {activeShort.comments}
              </span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({ title: activeShort.title, url: window.location.href })
                    .catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="flex flex-col items-center gap-1 group active:scale-90 transition"
              aria-label="Share short"
            >
              <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary/80 text-foreground hover:bg-secondary backdrop-blur-md transition">
                <Share2 className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">
                {activeShort.shares}
              </span>
            </button>

            {/* Up / Down Navigation Controls for Desktop */}
            <div className="hidden md:flex flex-col gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={handlePrev}
                className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground hover:bg-brand hover:text-white transition active:scale-95 shadow-sm"
                aria-label="Previous short"
                title="Previous short (Up Arrow)"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground hover:bg-brand hover:text-white transition active:scale-95 shadow-sm"
                aria-label="Next short"
                title="Next short (Down Arrow)"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Navigation with 5 tabs */}
      <BottomNav />
    </div>
  );
}
