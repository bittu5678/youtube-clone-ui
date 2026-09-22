import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export interface CreatorRankInfo {
  id: string;
  name: string;
  minSubscribers: number;
  badge: string;
  accentColor: string;
  tierLevel: string;
  description: string;
}

export const CREATOR_RANKS: CreatorRankInfo[] = [
  {
    id: "bronze",
    name: "Bronze Creator",
    minSubscribers: 1000,
    badge: "🥉",
    accentColor: "from-amber-700 to-amber-900 border-amber-600",
    tierLevel: "Tier 1",
    description: "Achieved 1,000+ verified channel subscribers and video monetization unlock.",
  },
  {
    id: "silver",
    name: "Silver Creator",
    minSubscribers: 10000,
    badge: "🥈",
    accentColor: "from-slate-300 to-slate-500 border-slate-300",
    tierLevel: "Tier 2",
    description: "Surpassed 10,000+ loyal subscribers with verified creator badge accreditation.",
  },
  {
    id: "gold",
    name: "Gold Creator",
    minSubscribers: 50000,
    badge: "🥇",
    accentColor: "from-amber-300 via-yellow-500 to-amber-600 border-yellow-400",
    tierLevel: "Tier 3",
    description: "Exceptional 50,000+ community benchmark with prioritized stream syndication.",
  },
  {
    id: "platinum",
    name: "Platinum Creator",
    minSubscribers: 100000,
    badge: "💎",
    accentColor: "from-cyan-300 via-sky-400 to-blue-600 border-cyan-400",
    tierLevel: "Tier 4",
    description: "Elite 100,000+ subscriber status with Level 4 Downline revenue share.",
  },
  {
    id: "diamond",
    name: "Diamond Creator",
    minSubscribers: 125000,
    badge: "👑",
    accentColor: "from-fuchsia-400 via-rose-500 to-amber-400 border-rose-400",
    tierLevel: "Tier 5",
    description: "Master Class 125,000+ subscriber milestone with global revenue pool dividends.",
  },
  {
    id: "ambassador",
    name: "Ambassador Creator",
    minSubscribers: 250000,
    badge: "🌟",
    accentColor: "from-yellow-400 via-amber-500 to-red-600 border-yellow-400",
    tierLevel: "Tier 6 (Supreme)",
    description: "Supreme FaceTube Creator Network Ambassador with executive board consultation.",
  },
];

export function getRankDetails(rankName?: string): CreatorRankInfo {
  if (!rankName) return CREATOR_RANKS[4]; // Default to Diamond
  const found = CREATOR_RANKS.find(
    (r) =>
      r.name.toLowerCase().includes(rankName.toLowerCase()) ||
      r.id.toLowerCase() === rankName.toLowerCase(),
  );
  return found || CREATOR_RANKS[4];
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

export async function captureCertificatePdf(
  element: HTMLElement,
  options?: { filename?: string; userId?: string },
): Promise<{ pdf: jsPDF; base64: string; blob: Blob; download: () => void }> {
  // Ensure DOM and fonts are fully settled
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

  // 1. Primary Engine: html-to-image (toPng) with 300 DPI quality (pixelRatio: 3.125)
  // Handles modern CSS variables, gradients, and SVG without stylesheet parsing crashes
  try {
    imgData = await Promise.race([
      toPng(element, {
        quality: 1.0,
        pixelRatio: 3.125, // 300 DPI high resolution
        backgroundColor: "#0b0c13",
        skipFonts: true, // Prevents external font fetch blockage in preview iframes
        cacheBust: true,
      }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("html-to-image capture timed out")), 9000),
      ),
    ]);
  } catch (primaryErr) {
    console.warn("Primary html-to-image capture failed, trying html2canvas fallback:", primaryErr);
  }

  // 2. Secondary Engine: html2canvas fallback
  if (!imgData) {
    try {
      const canvas = await html2canvas(element, {
        scale: 3, // 300 DPI quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0b0c11",
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

  // Compute exact image dimensions
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

  // 3. High-Resolution A4 Portrait PDF (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  // Margin calculation to ensure crisp placement without clipping
  const marginX = 10;
  const marginY = 14;
  const maxContentWidth = pageWidth - marginX * 2; // 190 mm
  const maxContentHeight = pageHeight - marginY * 2; // 269 mm

  const aspectRatio = naturalHeight / naturalWidth;
  let renderWidth = maxContentWidth;
  let renderHeight = renderWidth * aspectRatio;

  if (renderHeight > maxContentHeight) {
    renderHeight = maxContentHeight;
    renderWidth = renderHeight / aspectRatio;
  }

  // Center horizontally and vertically on A4 Portrait page
  const posX = (pageWidth - renderWidth) / 2;
  const posY = (pageHeight - renderHeight) / 2;

  pdf.addImage(imgData, "PNG", posX, posY, renderWidth, renderHeight, undefined, "FAST");

  const pdfBase64 = pdf.output("datauristring");
  const blob = pdf.output("blob");

  // Requested format: Facetube_Certificate_FT######.pdf
  const defaultUserId = options?.userId || "FT483921";
  const formattedUserId = defaultUserId.startsWith("FT") ? defaultUserId : `FT${defaultUserId}`;
  const filename = options?.filename || `Facetube_Certificate_${formattedUserId}.pdf`;

  const download = () => {
    try {
      // Primary: standard jsPDF save
      pdf.save(filename);
    } catch (saveErr) {
      console.warn("pdf.save fallback to programmatic anchor download:", saveErr);
      // Secondary: HTML5 blob anchor click
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

export function printCertificateElement(element: HTMLElement) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join("\n");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Certificate — FaceTube</title>
        ${styles}
        <style>
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #0b0c11 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cert-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100vw;
            height: 100vh;
            padding: 20px;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          ${element.outerHTML}
        </div>
        <script>
          setTimeout(() => {
            window.focus();
            window.print();
            window.close();
          }, 600);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
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

/**
 * Automatically triggers the certificate email when a new rank is achieved
 */
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
    return false; // Already notified for this rank milestone
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
