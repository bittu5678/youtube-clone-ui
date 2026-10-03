import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export interface CreatorRankInfo {
  id: string;
  level: number;
  levelLabel: string;
  name: string;
  awardName: string;
  minSubscribers: number;
  formattedSubscribers: string;
  badge: string;
  accentColor: string;
  tierLevel: string;
  description: string;
}

/**
 * EXACT 10-LEVEL CREATOR RANK & REWARDS STRUCTURE
 * LEVEL 1: 1,000 Subscribers — Starter Creator Award
 * LEVEL 2: 10,000 Subscribers — Rising Star Award
 * LEVEL 3: 50,000 Subscribers — Silver Creator Award
 * LEVEL 4: 100,000 Subscribers — Gold Creator Award
 * LEVEL 5: 500,000 Subscribers — Platinum Creator Award
 * LEVEL 6: 1,000,000 (1M) Subscribers — Diamond Master Award
 * LEVEL 7: 5,000,000 (5M) Subscribers — Ruby Elite Award
 * LEVEL 8: 10,000,000 (10M) Subscribers — Crown Legend Award
 * LEVEL 9: 50,000,000 (50M) Subscribers — Titan Creator Award
 * LEVEL 10: 100,000,000 (100M) Subscribers — Supreme Titan Award
 */
export const CREATOR_RANKS: CreatorRankInfo[] = [
  {
    id: "level-1",
    level: 1,
    levelLabel: "LEVEL 1",
    name: "Starter Creator Award",
    awardName: "Starter Creator Award",
    minSubscribers: 1000,
    formattedSubscribers: "1,000",
    badge: "🌱",
    accentColor: "from-emerald-500 to-teal-700 border-emerald-500",
    tierLevel: "Level 1",
    description:
      "Achieved 1,000 verified channel subscribers and basic creator monetization accreditation.",
  },
  {
    id: "level-2",
    level: 2,
    levelLabel: "LEVEL 2",
    name: "Rising Star Award",
    awardName: "Rising Star Award",
    minSubscribers: 10000,
    formattedSubscribers: "10,000",
    badge: "⭐",
    accentColor: "from-cyan-500 to-blue-600 border-cyan-400",
    tierLevel: "Level 2",
    description:
      "Surpassed 10,000 verified subscribers with accelerating viewer engagement and community loyalty.",
  },
  {
    id: "level-3",
    level: 3,
    levelLabel: "LEVEL 3",
    name: "Silver Creator Award",
    awardName: "Silver Creator Award",
    minSubscribers: 50000,
    formattedSubscribers: "50,000",
    badge: "🥈",
    accentColor: "from-slate-400 to-zinc-600 border-slate-300",
    tierLevel: "Level 3",
    description:
      "Conferred for reaching 50,000 community members with distinguished video syndication standards.",
  },
  {
    id: "level-4",
    level: 4,
    levelLabel: "LEVEL 4",
    name: "Gold Creator Award",
    awardName: "Gold Creator Award",
    minSubscribers: 100000,
    formattedSubscribers: "100,000",
    badge: "🥇",
    accentColor: "from-amber-400 via-yellow-500 to-amber-600 border-amber-400",
    tierLevel: "Level 4",
    description:
      "Celebrates the 100,000 subscriber milestone with prioritized algorithmic feed distribution.",
  },
  {
    id: "level-5",
    level: 5,
    levelLabel: "LEVEL 5",
    name: "Platinum Creator Award",
    awardName: "Platinum Creator Award",
    minSubscribers: 500000,
    formattedSubscribers: "500,000",
    badge: "💎",
    accentColor: "from-sky-400 via-indigo-500 to-purple-600 border-sky-400",
    tierLevel: "Level 5",
    description:
      "Half a million community footprint with verified creator badge accreditation and brand partnerships.",
  },
  {
    id: "level-6",
    level: 6,
    levelLabel: "LEVEL 6",
    name: "Diamond Master Award",
    awardName: "Diamond Master Award",
    minSubscribers: 1000000,
    formattedSubscribers: "1,000,000 (1M)",
    badge: "💠",
    accentColor: "from-blue-400 via-violet-500 to-fuchsia-600 border-violet-400",
    tierLevel: "Level 6",
    description:
      "Historic 1,000,000 subscriber benchmark with premier creator status and global revenue pool dividends.",
  },
  {
    id: "level-7",
    level: 7,
    levelLabel: "LEVEL 7",
    name: "Ruby Elite Award",
    awardName: "Ruby Elite Award",
    minSubscribers: 5000000,
    formattedSubscribers: "5,000,000 (5M)",
    badge: "♦️",
    accentColor: "from-rose-500 via-red-600 to-rose-700 border-rose-400",
    tierLevel: "Level 7",
    description:
      "Exceptional 5,000,000 subscriber achievement representing top-echelon global creator influence.",
  },
  {
    id: "level-8",
    level: 8,
    levelLabel: "LEVEL 8",
    name: "Crown Legend Award",
    awardName: "Crown Legend Award",
    minSubscribers: 10000000,
    formattedSubscribers: "10,000,000 (10M)",
    badge: "👑",
    accentColor: "from-amber-500 via-yellow-400 to-amber-600 border-yellow-300",
    tierLevel: "Level 8",
    description:
      "Legendary 10,000,000 subscriber milestone with lifetime honorary creator privileges and leadership advisory.",
  },
  {
    id: "level-9",
    level: 9,
    levelLabel: "LEVEL 9",
    name: "Titan Creator Award",
    awardName: "Titan Creator Award",
    minSubscribers: 50000000,
    formattedSubscribers: "50,000,000 (50M)",
    badge: "⚡",
    accentColor: "from-orange-500 via-amber-500 to-red-600 border-orange-400",
    tierLevel: "Level 9",
    description:
      "Monumental 50,000,000 global community scale reshaping digital media culture worldwide.",
  },
  {
    id: "level-10",
    level: 10,
    levelLabel: "LEVEL 10",
    name: "Supreme Titan Award",
    awardName: "Supreme Titan Award",
    minSubscribers: 100000000,
    formattedSubscribers: "100,000,000 (100M)",
    badge: "🌟",
    accentColor: "from-yellow-300 via-amber-500 to-purple-700 border-yellow-300",
    tierLevel: "Level 10 (Highest)",
    description:
      "The pinnacle of FaceTube achievement: 100,000,000 subscribers, honored with the Supreme Titan Creator Trophy.",
  },
];

export function getRankDetails(rankNameOrId?: string): CreatorRankInfo {
  if (!rankNameOrId) return CREATOR_RANKS[3]; // Default to Gold (Level 4)
  const query = rankNameOrId.toLowerCase().trim();
  const found = CREATOR_RANKS.find(
    (r) =>
      r.id.toLowerCase() === query ||
      r.name.toLowerCase().includes(query) ||
      r.awardName.toLowerCase().includes(query) ||
      r.levelLabel.toLowerCase() === query ||
      `level ${r.level}` === query,
  );
  return found || CREATOR_RANKS[3];
}

/**
 * Calculates current rank strictly from user's actual subscriber count
 */
export function calculateRankFromSubscribers(subscribers: number): CreatorRankInfo {
  const count = typeof subscribers === "number" && !isNaN(subscribers) ? subscribers : 0;
  // Iterate from highest level (10) down to level 1
  for (let i = CREATOR_RANKS.length - 1; i >= 0; i--) {
    if (count >= CREATOR_RANKS[i].minSubscribers) {
      return CREATOR_RANKS[i];
    }
  }
  // If below Level 1 threshold, return Level 1 as the current target/first milestone
  return CREATOR_RANKS[0];
}

export function generateAutoCertificateId(userId: string, rankName: string): string {
  const cleanId = (userId || "FT483921").replace(/[^a-zA-Z0-9]/g, "");
  const rankCode = rankName.slice(0, 4).toUpperCase();
  const year = 2026;
  const hash = Math.abs(
    Array.from(`${cleanId}-${rankName}-${year}`).reduce(
      (acc, char) => (acc << 5) - acc + char.charCodeAt(0),
      0,
    ),
  )
    .toString(36)
    .toUpperCase()
    .slice(0, 6)
    .padStart(6, "8");
  return `FT-CERT-${year}-${rankCode}-${hash}`;
}

/**
 * High-Resolution Single A4 Portrait PDF Capture
 * Strictly fits on ONE single A4 page with clean Light/White background
 */
export async function captureCertificatePdf(
  element: HTMLElement,
  options?: { filename?: string; userId?: string },
): Promise<{ pdf: jsPDF; base64: string; blob: Blob; download: () => void }> {
  // Ensure DOM and fonts are ready
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (_e) {
      // ignore
    }
  }

  let imgData: string | null = null;
  let naturalWidth = element.offsetWidth || 960;
  let naturalHeight = element.offsetHeight || 640;

  // 1. Primary Engine: html-to-image (toPng) with clean white background & 300 DPI
  try {
    imgData = await Promise.race([
      toPng(element, {
        quality: 1.0,
        pixelRatio: 3.125, // 300 DPI high resolution
        backgroundColor: "#ffffff",
        skipFonts: true,
        cacheBust: true,
      }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("html-to-image capture timed out")), 9000),
      ),
    ]);
  } catch (primaryErr) {
    console.warn("Primary html-to-image capture failed, trying html2canvas fallback:", primaryErr);
  }

  // 2. Secondary Engine: html2canvas fallback with light/white background
  if (!imgData) {
    try {
      const canvas = await html2canvas(element, {
        scale: 3, // 300 DPI quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: element.scrollWidth,
      });
      imgData = canvas.toDataURL("image/png");
      naturalWidth = canvas.width;
      naturalHeight = canvas.height;
    } catch (h2cErr) {
      console.error("Secondary html2canvas capture also failed:", h2cErr);
      throw new Error("Failed to render high-resolution certificate canvas.");
    }
  }

  // Measure exact rendered aspect ratio
  if (typeof Image !== "undefined" && imgData) {
    try {
      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve) => {
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            naturalWidth = img.naturalWidth;
            naturalHeight = img.naturalHeight;
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    } catch (_e) {
      // ignore
    }
  }

  // 3. High-Resolution Single A4 Portrait PDF (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  // Fill entire sheet with clean pure white background (#ffffff)
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Single page fit margins (guarantees fitting entirely on 1 page without extra pages)
  const marginX = 8;
  const marginY = 12;
  const maxContentWidth = pageWidth - marginX * 2; // 194 mm
  const maxContentHeight = pageHeight - marginY * 2; // 273 mm

  const aspectRatio = naturalHeight / naturalWidth;
  let renderWidth = maxContentWidth;
  let renderHeight = renderWidth * aspectRatio;

  if (renderHeight > maxContentHeight) {
    renderHeight = maxContentHeight;
    renderWidth = renderHeight / aspectRatio;
  }

  // Center horizontally and vertically on the single page
  const posX = (pageWidth - renderWidth) / 2;
  const posY = (pageHeight - renderHeight) / 2;

  pdf.addImage(imgData, "PNG", posX, posY, renderWidth, renderHeight, undefined, "FAST");

  const pdfBase64 = pdf.output("datauristring");
  const blob = pdf.output("blob");

  const defaultUserId = options?.userId || "FT483921";
  const formattedUserId = defaultUserId.startsWith("FT") ? defaultUserId : `FT${defaultUserId}`;
  const filename = options?.filename || `Facetube_Certificate_${formattedUserId}.pdf`;

  const download = () => {
    try {
      pdf.save(filename);
    } catch (saveErr) {
      console.warn("pdf.save fallback:", saveErr);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.setAttribute("download", filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }
  };

  return {
    pdf,
    base64: pdfBase64,
    blob,
    download,
  };
}

/**
 * Print Certificate cleanly on ONE single A4 page with white background
 */
export function printCertificateElement(element: HTMLElement): void {
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join("\n");

  let printIframe = document.getElementById(
    "facetube-cert-print-frame",
  ) as HTMLIFrameElement | null;
  if (printIframe) {
    printIframe.remove();
  }

  printIframe = document.createElement("iframe");
  printIframe.id = "facetube-cert-print-frame";
  printIframe.setAttribute("aria-hidden", "true");
  printIframe.style.position = "fixed";
  printIframe.style.top = "-9999px";
  printIframe.style.left = "-9999px";
  printIframe.style.width = "0";
  printIframe.style.height = "0";
  printIframe.style.border = "none";
  document.body.appendChild(printIframe);

  const printDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
  if (!printDoc) {
    window.print();
    return;
  }

  printDoc.open();
  printDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FaceTube Official Digital Certificate</title>
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .cert-print-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding: 8mm !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background-color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #facetube-digital-certificate {
            width: 194mm !important;
            max-width: 194mm !important;
            min-width: 194mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        <div class="cert-print-page">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  printDoc.close();

  setTimeout(() => {
    try {
      printIframe?.contentWindow?.focus();
      printIframe?.contentWindow?.print();
    } catch (_printErr) {
      window.print();
    }
  }, 450);
}

export async function sendCertificateEmailApi(payload: {
  userName: string;
  userId: string;
  email: string;
  rank: string;
  subscribers: string;
  certificateId: string;
  issueDate: string;
  pdfBase64?: string;
  reason?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch("/api/send-certificate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    console.warn("Certificate email API error:", err);
    return { success: false, error: (err as Error).message || "Network error" };
  }
}

export async function checkAndSendRankMilestoneEmail(params: {
  userName: string;
  userId: string;
  email: string;
  rank: string;
  subscribers: string;
  certificateId: string;
  issueDate: string;
  certificateElement?: HTMLElement | null;
  force?: boolean;
}): Promise<boolean> {
  const storageKey = `facetube_cert_emailed_${params.userId}_${params.rank.replace(/\s+/g, "_")}`;
  const alreadySent = localStorage.getItem(storageKey);

  if (alreadySent && !params.force) {
    return false;
  }

  let pdfBase64: string | undefined;
  if (params.certificateElement) {
    try {
      const captured = await captureCertificatePdf(params.certificateElement);
      pdfBase64 = captured.base64;
    } catch (_e) {
      // Continue without attachment
    }
  }

  const result = await sendCertificateEmailApi({
    userName: params.userName,
    userId: params.userId,
    email: params.email,
    rank: params.rank,
    subscribers: params.subscribers,
    certificateId: params.certificateId,
    issueDate: params.issueDate,
    pdfBase64,
    reason: `Rank Achievement: ${params.rank}`,
  });

  if (result.success) {
    localStorage.setItem(storageKey, new Date().toISOString());
    toast.success(`Digital Certificate for ${params.rank} emailed to ${params.email}!`, {
      description: `Certificate ID: ${params.certificateId}`,
    });
    return true;
  }

  return false;
}
