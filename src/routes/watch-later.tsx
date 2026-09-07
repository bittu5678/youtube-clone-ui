import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Play, Shuffle, Trash2, MoreVertical, Lock } from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { recommended, type Video } from "@/data/videos";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/watch-later")({
  head: () => ({
    meta: [
      { title: "Watch Later — FaceTube" },
      {
        name: "description",
        content: "Your saved videos to watch later on FaceTube.",
      },
    ],
  }),
  component: WatchLaterPage,
});

function WatchLaterPage() {
  const { profile, user } = useAuth();
  const [videos, setVideos] = useState<Video[]>(recommended);

  const handleRemove = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const username = profile?.username || user?.email?.split("@")[0] || "User";

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-8 items-start">
          {/* Left: YouTube-style Playlist Banner Card */}
          <div className="sticky top-20 rounded-3xl border border-border bg-gradient-to-b from-card to-background p-6 shadow-card space-y-6">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted shadow-md group">
              {videos[0] ? (
                <img
                  src={videos[0].thumb}
                  alt="Watch later preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center bg-secondary">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Play className="h-12 w-12 text-white fill-white" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Lock className="h-3 w-3" />
                Private Playlist
              </div>
              <h1 className="mt-1 text-2xl font-extrabold text-foreground">Watch Later</h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {username} · {videos.length} videos · Updated today
              </p>
            </div>

            {videos.length > 0 && (
              <div className="flex items-center gap-3">
                <Link
                  to="/watch/$videoId"
                  params={{ videoId: videos[0].id }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Play All
                </Link>
                <button
                  type="button"
                  onClick={() => setVideos([...videos].reverse())}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary"
                >
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </button>
              </div>
            )}
          </div>

          {/* Right: Videos List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm font-bold text-foreground">Saved queue</span>
              <span className="text-xs text-muted-foreground">{videos.length} items</span>
            </div>

            {videos.length === 0 ? (
              <div className="py-16 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground mx-auto mb-3">
                  <Clock className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">Your Watch Later is empty</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Save videos to watch later while exploring FaceTube.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Explore Videos
                </Link>
              </div>
            ) : (
              videos.map((video, idx) => (
                <div
                  key={`wl-${video.id}`}
                  className="group flex items-center gap-3.5 p-2.5 rounded-2xl border border-transparent hover:border-border hover:bg-card transition"
                >
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </span>

                  <Link
                    to="/watch/$videoId"
                    params={{ videoId: video.id }}
                    className="relative shrink-0 w-36 sm:w-44 aspect-video rounded-xl overflow-hidden bg-black"
                  >
                    <img
                      src={video.thumb}
                      alt={video.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white">
                      {video.duration}
                    </span>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to="/watch/$videoId" params={{ videoId: video.id }}>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-brand transition-colors">
                        {video.title}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      {video.channel} · {video.views}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(video.id)}
                    title="Remove from Watch Later"
                    className="shrink-0 p-2 rounded-full text-muted-foreground opacity-70 group-hover:opacity-100 hover:bg-secondary hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
