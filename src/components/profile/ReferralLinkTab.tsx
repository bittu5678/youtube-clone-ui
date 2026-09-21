import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Link2,
  Copy,
  Check,
  Share2,
  Download,
  QrCode,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Send,
  Twitter,
  Mail,
  X,
  Users,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface ReferralLinkTabProps {
  userId: string;
  userName?: string;
}

export function ReferralLinkTab({ userId, userName }: ReferralLinkTabProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [generatingQr, setGeneratingQr] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Generate real referral link from user ID
  const origin = typeof window !== "undefined" ? window.location.origin : "https://facetube.app";
  const referralLink = `${origin}/auth?ref=${encodeURIComponent(userId)}`;

  // Generate QR Code dynamically
  useEffect(() => {
    let isMounted = true;
    async function createQr() {
      try {
        setGeneratingQr(true);
        const url = await QRCode.toDataURL(referralLink, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        });
        if (isMounted) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      } finally {
        if (isMounted) setGeneratingQr(false);
      }
    }
    createQr();
    return () => {
      isMounted = false;
    };
  }, [referralLink]);

  // Copy referral link to clipboard
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        // Fallback
        const el = document.createElement("textarea");
        el.value = referralLink;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link. Please copy manually.");
    }
  };

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: "Join FaceTube",
      text: `Join FaceTube with my referral code ${userId} and unlock premium video earnings & monetization!`,
      url: referralLink,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
        return;
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setShareModalOpen(true);
        }
        return;
      }
    }

    setShareModalOpen(true);
  };

  // Download QR code image
  const handleDownloadQr = () => {
    if (!qrDataUrl) {
      toast.error("QR Code is not ready yet.");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `facetube-referral-qr-${userId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Referral QR Code downloaded!");
    } catch {
      toast.error("Could not download QR code.");
    }
  };

  const shareText = encodeURIComponent(
    `Join FaceTube with my referral code ${userId} and earn passive income watching & publishing videos: ${referralLink}`,
  );

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-sm transition">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand/10 text-brand">
              <Link2 className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground">Your Referral Link & QR Code</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Invite creators and members to FaceTube using your personal referral link. Earn direct
            referral bonus and monthly volume commissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-bold text-brand">
            <Award className="h-3.5 w-3.5" />
            Active User ID: {userId}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Referral Link and Sharing Options */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Referral Link Box */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                Your Referral Link
              </label>
              <span className="text-[11px] font-semibold text-emerald-400">Auto-Generated</span>
            </div>

            <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-3.5 py-2.5 text-xs text-foreground font-mono outline-none select-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
                >
                  <Share2 className="h-4 w-4 text-brand" />
                  Share
                </button>
              </div>
            </div>

            <p className="mt-2.5 text-[11px] text-muted-foreground">
              Anyone who clicks this link will automatically have your User ID (
              <span className="font-semibold text-foreground">{userId}</span>) prefilled as their
              sponsor upon registration.
            </p>
          </div>

          {/* Referral Benefits / Instructions Card */}
          <div className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              Referral Program Benefits
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                <span>
                  <strong className="text-foreground">Direct Commission:</strong> Receive ₹500
                  instant bonus credited for every verified creator or member joining through your
                  link.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                <span>
                  <strong className="text-foreground">Monthly Team Volume:</strong> Earn recurring
                  team turnover percentage up to 10 tier levels.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                <span>
                  <strong className="text-foreground">Instant Wallet Settlements:</strong> Track
                  referrals in real-time on your{" "}
                  <span className="text-brand font-medium">Referral Members</span> &{" "}
                  <span className="text-brand font-medium">Team Members</span> tables.
                </span>
              </li>
            </ul>
          </div>

          {/* Social Quick Share Buttons */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Quick Share Channels</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 px-3 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Join FaceTube with sponsor code ${userId}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 py-2 px-3 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 transition"
              >
                <Send className="h-3.5 w-3.5" />
                Telegram
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 py-2 px-3 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition"
              >
                <Twitter className="h-3.5 w-3.5" />
                Twitter (X)
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent("Join me on FaceTube")}&body=${shareText}`}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 py-2 px-3 text-xs font-semibold text-foreground hover:bg-secondary transition"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Referral QR Code Card */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-xs rounded-2xl border border-border bg-secondary/40 p-6 flex flex-col items-center text-center shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="h-4 w-4 text-brand" />
              <span className="text-xs font-bold text-foreground">Referral QR Code</span>
            </div>

            {/* QR Code Container */}
            <div className="relative p-3 bg-white rounded-2xl shadow-inner border border-border/40">
              {generatingQr ? (
                <div className="h-48 w-48 flex items-center justify-center text-black/60">
                  <span className="text-xs font-medium animate-pulse">Generating QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Referral QR Code for ${userId}`}
                  className="h-48 w-48 object-contain rounded-lg"
                />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center text-destructive text-xs">
                  Failed to load QR
                </div>
              )}
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs font-bold text-foreground">
                {userName ? `${userName}'s QR` : "FaceTube Referral QR"}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Code: {userId}</p>
            </div>

            {/* Download QR button */}
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={generatingQr || !qrDataUrl}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border py-2.5 px-4 text-xs font-bold text-foreground transition active:scale-95 disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-brand" />
              Download QR
            </button>

            <p className="mt-2.5 text-[10px] text-muted-foreground">
              Scan with any camera or QR app to open registration directly.
            </p>
          </div>
        </div>
      </div>

      {/* Share Modal for desktop / fallback */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold text-foreground">Share Referral Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 w-full rounded-xl border border-border bg-secondary/50 p-3 text-xs font-semibold text-foreground hover:bg-secondary transition"
              >
                <span className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span>Share via WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Join FaceTube with sponsor code ${userId}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 w-full rounded-xl border border-border bg-secondary/50 p-3 text-xs font-semibold text-foreground hover:bg-secondary transition"
              >
                <span className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </span>
                <span>Share via Telegram</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 w-full rounded-xl border border-border bg-secondary/50 p-3 text-xs font-semibold text-foreground hover:bg-secondary transition"
              >
                <span className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Twitter className="h-4 w-4" />
                </span>
                <span>Post on Twitter (X)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleCopyLink();
                  setShareModalOpen(false);
                }}
                className="flex items-center gap-3 w-full rounded-xl border border-border bg-secondary/50 p-3 text-xs font-semibold text-foreground hover:bg-secondary transition"
              >
                <span className="h-8 w-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <Copy className="h-4 w-4" />
                </span>
                <span>Copy Referral URL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
