import { Image as ImageIcon, Eye, Heart, MoreVertical } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { UploadedImage } from "@/lib/image-service";
import { SVG_FALLBACK_THUMBNAIL } from "@/lib/thumbnail-service";

export function ImageCard({ image }: { image: UploadedImage }) {
  const initials = image.creatorName
    ? image.creatorName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FT";

  return (
    <article className="group cursor-pointer transition-transform duration-300 hover:-translate-y-0.5">
      <Link to="/images-uploaded" className="block">
        <div className="relative overflow-hidden rounded-2xl bg-muted shadow-card transition-shadow duration-300 group-hover:shadow-lg">
          <img
            src={image.imageUrl}
            alt={image.title}
            width={1280}
            height={720}
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== SVG_FALLBACK_THUMBNAIL) {
                target.src = SVG_FALLBACK_THUMBNAIL;
              }
            }}
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Image Tag Badge */}
          <span className="absolute bottom-2 right-2 rounded-md bg-teal-600/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-white flex items-center gap-1 shadow-sm">
            <ImageIcon className="h-3 w-3" />
            <span>Image</span>
          </span>

          {/* Top Category Badge */}
          {image.category && (
            <span className="absolute top-2 left-2 rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white">
              {image.category}
            </span>
          )}

          {/* Hover Overlay Icon */}
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center rounded-full bg-teal-600 text-white opacity-0 shadow-lift transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <ImageIcon className="h-5 w-5" />
          </span>
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white shadow-xs">
          {initials}
        </span>
        <div className="min-w-0">
          <Link to="/images-uploaded">
            <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-teal-400">
              {image.title}
            </h3>
          </Link>
          <p className="mt-1 truncate text-sm text-muted-foreground">{image.creatorName}</p>
          <p className="truncate text-sm text-muted-foreground flex items-center gap-1.5">
            <span>{image.fileSize || "1.2 MB"}</span>
            <span>•</span>
            <span className="font-mono uppercase">{image.format}</span>
            <span>•</span>
            <span>Community Post</span>
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
