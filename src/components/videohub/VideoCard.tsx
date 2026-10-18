import { MoreVertical, Play, Megaphone, Lock, Globe } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Video } from "@/data/videos";
import { resolveVideoThumbnail, SVG_FALLBACK_THUMBNAIL } from "@/lib/thumbnail-service";

export function VideoCard({ video }: { video: Video }) {
  const thumbSrc = resolveVideoThumbnail(video);

  return (
    <article className="group cursor-pointer transition-transform duration-300 hover:-translate-y-0.5">
      <Link to="/watch/$videoId" params={{ videoId: video.id }} className="block">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-card transition-shadow duration-300 group-hover:shadow-lg">
          <img
            src={thumbSrc}
            alt={video.title}
            width={1280}
            height={720}
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== SVG_FALLBACK_THUMBNAIL) {
                target.src = SVG_FALLBACK_THUMBNAIL;
              }
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            {video.isPromoted && (
              <span className="rounded-md bg-emerald-500/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                <Megaphone className="h-2.5 w-2.5" /> Promoted
              </span>
            )}
            {video.videoType === "premium" && (
              <span className="rounded-md bg-amber-500/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-black text-black shadow-sm flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> ₹6 Sponsor
              </span>
            )}
            {video.videoType === "free" &&
              (video.id.startsWith("vid-") || video.id.startsWith("vid_")) && (
                <span className="rounded-md bg-sky-500/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                  <Globe className="h-2.5 w-2.5" /> Free
                </span>
              )}
          </div>

          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white z-10">
            {video.duration || "0:00"}
          </span>
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-lift transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 z-10">
            <Play className="h-5 w-5 translate-x-[1px] fill-current" />
          </span>
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: video.tint }}
        >
          {video.initials}
        </span>
        <div className="min-w-0">
          <Link to="/watch/$videoId" params={{ videoId: video.id }}>
            <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-brand">
              {video.title}
            </h3>
          </Link>
          <p className="mt-1 truncate text-sm text-muted-foreground">{video.channel}</p>
          <p className="truncate text-sm text-muted-foreground">
            {video.views} · {video.age}
          </p>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="h-8 w-8 shrink-0 rounded-full text-muted-foreground opacity-0 transition hover:bg-secondary focus-visible:opacity-100 group-hover:opacity-100"
        >
          <MoreVertical className="mx-auto h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
