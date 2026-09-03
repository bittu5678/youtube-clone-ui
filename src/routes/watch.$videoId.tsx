import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Play,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Bookmark,
  Volume2,
  Maximize2,
  Settings,
} from "lucide-react";

import { Navbar } from "@/components/videohub/Navbar";
import { BottomNav } from "@/components/videohub/BottomNav";
import { VideoCard } from "@/components/videohub/VideoCard";
import { allVideos, findVideo } from "@/data/videos";

export const Route = createFileRoute("/watch/$videoId")({
  loader: ({ params }) => {
    const video = findVideo(params.videoId);
    if (!video) throw notFound();
    return { video };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Video unavailable — FaceTube" }, { name: "robots", content: "noindex" }],
      };
    }
    const { video } = loaderData;
    const title = `${video.title} — FaceTube`;
    return {
      meta: [
        { title },
        { name: "description", content: video.description },
        { property: "og:title", content: title },
        { property: "og:description", content: video.description },
        { property: "og:type", content: "video.other" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: WatchNotFound,
  component: WatchPage,
});

function WatchNotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">This video isn’t available</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed or made private.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

function WatchPage() {
  const { video } = Route.useLoaderData();
  const [subscribed, setSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const related = allVideos.filter((v) => v.id !== video.id).slice(0, 8);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar onToggleSidebar={() => {}} />

      <main className="mx-auto grid max-w-[1600px] gap-8 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-10">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-2xl bg-black shadow-lift">
            <img
              src={video.thumb}
              alt={video.title}
              width={1280}
              height={720}
              className="aspect-video w-full object-cover opacity-55"
            />
            <button
              type="button"
              aria-label="Play video"
              className="absolute inset-0 grid place-items-center"
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-brand text-brand-foreground shadow-lift transition hover:scale-105">
                <Play className="h-9 w-9 translate-x-[2px] fill-current" />
              </span>
            </button>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-1/3 rounded-full bg-brand" />
              </div>
              <div className="mt-2 flex items-center gap-3 text-white/90">
                <Play className="h-4 w-4 fill-current" />
                <Volume2 className="h-4 w-4" />
                <span className="text-xs tabular-nums">08:12 / {video.duration}</span>
                <span className="ml-auto flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  <Maximize2 className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>

          <h1 className="mt-4 text-xl font-extrabold leading-snug tracking-tight sm:text-2xl">
            {video.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: video.tint }}
            >
              {video.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{video.channel}</p>
              <p className="truncate text-xs text-muted-foreground">1.2M subscribers</p>
            </div>
            <button
              type="button"
              onClick={() => setSubscribed((v) => !v)}
              className={`ml-1 rounded-full px-5 py-2 text-sm font-semibold transition ${
                subscribed
                  ? "bg-secondary text-foreground hover:bg-muted"
                  : "bg-brand text-brand-foreground shadow-lift hover:bg-brand-dark"
              }`}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-full bg-secondary">
                <button
                  type="button"
                  onClick={() => setLiked((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition hover:bg-muted ${
                    liked ? "text-brand" : "text-foreground"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {liked ? "24K" : "23K"}
                </button>
                <span className="h-6 w-px bg-border" />
                <button
                  type="button"
                  aria-label="Dislike"
                  className="px-4 py-2 text-foreground transition hover:bg-muted"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
              {[
                { icon: Share2, label: "Share" },
                { icon: Download, label: "Download" },
                { icon: Bookmark, label: "Save" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-secondary/70 p-4">
            <p className="text-sm font-semibold">
              {video.views} · {video.age} · <span className="text-brand">#{video.category}</span>
            </p>
            <p
              className={`mt-2 text-sm leading-relaxed text-foreground/85 ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              {video.description} Chapters, resources and the full project source are linked below.
              Thanks for watching — leave a comment with what you want covered next on{" "}
              {video.channel}.
            </p>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          </div>

          <section className="mt-8">
            <h2 className="text-base font-bold">1,284 Comments</h2>
            <div className="mt-4 space-y-5">
              {[
                {
                  n: "Aria Kapoor",
                  i: "AK",
                  t: "The pacing on this is perfect. Bookmarked the whole middle section.",
                },
                {
                  n: "Marcus Bell",
                  i: "MB",
                  t: "Been waiting for this one. The part at 08:12 finally made it click for me.",
                },
              ].map((c) => (
                <div key={c.n} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-brand-foreground">
                    {c.i}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {c.n} <span className="font-normal text-muted-foreground">· 2 days ago</span>
                    </p>
                    <p className="text-sm text-foreground/85">{c.t}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <h2 className="mb-4 text-base font-bold">Related videos</h2>
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-1">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </aside>
      </main>

      <BottomNav />
    </div>
  );
}
