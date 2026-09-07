import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clapperboard, Bell, Radio, Check, Users } from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { VideoCard } from "@/components/videohub/VideoCard";
import { creators, allVideos } from "@/data/videos";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions — FaceTube" },
      {
        name: "description",
        content: "Catch the latest uploads and live streams from channels you subscribe to on FaceTube.",
      },
    ],
  }),
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Today" | "Live" | "Continue">("All");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  const filteredVideos = allVideos.filter((v) => {
    if (selectedCreator) {
      return v.channel === selectedCreator;
    }
    return true;
  });

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Clapperboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Subscriptions
              </h1>
              <p className="text-sm text-muted-foreground">
                Latest videos from your subscribed channels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
            >
              <Users className="h-3.5 w-3.5" />
              Manage ({creators.length})
            </button>
            <Link
              to="/live"
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-500/20"
            >
              <Radio className="h-3.5 w-3.5" />
              Live Now
            </Link>
          </div>
        </div>

        {/* Channels Stories / Avatars Bar */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setSelectedCreator(null)}
            className={`flex flex-col items-center gap-1.5 shrink-0 transition ${
              selectedCreator === null ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`}
          >
            <div
              className={`grid h-14 w-14 place-items-center rounded-full border-2 transition ${
                selectedCreator === null
                  ? "border-brand bg-brand text-white shadow-md"
                  : "border-border bg-secondary text-foreground"
              }`}
            >
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-foreground max-w-[64px] truncate">
              All
            </span>
          </button>

          {creators.map((c, i) => {
            const isSelected = selectedCreator === c.name;
            const isLive = i === 1; // demo live badge for 1 channel
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedCreator(isSelected ? null : c.name)}
                className={`relative flex flex-col items-center gap-1.5 shrink-0 group transition ${
                  isSelected ? "opacity-100 scale-105" : "opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`relative grid h-14 w-14 place-items-center rounded-full font-bold text-sm text-white shadow-sm transition-all ${
                    isSelected
                      ? "ring-4 ring-brand bg-gradient-to-br from-brand to-brand-dark"
                      : isLive
                        ? "ring-2 ring-red-500 bg-gradient-to-br from-red-600 to-amber-600"
                        : "ring-2 ring-border bg-gradient-to-br from-neutral-800 to-neutral-700 group-hover:ring-brand/50"
                  }`}
                >
                  {c.initials}
                  {isLive && (
                    <span className="absolute -bottom-1 rounded-full bg-red-600 px-1.5 py-0.2 text-[8px] font-black uppercase text-white tracking-widest ring-2 ring-background">
                      LIVE
                    </span>
                  )}
                  {!isLive && i % 2 === 0 && (
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-background" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-foreground max-w-[64px] truncate">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 border-b border-border/70 pb-3">
          {(["All", "Today", "Live", "Continue"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                selectedFilter === filter
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Subscribed Feed Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              {selectedCreator ? `Uploads from ${selectedCreator}` : "Recent Uploads"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredVideos.length} videos available
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((v) => (
              <VideoCard key={`sub-video-${v.id}`} video={v} />
            ))}
          </div>
        </section>
      </div>
    </VideoHubLayout>
  );
}
