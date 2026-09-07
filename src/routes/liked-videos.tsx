import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ThumbsUp, Play, Shuffle, Trash2, Heart, Lock } from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { allVideos, type Video } from "@/data/videos";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/liked-videos")({
  head: () => ({
    meta: [
      { title: "Liked Videos — FaceTube" },
      {
        name: "description",
        content: "All the videos you’ve liked on FaceTube in one playlist.",
      },
    ],
  }),
  component: LikedVideosPage,
});

function LikedVideosPage() {
  const { profile, user } = useAuth();
  const [likedList, setLikedList] = useState<Video[]>(allVideos.slice(2, 9));

  const handleUnlike = (id: string) => {
    setLikedList((prev) => prev.filter((v) => v.id !== id));
  };

  const username = profile?.username || user?.email?.split("@")[0] || "You";

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-8 items-start">
          {/* Left Playlist Banner */}
          <div className="sticky top-20 rounded-3xl border border-border bg-gradient-to-b from-card to-background p-6 shadow-card space-y-6">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-brand via-brand-dark to-black shadow-md flex items-center justify-center">
              {likedList[0] ? (
                <>
                  <img
                    src={likedList[0].thumb}
                    alt="Liked preview"
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                  />
                  <div className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-brand text-white shadow-lift">
                    <ThumbsUp className="h-8 w-8" />
                  </div>
                </>
              ) : (
                <ThumbsUp className="h-12 w-12 text-white/50" />
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Lock className="h-3 w-3" />
                Private Playlist
              </div>
              <h1 className="mt-1 text-2xl font-extrabold text-foreground">
                Liked Videos
              </h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {username} · {likedList.length} videos · Saved to your favorites
              </p>
            </div>

            {likedList.length > 0 && (
              <div className="flex items-center gap-3">
                <Link
                  to="/watch/$videoId"
                  params={{ videoId: likedList[0].id }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Play All
                </Link>
                <button
                  type="button"
                  onClick={() => setLikedList([...likedList].reverse())}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary"
                >
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </button>
              </div>
            )}
          </div>

          {/* Right: Liked Videos Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm font-bold text-foreground">Favorites list</span>
              <span className="text-xs text-muted-foreground">{likedList.length} items</span>
            </div>

            {likedList.length === 0 ? (
              <div className="py-16 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground mx-auto mb-3">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">No liked videos yet</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the thumbs up button on any video to add it to this collection.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Browse Videos
                </Link>
              </div>
            ) : (
              likedList.map((video, idx) => (
                <div
                  key={`liked-${video.id}`}
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
                    onClick={() => handleUnlike(video.id)}
                    title="Remove from liked videos"
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
