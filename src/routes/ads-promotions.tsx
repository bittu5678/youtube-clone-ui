import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  Megaphone,
  UploadCloud,
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  Users,
  ShieldCheck,
  Play,
  Pause,
  Eye,
  MousePointerClick,
  ExternalLink,
  ArrowRight,
  FileVideo,
  Info,
  Check,
  Layers,
  Flame,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/ads-promotions")({
  head: () => ({
    meta: [
      { title: "Ads Promotions — FaceTube Video Hub" },
      {
        name: "description",
        content:
          "Launch and manage targeted advertisement video campaigns on FaceTube with instant 10% direct referrer commission.",
      },
    ],
  }),
  component: AdsPromotionsPage,
});

interface AdPlan {
  id: string;
  name: string;
  durationLabel: string;
  days: number;
  price: number;
  dailyRate: string;
  impressions: string;
  features: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
}

const AD_PLANS: AdPlan[] = [
  {
    id: "plan-7-days",
    name: "7-Day Sprint",
    durationLabel: "7 Days",
    days: 7,
    price: 100,
    dailyRate: "₹14.28/day",
    impressions: "15,000+ views",
    features: [
      "Standard video feed placement",
      "Suggested video cards boost",
      "Real-time impressions & CTR analytics",
      "Direct Referrer earns ₹10 (10%)",
    ],
  },
  {
    id: "plan-15-days",
    name: "15-Day Booster",
    durationLabel: "15 Days",
    days: 15,
    price: 200,
    dailyRate: "₹13.33/day",
    impressions: "45,000+ views",
    features: [
      "Mid-roll stream placement",
      "Sidebar sticky recommendation",
      "Audience demographic targeting",
      "Direct Referrer earns ₹20 (10%)",
    ],
  },
  {
    id: "plan-monthly",
    name: "Monthly Pro",
    durationLabel: "Monthly (30 Days)",
    days: 30,
    price: 300,
    dailyRate: "₹10.00/day",
    impressions: "120,000+ views",
    features: [
      "Home feed hero showcase",
      "Top search result priority badge",
      "Priority 24/7 video rotation",
      "Direct Referrer earns ₹30 (10%)",
    ],
    isPopular: true,
  },
  {
    id: "plan-yearly",
    name: "Yearly Enterprise",
    durationLabel: "Yearly (365 Days)",
    days: 365,
    price: 3000,
    dailyRate: "₹8.21/day",
    impressions: "1,800,000+ views",
    features: [
      "365 Days Non-Stop Global Reach",
      "Verified Brand Partner spotlight",
      "Dedicated account manager support",
      "Direct Referrer earns ₹300 (10%)",
    ],
    isBestValue: true,
  },
];

interface ActiveCampaign {
  id: string;
  title: string;
  videoUrl: string;
  destinationUrl: string;
  category: string;
  planName: string;
  durationLabel: string;
  price: number;
  referrerCommission: number;
  startDate: string;
  expiryDate: string;
  status: "Active" | "In Review" | "Paused" | "Expired";
  impressions: number;
  clicks: number;
  ctr: string;
}

const INITIAL_CAMPAIGNS: ActiveCampaign[] = [
  {
    id: "camp-001",
    title: "FaceTube Creator Studio Pro Launch Promo",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    destinationUrl: "https://facetube.app/studio",
    category: "Technology",
    planName: "15-Day Booster",
    durationLabel: "15 Days",
    price: 200,
    referrerCommission: 20,
    startDate: "2026-09-15",
    expiryDate: "2026-09-30",
    status: "Active",
    impressions: 28410,
    clicks: 1140,
    ctr: "4.01%",
  },
  {
    id: "camp-002",
    title: "CyberShield Security Software Deal 50% Off",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    destinationUrl: "https://cybershield.security/offer",
    category: "Software",
    planName: "Monthly Pro",
    durationLabel: "Monthly (30 Days)",
    price: 300,
    referrerCommission: 30,
    startDate: "2026-09-02",
    expiryDate: "2026-10-02",
    status: "Active",
    impressions: 89340,
    clicks: 3420,
    ctr: "3.83%",
  },
];

function AdsPromotionsPage() {
  const { user, profile, dbUser } = useAuth();

  const userName =
    profile?.full_name ||
    profile?.name ||
    dbUser?.name ||
    user?.user_metadata?.name ||
    "Alex Rivera";

  const sponsorId = "FT810492"; // Direct sponsor ID
  const sponsorName = "Samantha Chen";

  // Selected Plan State
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-monthly");
  const selectedPlan = AD_PLANS.find((p) => p.id === selectedPlanId) || AD_PLANS[2];

  // Ad Video Upload State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
  );
  const [campaignTitle, setCampaignTitle] = useState<string>("NextGen AI Video Creation Engine");
  const [destinationUrl, setDestinationUrl] = useState<string>("https://mybrand.com/promo");
  const [category, setCategory] = useState<string>("Technology & Gadgets");
  const [ctaText, setCtaText] = useState<string>("Learn More");
  const [isUploading, setIsUploading] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "upi" | "card">("wallet");
  const [isActivating, setIsActivating] = useState(false);

  // Active Promotions State (Stored in localStorage)
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>(() => {
    try {
      const saved = localStorage.getItem("facetube_ad_promotions_v1");
      if (saved) return JSON.parse(saved);
    } catch (_e) {
      // fallback
    }
    return INITIAL_CAMPAIGNS;
  });

  useEffect(() => {
    localStorage.setItem("facetube_ad_promotions_v1", JSON.stringify(campaigns));
  }, [campaigns]);

  // Video File Upload Handler
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a valid video file (MP4, WebM, MOV).");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast.error("Video file size cannot exceed 150MB.");
      return;
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);
    if (!campaignTitle || campaignTitle === "NextGen AI Video Creation Engine") {
      setCampaignTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    toast.success(`Video "${file.name}" loaded successfully for ad promotion!`);
  };

  // Calculate Expiry Date Helper
  const calculateExpiryDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  // Activate Promotion Submission
  const handleActivatePromotion = () => {
    if (!campaignTitle.trim()) {
      toast.error("Please enter an Advertisement Campaign Title.");
      return;
    }

    setIsActivating(true);

    setTimeout(() => {
      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      const expiryDate = calculateExpiryDate(selectedPlan.days);
      const commission = Math.round(selectedPlan.price * 0.1);

      const newCampaign: ActiveCampaign = {
        id: `camp-${Date.now().toString().slice(-4)}`,
        title: campaignTitle,
        videoUrl: videoPreviewUrl,
        destinationUrl: destinationUrl || "https://facetube.app",
        category,
        planName: selectedPlan.name,
        durationLabel: selectedPlan.durationLabel,
        price: selectedPlan.price,
        referrerCommission: commission,
        startDate,
        expiryDate,
        status: "Active",
        impressions: 120,
        clicks: 8,
        ctr: "6.67%",
      };

      setCampaigns((prev) => [newCampaign, ...prev]);
      setIsActivating(false);

      toast.success(`🎉 Promotion Activated Successfully for ₹${selectedPlan.price}!`, {
        description: `Direct Referrer (${sponsorName} - ${sponsorId}) received ₹${commission} (10%) instant commission. Active until ${expiryDate}.`,
        duration: 7000,
      });

      // Scroll smoothly to the active status section
      const statusSection = document.getElementById("active-promotions-section");
      if (statusSection) {
        statusSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 1200);
  };

  // Toggle Campaign status
  const handleToggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "Active" ? "Paused" : "Active";
          toast.info(`Campaign status updated to ${nextStatus}.`);
          return { ...c, status: nextStatus };
        }
        return c;
      }),
    );
  };

  // Calculate remaining days for an expiry date
  const getRemainingDays = (expiryStr: string) => {
    const expiry = new Date(expiryStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand border border-brand/20">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  📢 Ads Promotions
                </h1>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  Live Network
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Boost your video advertisements across FaceTube creator streams with transparent
                pricing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border bg-card px-4 py-2 text-right">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                Active Promotions
              </div>
              <div className="text-lg font-black text-foreground">
                {campaigns.filter((c) => c.status === "Active").length} Running
              </div>
            </div>
          </div>
        </div>

        {/* 10% Direct Referrer Commission Banner (Prominent Callout) */}
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-foreground sm:text-xl">
                    🤝 Direct Referrer receives 10% one-time commission
                  </h2>
                  <span className="rounded-full bg-amber-400 text-black px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                    Instant Credit
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Every time any user or creator launches an advertisement plan on FaceTube, their
                  direct sponsor / referrer is instantly rewarded with a 10% cash commission
                  credited to their withdrawal balance.
                </p>
              </div>
            </div>

            {/* Quick Commission Formula Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto shrink-0">
              <div className="rounded-xl border border-amber-500/30 bg-black/40 px-3 py-2 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  7 Days (₹100)
                </span>
                <p className="text-sm font-black text-amber-300">₹10 (10%)</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-black/40 px-3 py-2 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  15 Days (₹200)
                </span>
                <p className="text-sm font-black text-amber-300">₹20 (10%)</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-black/40 px-3 py-2 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Monthly (₹300)
                </span>
                <p className="text-sm font-black text-amber-300">₹30 (10%)</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-black/40 px-3 py-2 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Yearly (₹3000)
                </span>
                <p className="text-sm font-black text-amber-300">₹300 (10%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Advertisement Video Upload & Details */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <FileVideo className="h-5 w-5 text-brand" />
                Advertisement Video Upload
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload your creative video ad, title, landing page, and category
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Video Dropzone & Live Player */}
            <div className="lg:col-span-6 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Video Asset (MP4 / WebM / MOV)
              </label>

              {/* Upload Drop Area */}
              <div className="relative rounded-2xl border-2 border-dashed border-border hover:border-brand/60 bg-secondary/20 p-6 text-center transition-all group">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Upload Advertisement Video"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {videoFile ? videoFile.name : "Drag & drop video here, or browse files"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended resolution: 1080p · Max size: 150MB · Duration: 15s to 90s
                  </p>
                </div>
              </div>

              {/* Video Player Preview */}
              {videoPreviewUrl && (
                <div className="rounded-2xl border border-border overflow-hidden bg-black relative shadow-lg">
                  <div className="aspect-video w-full bg-black">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full h-full object-contain"
                      playsInline
                    />
                  </div>
                  <div className="p-3 bg-secondary/50 border-t border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-foreground">Ad Preview Ready</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      Target: {destinationUrl || "Default Link"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Campaign Meta Form */}
            <div className="lg:col-span-6 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Campaign Configuration
              </label>

              {/* Campaign Title */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. 50% Off Smart Cloud Hosting Promo"
                  className="w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none transition"
                />
              </div>

              {/* Destination URL */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Destination / Landing Page URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://yourwebsite.com/offer"
                    className="w-full rounded-xl border border-border bg-secondary/40 pl-3.5 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none transition"
                  />
                  <ExternalLink className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Audience Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none transition"
                  >
                    <option value="Technology & Gadgets">Technology &amp; Gadgets</option>
                    <option value="Software & Apps">Software &amp; Apps</option>
                    <option value="Gaming & Esports">Gaming &amp; Esports</option>
                    <option value="Finance & Crypto">Finance &amp; Crypto</option>
                    <option value="Education & Courses">Education &amp; Courses</option>
                    <option value="Lifestyle & Fashion">Lifestyle &amp; Fashion</option>
                    <option value="Health & Fitness">Health &amp; Fitness</option>
                  </select>
                </div>

                {/* CTA Button Text */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Button Action (CTA)
                  </label>
                  <select
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none transition"
                  >
                    <option value="Learn More">Learn More</option>
                    <option value="Shop Now">Shop Now</option>
                    <option value="Sign Up Free">Sign Up Free</option>
                    <option value="Get Offer">Get Offer</option>
                    <option value="Watch Video">Watch Video</option>
                    <option value="Install App">Install App</option>
                  </select>
                </div>
              </div>

              {/* Sponsor Attribution Notice */}
              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-muted-foreground">
                    Direct Sponsor: <strong className="text-foreground">{sponsorName}</strong> (
                    {sponsorId})
                  </span>
                </div>
                <span className="font-bold text-amber-400">10% One-Time Commission</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Plan Cards (Explicitly: 7 Days - ₹100, 15 Days - ₹200, Monthly - ₹300, Yearly - ₹3000) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand" />
                Select Advertisement Promotion Plan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose the best promotion duration for your marketing campaign
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Step 2 of 3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AD_PLANS.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              const commissionAmount = Math.round(plan.price * 0.1);

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative rounded-2xl border transition-all cursor-pointer flex flex-col justify-between p-5 ${
                    isSelected
                      ? "border-brand bg-brand/5 shadow-lg shadow-brand/10 ring-2 ring-brand/30"
                      : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
                  }`}
                >
                  {/* Top Badges */}
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Most Popular
                    </div>
                  )}
                  {plan.isBestValue && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-md flex items-center gap-1">
                      <Award className="w-3 h-3" /> Best Value (Save ₹600)
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-base font-extrabold text-foreground">{plan.name}</h3>
                        <span className="text-xs text-muted-foreground font-semibold">
                          {plan.durationLabel}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "border-brand bg-brand text-white"
                            : "border-muted-foreground/40 bg-secondary"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Price in ₹ */}
                    <div className="my-3 pb-3 border-b border-border/80">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tight text-foreground">
                          ₹{plan.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-muted-foreground">/{plan.durationLabel}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                        <span>{plan.dailyRate}</span>
                        <span className="text-emerald-400 font-bold">{plan.impressions}</span>
                      </div>
                    </div>

                    {/* 10% Commission Callout Tag */}
                    <div className="mb-4 rounded-lg bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-semibold">Direct Referrer</span>
                      <span className="font-extrabold text-amber-300">
                        ₹{commissionAmount} (10%)
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2 text-xs text-zinc-300 mb-5">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Select Plan Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanId(plan.id);
                    }}
                    className={`w-full rounded-xl py-2.5 px-4 text-xs font-extrabold transition-all ${
                      isSelected
                        ? "bg-brand text-white shadow-md hover:bg-brand-dark"
                        : "border border-border bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {isSelected ? "Selected Plan ✓" : "Select Plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Payment Summary & Confirmation */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Payment Summary &amp; Instant Activation
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review your promotion package breakdown and complete campaign activation
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Step 3 of 3</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Order Breakdown Table */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm pb-2 border-b border-border">
                  <span className="text-muted-foreground font-medium">Selected Plan</span>
                  <span className="font-extrabold text-foreground">{selectedPlan.name}</span>
                </div>

                <div className="flex items-center justify-between text-sm pb-2 border-b border-border">
                  <span className="text-muted-foreground font-medium">Duration</span>
                  <span className="font-bold text-foreground">{selectedPlan.durationLabel}</span>
                </div>

                <div className="flex items-center justify-between text-sm pb-2 border-b border-border">
                  <span className="text-muted-foreground font-medium">Plan Base Amount</span>
                  <span className="font-bold text-foreground">
                    ₹{selectedPlan.price.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm pb-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-medium">
                      Direct Referrer 10% Commission
                    </span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                      Credited
                    </span>
                  </div>
                  <span className="font-bold text-amber-400">
                    ₹{Math.round(selectedPlan.price * 0.1).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm pb-2 border-b border-border">
                  <span className="text-muted-foreground font-medium">
                    Network Listing &amp; GST
                  </span>
                  <span className="font-bold text-emerald-400">₹0 (Included / Free)</span>
                </div>

                <div className="flex items-center justify-between text-base pt-1">
                  <span className="font-extrabold text-foreground">Total Payable Amount</span>
                  <span className="text-2xl font-black text-brand">
                    ₹{selectedPlan.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("wallet")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      paymentMethod === "wallet"
                        ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand"
                        : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">FaceTube Wallet</div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      Bal: ₹5,240.00
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      paymentMethod === "upi"
                        ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand"
                        : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">UPI QR / Apps</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      GPay / PhonePe / Paytm
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      paymentMethod === "card"
                        ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand"
                        : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">Cards / NetBanking</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Instant Gateway</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Confirmation CTA & Commission Guarantee */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 rounded-xl border border-border bg-secondary/15 p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Promotion Launch Guarantee
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your advertisement video will enter the FaceTube high-priority rotation
                  immediately. Estimated delivery commences within 5 minutes of activation.
                </p>

                <div className="rounded-lg bg-black/40 border border-border p-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-zinc-300">
                    <span>Campaign Name:</span>
                    <span className="font-semibold text-white truncate max-w-[170px]">
                      {campaignTitle}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Target Expiry:</span>
                    <span className="font-semibold text-emerald-400">
                      {calculateExpiryDate(selectedPlan.days)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Direct Sponsor Credit:</span>
                    <span className="font-semibold text-amber-300">
                      ₹{Math.round(selectedPlan.price * 0.1)} (10%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Activate Button */}
              <button
                type="button"
                id="btn-activate-promotion"
                onClick={handleActivatePromotion}
                disabled={isActivating}
                className="w-full rounded-xl bg-brand py-3.5 px-6 text-sm font-extrabold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Activating Campaign &amp; Crediting Referrer...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Promotion Now (₹{selectedPlan.price})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Active Promotion Status & Expiry Date */}
        <div
          id="active-promotions-section"
          className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-5 shadow-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand" />
                Active Promotion Status &amp; Expiry Dates
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time performance tracking, impression counters, and expiry schedules
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {campaigns.length} Total Campaigns
            </span>
          </div>

          {/* Campaigns Table / Cards */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Campaign Title</th>
                  <th className="py-3 px-4">Plan &amp; Price</th>
                  <th className="py-3 px-4">Active Status</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Performance</th>
                  <th className="py-3 px-4">Referrer (10%)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((camp) => {
                  const remainingDays = getRemainingDays(camp.expiryDate);
                  const isExpired = remainingDays === 0;

                  return (
                    <tr key={camp.id} className="hover:bg-secondary/30 transition-colors">
                      {/* Campaign Title & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground max-w-[220px] truncate">
                          {camp.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="rounded bg-secondary px-1.5 py-0.5 font-medium">
                            {camp.category}
                          </span>
                          <span className="font-mono text-zinc-500">ID: {camp.id}</span>
                        </div>
                      </td>

                      {/* Plan & Price */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div>{camp.planName}</div>
                        <div className="text-brand font-bold">₹{camp.price}</div>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            camp.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : camp.status === "Paused"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              camp.status === "Active"
                                ? "bg-emerald-400 animate-pulse"
                                : "bg-zinc-400"
                            }`}
                          />
                          {camp.status}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">
                        {camp.startDate}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{camp.expiryDate}</div>
                        <div
                          className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${
                            isExpired ? "text-rose-400" : "text-amber-400"
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {isExpired ? "Expired" : `${remainingDays} days remaining`}
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-foreground font-semibold">
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            {camp.impressions.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            {camp.clicks} ({camp.ctr})
                          </span>
                        </div>
                      </td>

                      {/* Referrer 10% */}
                      <td className="py-3.5 px-4">
                        <span className="rounded bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                          ₹{camp.referrerCommission} Paid
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(camp.id)}
                            className="rounded-lg border border-border bg-secondary/80 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                            title={camp.status === "Active" ? "Pause Campaign" : "Resume Campaign"}
                          >
                            {camp.status === "Active" ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <a
                            href={camp.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-border bg-secondary/80 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                            title="Visit Destination"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
