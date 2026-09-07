import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Compass,
  Flame,
  Music,
  Gamepad2,
  Newspaper,
  Clapperboard,
  Sparkles,
  Podcast,
  GraduationCap,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { VideoCard } from "@/components/videohub/VideoCard";
import { trending, recommended, creators, allVideos } from "@/data/videos";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — FaceTube" },
      {
        name: "description",
        content: "Discover trending videos, rising creators, music, gaming, and news on FaceTube.",
      },
    ],
  }),
  component: ExplorePage,
});

const exploreCategories = [
  { label: "Trending", icon: Flame, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { label: "Music", icon: Music, color: "text-red-500 bg-red-500/10 border-red-500/20" },
  {
    label: "Gaming",
    icon: Gamepad2,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    label: "Movies & Shows",
    icon: Clapperboard,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    label: "News",
    icon: Newspaper,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    label: "Podcasts",
    icon: Podcast,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    label: "Learning",
    icon: GraduationCap,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  },
];

function ExplorePage() {
  const [selectedTag, setSelectedTag] = useState<string>("Trending");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = allVideos.filter((v) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.channel.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }
    if (selectedTag === "Trending") return true;
    if (selectedTag === "Music") return v.category === "Music";
    if (selectedTag === "Gaming") return v.category === "Gaming";
    if (selectedTag === "Learning")
      return v.category === "Coding" || v.category === "AI" || v.category === "React";
    if (selectedTag === "Podcasts") return v.category === "Podcasts";
    return true;
  });

  return (
    <VideoHubLayout query={searchQuery} onQueryChange={setSearchQuery}>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Explore
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover what's trending across FaceTube right now
            </p>
          </div>
        </div>

        {/* Explore Hub Category Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {exploreCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedTag === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setSelectedTag(cat.label)}
                className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                  isSelected
                    ? "bg-brand text-white border-brand shadow-sm"
                    : `${cat.color} hover:scale-102 hover:shadow-sm`
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isSelected ? "text-white" : ""}`} />
                <span
                  className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-foreground"}`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Trending Spotlight Shelf */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold text-foreground sm:text-xl">Trending Videos</h2>
            </div>
            <span className="text-xs text-muted-foreground">Updated in real-time</span>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trending.map((v) => (
              <VideoCard key={`explore-trending-${v.id}`} video={v} />
            ))}
          </div>
        </section>

        {/* Popular Creators Shelf */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                Featured FaceTube Creators
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {creators.map((c) => (
              <div
                key={c.name}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border bg-background text-center transition hover:border-brand/40"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white shadow-sm mb-2">
                  {c.initials}
                </div>
                <p className="text-xs font-bold text-foreground truncate w-full">{c.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate w-full">{c.subs}</p>
                <span className="mt-2 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                  {c.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Filtered & Discovered Feed */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            {selectedTag === "Trending" ? "Fresh Discoveries" : `${selectedTag} Videos`}
          </h2>

          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((v) => (
              <VideoCard key={`explore-feed-${v.id}`} video={v} />
            ))}
          </div>
        </section>
      </div>
    </VideoHubLayout>
  );
}
