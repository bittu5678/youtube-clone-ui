import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Flame, Sparkles, Clock3, BadgeCheck, Search, SearchX } from "lucide-react";

import { Navbar } from "@/components/videohub/Navbar";
import { Sidebar } from "@/components/videohub/Sidebar";
import { Hero } from "@/components/videohub/Hero";
import { VideoCard } from "@/components/videohub/VideoCard";
import { ShortsShelf } from "@/components/videohub/ShortsShelf";
import { BottomNav } from "@/components/videohub/BottomNav";
import { Footer } from "@/components/videohub/Footer";
import { allVideos, categories, creators, recent, recommended, trending } from "@/data/videos";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "FaceTube — Stream, Discover and Create Video" },
      {
        name: "description",
        content:
          "Browse trending videos, follow popular creators and discover fresh uploads on FaceTube, a modern video streaming experience.",
      },
      { property: "og:title", content: "FaceTube — Stream, Discover and Create Video" },
      {
        property: "og:description",
        content: "Trending videos, popular creators and fresh uploads in one polished feed.",
      },
    ],
  }),
  component: Index,
});

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Flame;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function Index() {
  const searchParams = Route.useSearch();
  const [railOpen, setRailOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState(searchParams.q || "");

  useEffect(() => {
    if (searchParams.q !== undefined) {
      setQuery(searchParams.q);
    }
  }, [searchParams.q]);

  const isFiltering = query.trim().length > 0 || activeCategory !== "All";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    return allVideos.filter((v) => {
      if (seen.has(v.title)) return false;
      const matchesCategory = activeCategory === "All" || v.category === activeCategory;
      const matchesQuery =
        q.length === 0 ||
        v.title.toLowerCase().includes(q) ||
        v.channel.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q);
      if (!matchesCategory || !matchesQuery) return false;
      seen.add(v.title);
      return true;
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar
        onToggleSidebar={() => {
          setRailOpen((v) => !v);
          setDrawerOpen((v) => !v);
        }}
        query={query}
        onQueryChange={setQuery}
      />

      <div className="flex">
        <Sidebar open={railOpen} drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <main className="min-w-0 flex-1 pb-24 lg:pb-10">
          {/* Category chips */}
          <div className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur-md">
            <div className="px-4 pt-3 md:hidden">
              <div className="flex h-10 items-center rounded-full border border-border bg-secondary/60 px-4 focus-within:border-brand/50">
                <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search videos, creators, topics…"
                  className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    activeCategory === c
                      ? "bg-foreground text-background shadow-card"
                      : "bg-secondary text-foreground/75 hover:-translate-y-0.5 hover:bg-brand/10 hover:text-brand"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {isFiltering ? (
              <section>
                <SectionHeading
                  icon={Search}
                  title={
                    query.trim() ? `Results for “${query.trim()}”` : `${activeCategory} videos`
                  }
                  subtitle={`${results.length} ${results.length === 1 ? "video" : "videos"} found${
                    query.trim() && activeCategory !== "All" ? ` in ${activeCategory}` : ""
                  }`}
                />
                {results.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {results.slice(0, 6).map((v) => (
                        <VideoCard key={v.id} video={v} />
                      ))}
                    </div>

                    <ShortsShelf />

                    {results.length > 6 && (
                      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {results.slice(6).map((v) => (
                          <VideoCard key={v.id} video={v} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
                    <SearchX className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 text-base font-semibold">No videos match your filters</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try a different keyword or category.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setActiveCategory("All");
                      }}
                      className="mt-5 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </section>
            ) : (
              <>
                <Hero />

                <section className="mt-12">
                  <SectionHeading
                    icon={Sparkles}
                    title="Recommended for you"
                    subtitle="Picked from channels you watch"
                  />
                  <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {recommended.map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </div>
                </section>

                {/* YouTube-style Horizontal Shorts Carousel Section */}
                <ShortsShelf />

                <section className="mt-14">
                  <SectionHeading
                    icon={Flame}
                    title="Trending now"
                    subtitle="What everyone is watching today"
                  />
                  <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {trending.map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </div>
                </section>

                <section className="mt-14">
                  <SectionHeading
                    icon={BadgeCheck}
                    title="Popular creators"
                    subtitle="Channels growing fast on FaceTube"
                  />
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {creators.map((c) => (
                      <article
                        key={c.name}
                        className="group rounded-2xl border border-border p-5 text-center shadow-card transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
                      >
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-brand-foreground transition-transform group-hover:scale-105">
                          {c.initials}
                        </span>
                        <h3 className="mt-3 truncate text-sm font-semibold text-foreground">
                          {c.name}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">{c.subs}</p>
                        <button className="mt-3 w-full rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-brand hover:text-brand-foreground">
                          Subscribe
                        </button>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="mt-14">
                  <SectionHeading
                    icon={Clock3}
                    title="Recently uploaded"
                    subtitle="Fresh from your subscriptions"
                  />
                  <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {recent.map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </div>
                </section>
              </>
            )}

            <Footer />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
