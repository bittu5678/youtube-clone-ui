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
              dark: "#0f172a",
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
        className="relative mx-auto w-full max-w-[940px] min-w-[680px] overflow-hidden rounded-2xl bg-[#ffffff] text-slate-900 shadow-xl border-[4px] border-[#c59b27] selection:bg-[#c59b27]/20 [page-break-inside:avoid] [break-inside:avoid]"
        style={{
          boxShadow: "0 15px 40px -10px rgba(0, 0, 0, 0.12), 0 0 30px rgba(197, 155, 39, 0.15)",
          pageBreakInside: "avoid",
          breakInside: "avoid",
        }}
      >
        {/* Ornate Gold Border Inner Inset Frame with Light/White Premium Aesthetic */}
        <div className="m-3 rounded-xl border-2 border-[#c59b27]/60 p-6 sm:p-8 relative bg-gradient-to-b from-[#fdfbf7] via-[#ffffff] to-[#fbf9f4] [page-break-inside:avoid] [break-inside:avoid]">
          {/* Filigree Corner Accents */}
          <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-[#c59b27] rounded-tl pointer-events-none opacity-90" />
          <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-[#c59b27] rounded-tr pointer-events-none opacity-90" />
          <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-[#c59b27] rounded-bl pointer-events-none opacity-90" />
          <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-[#c59b27] rounded-br pointer-events-none opacity-90" />

          {/* Light Background Watermark / Logo Pattern */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <FacetubeLogoIcon size={460} />
          </div>

          {/* Top Header: Logo + Accreditation Subtitle */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-2 pb-4 border-b border-[#c59b27]/30">
            <div className="flex items-center gap-2.5">
              <FacetubeLogoIcon size={40} />
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Face<span className="text-[#ff3b2e]">Tube</span>
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fbf5e6] border border-[#c59b27]/40 text-[11px] sm:text-xs font-bold tracking-[0.2em] text-[#996f12] uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#b38515]" />
              Official Creator Accreditation
              <Sparkles className="w-3.5 h-3.5 text-[#b38515]" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-[#996f12] pt-1 uppercase font-serif drop-shadow-xs">
              FaceTube Digital Certificate
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium tracking-wide max-w-xl">
              This credential accreditation is proudly conferred upon the creator below for
              outstanding community excellence, ethical video publishing, and verified subscriber
              milestones.
            </p>
          </div>

          {/* Central Recipient Showcase */}
          <div className="relative z-10 py-5 sm:py-6 text-center space-y-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#996f12]">
              This is to certify that
            </span>

            {/* Recipient Full Name */}
            <div className="py-1">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-serif">
                {userName || "Alex Rivera"}
              </h2>
              <div className="mx-auto mt-2 h-0.5 w-52 bg-gradient-to-r from-transparent via-[#c59b27] to-transparent" />
            </div>

            {/* Recipient Identification & Recognition Notice */}
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
              has met all governance standards and achieved creator excellence, verified under
              FaceTube creator identity{" "}
              <span className="font-mono font-bold text-[#ff3b2e] bg-red-50 px-2.5 py-0.5 rounded border border-[#ff3b2e]/30">
                {userId || "FT483921"}
              </span>
              . Conferred in recognition of stellar channel growth, creator integrity, and audience
              empowerment.
            </p>
          </div>

          {/* 3-Column Milestone Metric Badges with Light White/Gold Background */}
          <div className="cert-metric-grid relative z-10 grid grid-cols-3 gap-3 sm:gap-4 my-2 [page-break-inside:avoid] [break-inside:avoid]">
            {/* 1. Award / Rank */}
            <div className="rounded-xl border border-[#c59b27]/40 bg-white p-3 sm:p-4 text-center shadow-xs relative overflow-hidden [page-break-inside:avoid] [break-inside:avoid]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c59b27] to-[#e6b839]" />
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#996f12]">
                Creator Award / Rank
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-sm sm:text-lg font-black text-slate-900">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#b38515] shrink-0" />
                <span className="truncate">{rank || "Gold Creator Award"}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-medium truncate">
                Official Tier Milestone
              </div>
            </div>

            {/* 2. Subscriber Count */}
            <div className="rounded-xl border border-[#c59b27]/40 bg-white p-3 sm:p-4 text-center shadow-xs relative overflow-hidden [page-break-inside:avoid] [break-inside:avoid]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff3b2e] to-[#ff6b5e]" />
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#996f12]">
                Subscriber Milestone
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-sm sm:text-lg font-black text-slate-900">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff3b2e] shrink-0" />
                <span className="truncate">{subscriberCount || "100,000"}+ Subs</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-emerald-700 mt-0.5 font-semibold flex items-center justify-center gap-1 truncate">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Verified Channel
              </div>
            </div>

            {/* 3. Certificate ID & Issue Date */}
            <div className="rounded-xl border border-[#c59b27]/40 bg-white p-3 sm:p-4 text-center shadow-xs relative overflow-hidden [page-break-inside:avoid] [break-inside:avoid]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#996f12]">
                Certificate Reference
              </div>
              <div className="mt-1 font-mono text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide truncate">
                {certificateId}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-medium truncate">
                Issued: {issueDate}
              </div>
            </div>
          </div>

          {/* Bottom Footer: Verification QR Code, Signatures, Gold Medallion */}
          <div className="cert-footer-row relative z-10 mt-5 pt-4 border-t border-[#c59b27]/30 flex flex-row items-center justify-between gap-4 sm:gap-6 [page-break-inside:avoid] [break-inside:avoid]">
            {/* Left: Dynamic QR Code Verification */}
            <div className="flex items-center gap-2.5 sm:gap-3 bg-[#faf8f5] p-2 sm:p-2.5 rounded-xl border border-[#c59b27]/30 shrink-0 [page-break-inside:avoid] [break-inside:avoid]">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Certificate Verification QR Code"
                  className="w-13 h-13 sm:w-15 sm:h-15 rounded-md bg-white p-0.5 border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-md bg-slate-200 animate-pulse" />
              )}
              <div className="text-left space-y-0.5">
                <div className="text-[10px] sm:text-[11px] font-black text-[#996f12] uppercase tracking-wider">
                  Scan to Verify
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-600 max-w-[130px] leading-tight">
                  Cryptographically verified on FaceTube Registry
                </div>
                <div className="text-[8px] sm:text-[9px] font-mono text-slate-500">
                  {certificateId.slice(-12)}
                </div>
              </div>
            </div>

            {/* Middle: Gold Foil Embossed Seal */}
            <div className="flex flex-col items-center text-center shrink-0 [page-break-inside:avoid] [break-inside:avoid]">
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#c59b27] bg-gradient-to-br from-[#ffd54f] via-[#ffb300] to-[#e68a00] p-1 flex items-center justify-center shadow-md relative">
                <div className="w-full h-full rounded-full border border-dashed border-amber-900/40 flex flex-col items-center justify-center text-amber-950 font-black">
                  <span className="text-[7px] sm:text-[8px] tracking-tighter uppercase font-bold leading-none">
                    FaceTube
                  </span>
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-950 my-0.5" />
                  <span className="text-[6px] sm:text-[7px] tracking-tighter uppercase font-bold leading-none">
                    Official
                  </span>
                </div>
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold text-[#996f12] uppercase tracking-widest mt-1">
                Verified Seal
              </span>
            </div>

            {/* Right: Authorized Signature */}
            <div className="flex flex-col items-end text-right space-y-0.5 sm:space-y-1 shrink-0 [page-break-inside:avoid] [break-inside:avoid]">
              <div className="font-serif italic text-lg sm:text-2xl text-slate-800 font-normal tracking-wide select-none">
                Marcus Sterling &amp; Board
              </div>
              <div className="h-0.5 w-32 sm:w-36 bg-[#c59b27]/80" />
              <div className="text-[11px] sm:text-xs font-bold text-slate-900 tracking-wide">
                Authorized Signature
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-600 font-medium">
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
