import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  RefreshCw,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import { fetchUploadedImages, type UploadedImage } from "@/lib/image-service";
import { SVG_FALLBACK_THUMBNAIL } from "@/lib/thumbnail-service";

export const Route = createFileRoute("/images-uploaded")({
  head: () => ({
    meta: [
      { title: "Images Uploaded — FaceTube Media Library" },
      {
        name: "description",
        content:
          "Manage your uploaded image assets, custom video thumbnails, channel banners, and community photo posts on FaceTube.",
      },
    ],
  }),
  component: ImagesUploadedPage,
});

export function ImagesUploadedPage() {
  const { user, profile, dbUser } = useAuth();
  const userId = profile?.user_id || dbUser?.user_id || user?.email?.split("@")[0] || "FT483921";

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await fetchUploadedImages();
      setImages(data);
    } catch (e) {
      console.error("Failed to load images:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500/10 text-teal-400">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Images Uploaded
              </h1>
              <p className="text-sm text-muted-foreground">
                Media library for custom video thumbnails, channel graphics, and photo posts.
                Displays every 5 videos in feed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadImages}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-brand" : ""}`} />
              Refresh
            </button>
            <Link
              to="/upload"
              search={{ mode: "image" }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-teal-500 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Upload Image
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Images Uploaded</span>
            <p className="text-2xl font-black text-teal-400">{images.length}</p>
            <p className="text-[11px] text-muted-foreground">JPG, PNG, WEBP formats</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Feed Insertion</span>
            <p className="text-2xl font-black text-foreground">1 per 5 Videos</p>
            <p className="text-[11px] text-teal-400 font-semibold">Configurable threshold active</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Supported Formats</span>
            <p className="text-2xl font-black text-foreground">3 Types</p>
            <p className="text-[11px] text-muted-foreground">JPG / JPEG, PNG, WEBP</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Asset Status</span>
            <p className="text-2xl font-black text-emerald-400">Live &amp; Synced</p>
            <p className="text-[11px] text-muted-foreground">Available across stream feeds</p>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift flex flex-col justify-between"
            >
              <div className="relative aspect-[9/16] w-full overflow-hidden bg-secondary">
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== SVG_FALLBACK_THUMBNAIL) {
                      target.src = SVG_FALLBACK_THUMBNAIL;
                    }
                  }}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-white">
                  {img.fileSize}
                </span>
                <span className="absolute top-1.5 left-1.5 rounded bg-teal-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                  {img.format}
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <h4 className="truncate text-xs font-bold text-foreground leading-snug group-hover:text-teal-400 transition-colors">
                  {img.title}
                </h4>
                {img.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {img.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  <span className="font-semibold text-teal-400">{img.category || "Community"}</span>
                  <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VideoHubLayout>
  );
}
