import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Radio, Users, Send, Sparkles, Share2, Heart, Search, Video } from "lucide-react";
import { Logo } from "@/components/videohub/Logo";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { BottomNav } from "@/components/videohub/BottomNav";
import { LIVE_STREAMS, type LiveStream } from "@/data/live";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Streams — FaceTube" },
      {
        name: "description",
        content:
          "Watch live streams, gaming tournaments, coding sessions, and global events on FaceTube Live.",
      },
    ],
  }),
  component: LivePage,
});

const LIVE_CATEGORIES = ["All Live", "Coding & Tech", "Gaming", "Music", "Science & Tech"];

function LivePage() {
  const [selectedCategory, setSelectedCategory] = useState("All Live");
  const [activeStream, setActiveStream] = useState<LiveStream>(LIVE_STREAMS[0]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState(activeStream.chatMessages);
  const [liked, setLiked] = useState(false);

  const filteredStreams =
    selectedCategory === "All Live"
      ? LIVE_STREAMS
      : LIVE_STREAMS.filter((s) => s.category === selectedCategory);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        user: "You",
        text: chatInput.trim(),
        color: "text-brand font-bold",
      },
    ]);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-brand selection:text-white pb-24 md:pb-28">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={30} />
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Live
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/upload"
              search={{ type: "long" }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
            >
              <Radio className="h-3.5 w-3.5" />
              Go Live
            </Link>
            <ThemeToggle showLabelsOnWide={false} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 space-y-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {LIVE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition shrink-0 ${
                selectedCategory === cat
                  ? "bg-brand text-white font-semibold shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Live Stream & Live Chat Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Stream Container (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl border border-border">
              <img
                src={activeStream.thumb}
                alt={activeStream.title}
                className="h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Pulsing Live Badge and Viewer Count */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  Live
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  <Users className="h-3.5 w-3.5 text-red-400" />
                  {activeStream.viewers} viewers
                </span>
              </div>

              {/* Category tag on stream */}
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                  {activeStream.category}
                </span>
              </div>

              {/* Stream bottom overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white font-bold text-xs ring-2 ring-white/50">
                    {activeStream.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white drop-shadow-md">
                      {activeStream.streamer}
                    </h3>
                    <p className="text-xs text-white/80">{activeStream.startedTime}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLiked((l) => !l)}
                    className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition active:scale-95 ${
                      liked ? "bg-red-600 text-white" : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                    aria-label="Like stream"
                  >
                    <Heart className={`h-4 w-4 ${liked ? "fill-white" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator
                          .share({ title: activeStream.title, url: window.location.href })
                          .catch(() => {});
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition active:scale-95"
                    aria-label="Share stream"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stream Title & Details */}
            <div className="p-1">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">{activeStream.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {activeStream.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Live Chat Panel (1 col) */}
          <div className="flex flex-col h-[480px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-secondary/30">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Live Chat
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">Top Chat</span>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-xs leading-relaxed flex items-start gap-2">
                  <span className={`font-semibold shrink-0 ${msg.color}`}>{msg.user}:</span>
                  <span className="text-foreground/90 break-words">{msg.text}</span>
                </div>
              ))}
            </div>

            {/* Chat message input */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-border/70 p-3 bg-background/50 flex gap-2"
            >
              <input
                type="text"
                placeholder="Chat as viewer..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-dark active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Other Active Streams Grid */}
        <section className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">More Live Broadcasts</h2>
            <span className="text-xs text-muted-foreground">
              {filteredStreams.length} streaming now
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStreams.map((stream) => (
              <div
                key={stream.id}
                onClick={() => {
                  setActiveStream(stream);
                  setChatMessages(stream.chatMessages);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`group cursor-pointer rounded-2xl border p-2 transition-all hover:shadow-md ${
                  activeStream.id === stream.id
                    ? "border-brand bg-brand/5 ring-2 ring-brand/30"
                    : "border-border bg-card hover:border-brand/40"
                }`}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-2.5">
                  <img
                    src={stream.thumb}
                    alt={stream.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-85"
                  />
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                    Live
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {stream.viewers} viewers
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white font-bold text-xs">
                    {stream.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-brand transition-colors">
                      {stream.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {stream.streamer}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">{stream.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Fixed Bottom Navigation with 5 tabs */}
      <BottomNav />
    </div>
  );
}
