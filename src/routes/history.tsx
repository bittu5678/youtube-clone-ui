import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { History, Trash2, Pause, Play, Search, X, ShieldAlert } from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { allVideos, type Video } from "@/data/videos";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Watch History — FaceTube" },
      {
        name: "description",
        content: "Review your watched videos, resume playback, and manage FaceTube watch history.",
      },
    ],
  }),
  component: HistoryPage,
});

export function HistoryPage() {
  const [historyList, setHistoryList] = useState<Video[]>(allVideos.slice(0, 8));
  const [isPaused, setIsPaused] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const handleRemove = (id: string) => {
    setHistoryList((prev) => prev.filter((v) => v.id !== id));
  };

  const handleClear = () => {
    if (confirm("Clear your entire FaceTube watch history?")) {
      setHistoryList([]);
    }
  };

  const filtered = historyList.filter(
    (v) =>
      v.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      v.channel.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
          {/* Main List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Watch History
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Videos you’ve recently watched on FaceTube
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-muted-foreground">
                {filtered.length} videos
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground mb-3">
                  <History className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">No watch history found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Videos you watch will appear here so you can easily pick up where you left off.
                </p>
                <Link
                  to="/"
                  className="mt-4 rounded-full bg-brand px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  Browse Home Feed
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((video, idx) => {
                  const progressPct = [85, 45, 100, 20, 60, 90, 30, 75][idx % 8];
                  return (
                    <div
                      key={`hist-${video.id}`}
                      className="group flex flex-col sm:flex-row gap-4 p-3 rounded-2xl border border-border bg-card transition hover:border-brand/40"
                    >
                      {/* Video Thumbnail with Progress Bar */}
                      <Link
                        to="/watch/$videoId"
                        params={{ videoId: video.id }}
                        className="relative shrink-0 w-full sm:w-60 aspect-video rounded-xl overflow-hidden bg-black"
                      >
                        <img
                          src={video.thumb}
                          alt={video.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {video.duration}
                        </span>
                        {/* YouTube style Red Watched Progress Bar */}
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                          <div className="h-full bg-brand" style={{ width: `${progressPct}%` }} />
                        </div>
                      </Link>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <Link to="/watch/$videoId" params={{ videoId: video.id }}>
                              <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-brand transition-colors">
                                {video.title}
                              </h3>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleRemove(video.id)}
                              title="Remove from history"
                              className="p-1 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <p className="text-xs text-muted-foreground mt-1">
                            {video.channel} · {video.views}
                          </p>
                          <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-2">
                            {video.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                          <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-foreground">
                            {progressPct}% watched
                          </span>
                          <span>•</span>
                          <span>Watched recently</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar Controls (YouTube Style History Management) */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                History Controls
              </h2>

              {/* Search History */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search watch history…"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand"
                />
              </div>

              <div className="pt-2 space-y-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/10 text-left"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  Clear all watch history
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-secondary text-left"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 shrink-0 text-brand" />
                      Resume watch history
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 shrink-0" />
                      Pause watch history
                    </>
                  )}
                </button>
              </div>

              {isPaused && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-500 font-medium border border-amber-500/20">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  Watch history is paused. New views won't be saved.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
