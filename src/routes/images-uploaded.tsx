import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Image as ImageIcon,
  Plus,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/images-uploaded")({
  head: () => ({
    meta: [
      { title: "Images Uploaded — Your Videos — FaceTube" },
      {
        name: "description",
        content:
          "Manage your uploaded image assets, custom video thumbnails, channel banners, and community posts on FaceTube.",
      },
    ],
  }),
  component: ImagesUploadedPage,
});

const mockImages = [
  {
    id: "img-1",
    title: "React Masterclass 4K Thumbnail",
    type: "Thumbnail (16:9)",
    size: "1.4 MB",
    uploaded: "Sep 18, 2026",
    url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "img-2",
    title: "Cyberpunk Night City Cover Art",
    type: "Thumbnail (16:9)",
    size: "2.1 MB",
    uploaded: "Sep 16, 2026",
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "img-3",
    title: "FaceTube Channel Banner 2026",
    type: "Channel Banner",
    size: "3.8 MB",
    uploaded: "Sep 12, 2026",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "img-4",
    title: "Studio Microphone Promo Graphic",
    type: "Community Post",
    size: "890 KB",
    uploaded: "Sep 09, 2026",
    url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "img-5",
    title: "Podcast Guest Announcement",
    type: "Community Post",
    size: "1.1 MB",
    uploaded: "Sep 05, 2026",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "img-6",
    title: "Diamond Creator Milestone Badge",
    type: "Sticker / Icon",
    size: "320 KB",
    uploaded: "Aug 29, 2026",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
  },
];

function ImagesUploadedPage() {
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
                Media library for custom video thumbnails, community photo posts, and channel brand
                assets
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Upload New Image
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Images Uploaded</span>
            <p className="text-2xl font-black text-teal-400">32</p>
            <p className="text-[11px] text-muted-foreground">Thumbnails & graphics</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Storage Used</span>
            <p className="text-2xl font-black text-foreground">84.2 MB</p>
            <p className="text-[11px] text-muted-foreground">Of 10 GB cloud quota</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Thumbnails Applied</span>
            <p className="text-2xl font-black text-foreground">22 Videos</p>
            <p className="text-[11px] text-emerald-400 font-semibold">100% active coverage</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Asset CDN</span>
            <p className="text-2xl font-black text-emerald-400">Active</p>
            <p className="text-[11px] text-muted-foreground">Edge cached globally</p>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {mockImages.map((img) => (
            <div
              key={img.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                <img
                  src={img.url}
                  alt={img.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 py-0.5 text-[9px] font-mono text-white">
                  {img.size}
                </span>
              </div>
              <div className="p-3 space-y-1">
                <h4 className="truncate text-xs font-bold text-foreground leading-snug group-hover:text-brand transition-colors">
                  {img.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">{img.type}</span>
                  <span>{img.uploaded.split(",")[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VideoHubLayout>
  );
}
