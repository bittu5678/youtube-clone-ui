import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Plus, Play, Calendar, Users, MessageSquare, DollarSign, Tv } from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/live-videos")({
  head: () => ({
    meta: [
      { title: "Live Videos — Your Videos — FaceTube" },
      {
        name: "description",
        content:
          "Manage FaceTube live broadcasts, scheduled streams, RTMP stream keys, and live chat donations.",
      },
    ],
  }),
  component: LiveVideosPage,
});

const mockStreams = [
  {
    id: "live-1",
    title: "Building Real-Time Full-Stack Apps with React & Node",
    status: "Upcoming",
    scheduledFor: "Tomorrow, 6:00 PM EST",
    registrations: 420,
    thumbnail:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "live-2",
    title: "FaceTube Live Q&A & Code Reviews Session #14",
    status: "Archived",
    scheduledFor: "Sep 15, 2026",
    duration: "1h 45m",
    views: "14,200",
    superchats: "$245.00",
    thumbnail:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "live-3",
    title: "React Server Components Deep Dive & Live Coding",
    status: "Archived",
    scheduledFor: "Sep 08, 2026",
    duration: "2h 10m",
    views: "22,800",
    superchats: "$410.00",
    thumbnail:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80",
  },
];

function LiveVideosPage() {
  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Live Videos
              </h1>
              <p className="text-sm text-muted-foreground">
                Live stream control room, RTMP keys, upcoming schedules, and SuperChat donations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/live"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              <Tv className="h-3.5 w-3.5" />
              Watch Live Feed
            </Link>
            <Link
              to="/live"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
            >
              <Radio className="h-3.5 w-3.5" />
              Go Live Now
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Live Streams</span>
            <p className="text-2xl font-black text-emerald-400">3</p>
            <p className="text-[11px] text-muted-foreground">1 Upcoming, 2 Past</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">SuperChat Earnings</span>
            <p className="text-2xl font-black text-foreground">$655.00</p>
            <p className="text-[11px] text-emerald-400 font-semibold">Live audience tips</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Total Live Viewers</span>
            <p className="text-2xl font-black text-foreground">37.0K</p>
            <p className="text-[11px] text-muted-foreground">Peak concurrent 1,840</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-card">
            <span className="text-xs text-muted-foreground font-medium">Stream Health</span>
            <p className="text-2xl font-black text-emerald-400">Excellent</p>
            <p className="text-[11px] text-muted-foreground">1080p60 RTMP ready</p>
          </div>
        </div>

        {/* Streams List */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Live Broadcasts & Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {mockStreams.map((stream) => (
              <div
                key={stream.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                  <img
                    src={stream.thumbnail}
                    alt={stream.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm flex items-center gap-1 ${
                      stream.status === "Upcoming"
                        ? "bg-amber-500 text-black"
                        : "bg-secondary/90 text-foreground"
                    }`}
                  >
                    <Radio className="h-2.5 w-2.5" /> {stream.status}
                  </span>
                  {stream.duration && (
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white">
                      {stream.duration}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="line-clamp-2 text-xs font-bold text-foreground leading-snug group-hover:text-brand transition-colors">
                    {stream.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                    <span>{stream.scheduledFor}</span>
                    {stream.superchats && (
                      <span className="font-bold text-emerald-400">Tips: {stream.superchats}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
