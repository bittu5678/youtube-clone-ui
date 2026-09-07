import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CircleHelp,
  Search,
  DollarSign,
  Video,
  ShieldCheck,
  Zap,
  MessageCircleQuestion,
  ChevronDown,
  Mail,
  ExternalLink,
} from "lucide-react";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support — FaceTube" },
      {
        name: "description",
        content:
          "Get help with video uploads, monetization earnings, live streaming, and account settings on FaceTube.",
      },
    ],
  }),
  component: HelpPage,
});

const helpCategories = [
  {
    title: "Monetization & Ads Earnings",
    description:
      "Learn how the 70% ad revenue share works for premium uploads and creator payouts.",
    icon: DollarSign,
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    title: "Video Uploads & 4K Masters",
    description:
      "Supported formats, high-bitrate encoding, thumbnail recommendations, and Dolby audio.",
    icon: Video,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    title: "Shorts & Vertical Video",
    description:
      "Publishing mobile vertical clips up to 60 seconds with algorithmic feed distribution.",
    icon: Zap,
    color: "text-red-500 bg-red-500/10",
  },
  {
    title: "Community Guidelines & Rights",
    description:
      "Copyright matching, fair use policies, community safety, and channel verification.",
    icon: ShieldCheck,
    color: "text-emerald-500 bg-emerald-500/10",
  },
];

const faqs = [
  {
    q: "How does the FaceTube 70% Ads Revenue Share work?",
    a: "When you upload a Premium Video with Ads Earnings enabled, FaceTube places pre-roll, mid-roll, and sponsor banners on your video. Creators receive 70% of gross revenue generated from viewers in real-time.",
  },
  {
    q: "How do I upload Shorts and standard long-form videos?",
    a: "Tap the center floating '+' button in the bottom navigation bar or click 'Create' in the top navbar. Select either 'Shorts Video Upload' (up to 60s vertical) or 'Long Video Upload' to publish.",
  },
  {
    q: "How do I switch between Light and Dark themes?",
    a: "Click the sun/moon icon in the top navigation bar or go to Settings → Appearance to choose Dark, Light, or automatic System mode.",
  },
  {
    q: "Can I watch live streams and chat with creators?",
    a: "Yes! Tap the 'Live' tab in the bottom navigation bar or visit /live to watch active broadcasts and participate in the real-time live chat room.",
  },
];

function HelpPage() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <VideoHubLayout>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Header with Search */}
        <div className="text-center space-y-3 pt-2">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <CircleHelp className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-foreground sm:text-4xl tracking-tight">
            How can we help you?
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Find answers to common questions about uploads, earnings, and playback on FaceTube
          </p>

          <div className="mx-auto max-w-lg pt-2">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search topics, questions, policies…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>
          </div>
        </div>

        {/* Popular Topic Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {helpCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="group flex items-start gap-4 rounded-3xl border border-border bg-card p-5 transition hover:border-brand/40 hover:shadow-sm cursor-pointer"
              >
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${cat.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <MessageCircleQuestion className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-border">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 text-left transition"
                  >
                    <span className="text-xs sm:text-sm font-bold text-foreground hover:text-brand">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-brand" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed pl-1 pr-4">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support Banner */}
        <div className="rounded-3xl bg-secondary/60 border border-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="text-sm font-bold text-foreground">Still need assistance?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Our 24/7 creator support team is ready to help resolve your questions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/upload"
              className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-lift hover:bg-brand-dark transition"
            >
              Creator Studio
            </Link>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
