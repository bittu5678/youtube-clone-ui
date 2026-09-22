import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ShieldCheck, Award, Sparkles, CheckCircle2 } from "lucide-react";
import { FacetubeLogoIcon } from "@/components/videohub/FacetubeLogoIcon";

export interface DigitalCertificateCardProps {
  userName: string;
  userId: string;
  rank: string;
  subscriberCount: string;
  certificateId: string;
  issueDate: string;
  verificationUrl?: string;
  variant?: "full" | "compact";
}

export const DigitalCertificateCard = React.forwardRef<HTMLDivElement, DigitalCertificateCardProps>(
  ({ userName, userId, rank, subscriberCount, certificateId, issueDate, verificationUrl }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

    const verifyLink =
      verificationUrl ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/my-certificate?verify=${encodeURIComponent(certificateId)}`
        : `https://facetube.app/my-certificate?verify=${encodeURIComponent(certificateId)}`);

    useEffect(() => {
      let isMounted = true;
      async function generateQr() {
        try {
          const dataUrl = await QRCode.toDataURL(verifyLink, {
            width: 320,
            margin: 1,
            color: {
              dark: "#0a0a0f",
              light: "#ffffff",
            },
            errorCorrectionLevel: "H",
          });
          if (isMounted) setQrCodeUrl(dataUrl);
        } catch (err) {
          console.error("Failed to generate QR code for certificate:", err);
        }
      }
      generateQr();
      return () => {
        isMounted = false;
      };
    }, [verifyLink]);

    return (
      <div
        ref={ref}
        id="facetube-digital-certificate"
        className="relative mx-auto w-full max-w-[960px] min-w-[680px] overflow-hidden rounded-2xl bg-[#0b0c13] text-white shadow-2xl border-[3px] border-[#d4af37]/80 selection:bg-[#d4af37]/30 [page-break-inside:avoid] [break-inside:avoid]"
        style={{
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 45px rgba(212, 175, 55, 0.2)",
          pageBreakInside: "avoid",
          breakInside: "avoid",
        }}
      >
        {/* Ornate Gold Border Inner Inset Frame */}
        <div className="m-3 rounded-xl border border-[#d4af37]/40 p-5 sm:p-8 relative bg-gradient-to-b from-[#12131f] via-[#0d0e17] to-[#08090e] [page-break-inside:avoid] [break-inside:avoid]">
          {/* Guilloche / Geometric Corner Filigree Decorations */}
          <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-[#d4af37] rounded-tl-lg pointer-events-none opacity-80" />
          <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-[#d4af37] rounded-tr-lg pointer-events-none opacity-80" />
          <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-[#d4af37] rounded-bl-lg pointer-events-none opacity-80" />
          <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-[#d4af37] rounded-br-lg pointer-events-none opacity-80" />

          {/* Subtle Background Watermark / Logo Pattern */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
            <FacetubeLogoIcon size={460} />
          </div>

          {/* Top Header: Logo + Accreditation Subtitle */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-2 pb-5 border-b border-[#d4af37]/30">
            <div className="flex items-center gap-3">
              <FacetubeLogoIcon size={44} />
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Face<span className="text-[#ff3b2e]">Tube</span>
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[11px] sm:text-xs font-bold tracking-[0.2em] text-[#f5d77f] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              Official Creator Accreditation
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#ffe082] via-[#fff3b0] to-[#d4af37] drop-shadow-sm pt-1 uppercase font-serif">
              FaceTube Digital Certificate
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide max-w-xl">
              This credentials accreditation is proudly conferred upon the creator below for
              outstanding community contribution and channel milestone achievement.
            </p>
          </div>

          {/* Central Recipient Showcase */}
          <div className="relative z-10 py-6 sm:py-8 text-center space-y-4">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
              This is to certify that
            </span>

            {/* Recipient Full Name */}
            <div className="py-2">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow font-serif">
                {userName || "Alex Rivera"}
              </h2>
              <div className="mx-auto mt-2 h-0.5 w-48 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            </div>

            {/* Recipient Identification & Recognition Notice */}
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mx-auto leading-relaxed px-2">
              has met all governance standards and achieved creator excellence, verified under
              FaceTube user identity{" "}
              <span className="font-mono font-bold text-[#ff4b4b] bg-black/40 px-2 py-0.5 rounded border border-[#ff4b4b]/30">
                {userId || "FT483921"}
              </span>
              . In recognition of stellar subscriber growth, ethical video publishing, and community
              engagement.
            </p>
          </div>

          {/* 3-Column Milestone Metric Badges */}
          <div className="cert-metric-grid relative z-10 grid grid-cols-3 gap-2.5 sm:gap-4 my-2 [page-break-inside:avoid] [break-inside:avoid]">
            {/* 1. Current Creator Rank */}
            <div className="rounded-xl border border-[#d4af37]/30 bg-black/40 p-3 sm:p-4 text-center backdrop-blur-sm relative overflow-hidden group [page-break-inside:avoid] [break-inside:avoid]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-rose-500" />
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#d4af37]/80">
                Current Creator Rank
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-base sm:text-xl font-extrabold text-amber-300">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <span className="truncate">{rank || "Diamond Creator"}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-medium truncate">
                Accredited Tier Milestone
              </div>
            </div>

            {/* 2. Subscriber Count */}
            <div className="rounded-xl border border-[#d4af37]/30 bg-black/40 p-3 sm:p-4 text-center backdrop-blur-sm relative overflow-hidden [page-break-inside:avoid] [break-inside:avoid]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#d4af37]/80">
                Subscriber Count
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-base sm:text-xl font-extrabold text-white">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0" />
                <span className="truncate">{subscriberCount || "128.4K"} Subs</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-emerald-400 mt-0.5 font-semibold flex items-center justify-center gap-1 truncate">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Verified Base
              </div>
            </div>

            {/* 3. Certificate ID & Issue Date */}
            <div className="rounded-xl border border-[#d4af37]/30 bg-black/40 p-3 sm:p-4 text-center backdrop-blur-sm relative overflow-hidden [page-break-inside:avoid] [break-inside:avoid]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#d4af37]/80">
                Certificate ID (Auto)
              </div>
              <div className="mt-1 font-mono text-xs sm:text-sm font-extrabold text-zinc-200 tracking-wide truncate">
                {certificateId}
              </div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-medium truncate">
                Issued: {issueDate}
              </div>
            </div>
          </div>

          {/* Bottom Footer: Verification QR Code, Signatures, Gold Medallion */}
          <div className="cert-footer-row relative z-10 mt-6 pt-5 border-t border-[#d4af37]/30 flex flex-row items-center justify-between gap-4 sm:gap-6 [page-break-inside:avoid] [break-inside:avoid]">
            {/* Left: Dynamic QR Code Verification */}
            <div className="flex items-center gap-2.5 sm:gap-3 bg-black/50 p-2 sm:p-2.5 rounded-xl border border-zinc-800 shrink-0 [page-break-inside:avoid] [break-inside:avoid]">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Certificate Verification QR Code"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-white p-1 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-zinc-800 animate-pulse" />
              )}
              <div className="text-left space-y-0.5">
                <div className="text-[10px] sm:text-[11px] font-black text-[#d4af37] uppercase tracking-wider">
                  Scan to Verify
                </div>
                <div className="text-[9px] sm:text-[10px] text-zinc-400 max-w-[130px] leading-tight">
                  Cryptographically verified on FaceTube Registry
                </div>
                <div className="text-[8px] sm:text-[9px] font-mono text-zinc-500">
                  {certificateId.slice(-10)}
                </div>
              </div>
            </div>

            {/* Middle: Gold Foil Embossed Seal */}
            <div className="flex flex-col items-center text-center shrink-0 [page-break-inside:avoid] [break-inside:avoid]">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#d4af37] bg-gradient-to-br from-[#ffd54f] via-[#ffb300] to-[#ff8f00] p-1 flex items-center justify-center shadow-lg relative">
                <div className="w-full h-full rounded-full border border-dashed border-black/40 flex flex-col items-center justify-center text-black font-black">
                  <span className="text-[7px] sm:text-[8px] tracking-tighter uppercase font-bold leading-none">
                    FaceTube
                  </span>
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black my-0.5" />
                  <span className="text-[6px] sm:text-[7px] tracking-tighter uppercase font-bold leading-none">
                    Official
                  </span>
                </div>
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold text-[#d4af37] uppercase tracking-widest mt-1">
                Verified Seal
              </span>
            </div>

            {/* Right: Authorized Signature */}
            <div className="flex flex-col items-end text-right space-y-0.5 sm:space-y-1 shrink-0 [page-break-inside:avoid] [break-inside:avoid]">
              <div className="font-serif italic text-lg sm:text-2xl text-[#f5d77f] font-normal tracking-wide select-none drop-shadow">
                Marcus Sterling &amp; Board
              </div>
              <div className="h-0.5 w-32 sm:w-36 bg-[#d4af37]/60" />
              <div className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
                Authorized Signature
              </div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 font-medium">
                FaceTube Global Creator Governance Board
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

DigitalCertificateCard.displayName = "DigitalCertificateCard";
