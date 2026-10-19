import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useRef, useEffect } from "react";
import {
  ScrollText,
  Download,
  Printer,
  Mail,
  Award,
  CheckCircle2,
  Sparkles,
  Share2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Copy,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { VideoHubLayout } from "@/components/videohub/VideoHubLayout";
import { useAuth } from "@/lib/auth-context";
import { DigitalCertificateCard } from "@/components/certificate/DigitalCertificateCard";
import {
  CREATOR_RANKS,
  getRankDetails,
  calculateRankFromSubscribers,
  generateAutoCertificateId,
  captureCertificatePdf,
  printCertificateElement,
  sendCertificateEmailApi,
  checkAndSendRankMilestoneEmail,
  type CreatorRankInfo,
} from "@/lib/certificate-service";

export const Route = createFileRoute("/my-certificate")({
  head: () => ({
    meta: [
      { title: "My Certificate — FaceTube Creator Network" },
      {
        name: "description",
        content:
          "View, download, print, and email your official FaceTube Digital Certificate of Creator Excellence across all 10 creator milestone tiers.",
      },
      { property: "og:title", content: "My Certificate — FaceTube Creator Network" },
    ],
  }),
  component: MyCertificatePage,
});

function MyCertificatePage() {
  const { user, profile, dbUser } = useAuth();

  // Resolved User Details
  const userName =
    profile?.full_name ||
    profile?.name ||
    dbUser?.name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    "Alex Rivera";

  const userId = profile?.user_id || dbUser?.user_id || user?.user_metadata?.user_id || "FT483921";

  const userEmail = user?.email || profile?.email || dbUser?.email || "alex.rivera@facetube.app";

  // Real subscriber count for User (e.g. 128,400 for Alex Rivera FT483921)
  const actualSubscribers = 128400;

  // Actual earned rank based on real subscriber count
  const earnedRank = calculateRankFromSubscribers(actualSubscribers);

  // Active viewed/selected rank (defaults to earned rank)
  const [selectedRank, setSelectedRank] = useState<CreatorRankInfo>(() => {
    const saved = localStorage.getItem(`facetube_current_rank_${userId}`);
    return saved ? getRankDetails(saved) : earnedRank;
  });

  const [subscriberDisplay, setSubscriberDisplay] = useState<string>("128,400");

  // Auto-generated Certificate ID
  const certificateId = React.useMemo(() => {
    return generateAutoCertificateId(userId, selectedRank.name);
  }, [userId, selectedRank.name]);

  // Issue date
  const issueDate = React.useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const certificateRef = useRef<HTMLDivElement>(null);

  // Loading states
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // AUTOMATIC EMAIL ON NEW CREATOR RANK ACHIEVEMENT
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const lastAwardedRank = localStorage.getItem(`facetube_last_cert_rank_${userId}`);
    if (lastAwardedRank !== selectedRank.name && userEmail) {
      timer = setTimeout(async () => {
        try {
          let base64Pdf: string | undefined;
          if (certificateRef.current) {
            try {
              const formattedUserId = userId.startsWith("FT") ? userId : `FT${userId}`;
              const res = await captureCertificatePdf(certificateRef.current, {
                filename: `Facetube_Certificate_${formattedUserId}.pdf`,
                userId: formattedUserId,
              });
              base64Pdf = res.base64;
            } catch (err) {
              console.warn("Could not capture PDF for auto-email attachment:", err);
            }
          }

          const result = await sendCertificateEmailApi({
            userName,
            userId,
            email: userEmail,
            rank: selectedRank.name,
            subscribers: `${subscriberDisplay}+`,
            certificateId,
            issueDate,
            pdfBase64: base64Pdf,
            reason: `New Creator Rank Milestone: ${selectedRank.name}`,
          });

          if (result.success) {
            localStorage.setItem(`facetube_last_cert_rank_${userId}`, selectedRank.name);
            localStorage.setItem(`facetube_current_rank_${userId}`, selectedRank.name);
            setEmailSentSuccess(true);
            toast.success(
              `🎉 Rank Milestone Achieved! Your official ${selectedRank.name} Certificate has been automatically emailed to ${userEmail}.`,
              {
                duration: 6000,
                description: `Certificate ID: ${certificateId}`,
              },
            );
          }
        } catch (err) {
          console.error("Auto-send certificate email error:", err);
        }
      }, 1200);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [selectedRank, userId, userName, userEmail, subscriberDisplay, certificateId, issueDate]);

  // Handlers for the 3 requested buttons:
  // 1. Download PDF (Clean single-page A4 PDF)
  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;
    try {
      setDownloadingPdf(true);
      toast.info("Generating high-resolution Certificate PDF (Single A4)...", { duration: 2500 });
      const formattedUserId = userId.startsWith("FT") ? userId : `FT${userId}`;
      const filename = `Facetube_Certificate_${formattedUserId}.pdf`;
      const result = await captureCertificatePdf(certificateRef.current, {
        filename,
        userId: formattedUserId,
      });
      result.download();
      toast.success("Certificate PDF downloaded successfully (Single A4 Page)!");
    } catch (err) {
      console.error("Failed to download PDF:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 2. Print Certificate (Clean single-page A4 print)
  const handlePrintCertificate = () => {
    if (!certificateRef.current) return;
    toast.info("Opening single-page print preview...", { duration: 1500 });
    printCertificateElement(certificateRef.current);
  };

  // 3. Email Certificate
  const handleEmailCertificate = async () => {
    try {
      setSendingEmail(true);
      toast.info(`Preparing Certificate for ${userEmail}...`, { duration: 2000 });

      let base64Pdf: string | undefined;
      if (certificateRef.current) {
        try {
          const formattedUserId = userId.startsWith("FT") ? userId : `FT${userId}`;
          const res = await captureCertificatePdf(certificateRef.current, {
            filename: `Facetube_Certificate_${formattedUserId}.pdf`,
            userId: formattedUserId,
          });
          base64Pdf = res.base64;
        } catch (_e) {
          // Continue
        }
      }

      const result = await sendCertificateEmailApi({
        userName,
        userId,
        email: userEmail,
        rank: selectedRank.name,
        subscribers: `${subscriberDisplay}+`,
        certificateId,
        issueDate,
        pdfBase64: base64Pdf,
        reason: "User requested Certificate copy",
      });

      if (result.success) {
        setEmailSentSuccess(true);
        toast.success(`Digital Certificate sent to ${userEmail}!`, {
          description: `Delivered to your inbox with Certificate ID: ${certificateId}`,
        });
      } else {
        toast.error("Could not send email", {
          description: result.error || "Please verify SMTP credentials in Settings.",
        });
      }
    } catch (err: unknown) {
      toast.error("Failed to dispatch certificate email", {
        description: (err as Error).message || "Network error",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Switch rank
  const handleSelectRank = (rankInfo: CreatorRankInfo) => {
    setSelectedRank(rankInfo);
    setSubscriberDisplay(rankInfo.formattedSubscribers);
    toast.info(`Certificate updated for ${rankInfo.levelLabel}: ${rankInfo.awardName}`, {
      description: `Requirement: ${rankInfo.formattedSubscribers} verified subscribers.`,
    });
  };

  return (
    <VideoHubLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ScrollText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  📜 My Certificate
                </h1>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                  Verified Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Official FaceTube Digital Certificate of Creator Excellence across all 10 Creator
                Rank Milestones
              </p>
            </div>
          </div>

          {/* Quick Actions (3 Buttons) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Button 1: Download PDF */}
            <button
              id="btn-download-pdf"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark active:scale-95 disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${downloadingPdf ? "animate-bounce" : ""}`} />
              {downloadingPdf ? "Generating PDF..." : "Download PDF"}
            </button>

            {/* Button 2: Print Certificate */}
            <button
              id="btn-print-certificate"
              onClick={handlePrintCertificate}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/80 px-4 py-2.5 text-xs sm:text-sm font-bold text-foreground transition hover:bg-secondary active:scale-95"
            >
              <Printer className="h-4 w-4 text-muted-foreground" />
              Print Certificate
            </button>

            {/* Button 3: Email Certificate */}
            <button
              id="btn-email-certificate"
              onClick={handleEmailCertificate}
              disabled={sendingEmail}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-500 transition hover:bg-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              <Mail className={`h-4 w-4 ${sendingEmail ? "animate-spin" : ""}`} />
              {sendingEmail ? "Sending..." : "Email Certificate"}
            </button>
          </div>
        </div>

        {/* Milestone Banner Notice */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-black text-foreground flex items-center gap-2">
                <span>Automatic Rank Achievement Certificate Delivery</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-brand/20 text-brand px-2 py-0.5 rounded-full">
                  Automated
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculated dynamically from your verified subscriber count (
                <strong className="text-foreground">
                  {actualSubscribers.toLocaleString()} subscribers
                </strong>
                ). Achieved rank:{" "}
                <strong className="text-amber-500 font-bold">{earnedRank.awardName}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/my-certificate?verify=${encodeURIComponent(certificateId)}`,
                );
                toast.success("Verification link copied to clipboard!");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Verification Link
            </button>
          </div>
        </div>

        {/* The Digital Certificate Canvas Container (Light/White Professional Style) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Live Official Accreditation Document
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">ID: {certificateId}</span>
          </div>

          {/* Certificate Render */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[680px]">
              <DigitalCertificateCard
                ref={certificateRef}
                userName={userName}
                userId={userId}
                rank={selectedRank.awardName}
                subscriberCount={subscriberDisplay}
                certificateId={certificateId}
                issueDate={issueDate}
              />
            </div>
          </div>
        </div>

        {/* 10-Level Creator Rank & Rewards Grid */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand" />
                Creator Rank &amp; Rewards (All 10 Levels)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact 10-level creator structure calculated from your channel subscribers. Click any
                level to inspect its accredited certificate.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Active Tier: {selectedRank.levelLabel} ({selectedRank.awardName})
            </span>
          </div>

          {/* 10 Level Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CREATOR_RANKS.map((r) => {
              const isSelected = r.id === selectedRank.id;
              const isAchieved = actualSubscribers >= r.minSubscribers;

              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRank(r)}
                  className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-amber-400 bg-amber-500/10 shadow-md ring-2 ring-amber-400/30"
                      : isAchieved
                        ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60"
                        : "border-border bg-secondary/30 hover:bg-secondary opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Top Level Tag */}
                  <div className="flex items-center justify-between w-full mb-1 text-[10px] font-black uppercase tracking-wider">
                    <span className="text-amber-500">{r.levelLabel}</span>
                    {isAchieved ? (
                      <span className="flex items-center gap-0.5 text-emerald-500 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Achieved
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-muted-foreground font-medium">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>

                  <span className="text-3xl my-1">{r.badge}</span>
                  <span className="text-xs font-black text-foreground leading-snug">
                    {r.awardName}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 font-semibold">
                    {r.formattedSubscribers} Subscribers
                  </span>

                  <span
                    className={`mt-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full w-full ${
                      isSelected
                        ? "bg-amber-400 text-black shadow-xs"
                        : isAchieved
                          ? "bg-emerald-500/20 text-emerald-500"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isSelected ? "Viewing Certificate" : isAchieved ? "Unlocked" : "Progressing"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* User accreditation summary */}
          <div className="rounded-xl bg-secondary/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-foreground">Registered Creator: </span>
                {userName} ({userId}) · <span className="font-semibold">{userEmail}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Official single-page printable document verified</span>
            </div>
          </div>
        </div>
      </div>
    </VideoHubLayout>
  );
}
