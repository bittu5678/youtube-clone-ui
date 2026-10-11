import { api } from "./api";
import { distributePremiumVideoIncome, getUserWallet } from "./ledger-service";
import {
  recordNewVideoUpload,
  markVideoPromoted,
  type VideoType,
  type ContentType,
} from "./video-service";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayPaymentSuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature?: string;
}

/**
 * Dynamically loads Razorpay checkout script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface InitiatePremiumVideoPaymentParams {
  userId?: string;
  uploaderUserId?: string;
  userName?: string;
  uploaderName?: string;
  userEmail?: string;
  userMobile?: string;
  title?: string;
  videoTitle?: string;
  description?: string;
  videoId?: string;
  videoType?: VideoType;
  contentType: ContentType; // "short" | "long"
  directReferrerId?: string | null;
  onSuccess: (paymentIdOrVideo: unknown) => void;
  onFailure: (errorMsg: string) => void;
  onCancel?: () => void;
}

/**
 * Initiates Razorpay payment flow for Premium Video Upload (₹6 total deduction)
 * Normal: ₹1 Direct Referral, ₹1 Admin, ₹3 Global Pool, ₹1 GST/PG
 * Special: ₹1 Direct Referral (if referrer), ₹4 Admin, ₹0 Global Pool
 */
export async function initiatePremiumVideoPayment(
  params: InitiatePremiumVideoPaymentParams,
): Promise<void> {
  const effectiveUserId = params.userId || params.uploaderUserId || "FT483921";
  const effectiveUserName = params.userName || params.uploaderName || "Alex Rivera";
  const effectiveTitle = params.title || params.videoTitle || "Untitled Premium Video";
  const effectiveDescription = params.description || "";
  const effectiveVideoId =
    params.videoId || `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  try {
    // 1. Create real Order via server API (fails closed if credentials missing)
    let orderData: {
      orderId: string;
      amount: number;
      amountInSubunits: number;
      currency: string;
      keyId: string;
    };

    try {
      const res = await api.payments.createOrder({
        purpose: "premium_video_upload",
        userId: effectiveUserId,
        userName: effectiveUserName,
        videoId: effectiveVideoId,
        contentType: params.contentType,
      });

      if (!res?.orderId || !res?.keyId) {
        throw new Error(
          (res as any)?.error ||
            "Server did not return a valid Razorpay order ID or Key ID. Please check server Razorpay configuration.",
        );
      }

      orderData = {
        orderId: res.orderId,
        amount: res.amount,
        amountInSubunits: res.amountInSubunits || Math.round(res.amount * 100),
        currency: res.currency,
        keyId: res.keyId,
      };
    } catch (orderErr: any) {
      params.onFailure(
        orderErr?.message ||
          "Could not create Razorpay payment order. Real Razorpay credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) must be configured in server environment.",
      );
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      params.onFailure(
        "Razorpay checkout SDK could not be loaded. Please check your internet connection.",
      );
      return;
    }

    // 2. Setup checkout handler
    const handlePaymentCompletion = async (
      paymentId: string,
      orderId: string,
      signature?: string,
    ) => {
      if (!signature) {
        params.onFailure(
          "Payment signature missing from Razorpay checkout response. Verification aborted.",
        );
        return;
      }

      try {
        // Server-side cryptographic HMAC & API verification
        const res = await api.payments.verify({
          orderId,
          paymentId,
          signature,
          userId: effectiveUserId,
          userName: effectiveUserName,
          videoId: effectiveVideoId,
          purpose: "premium_video_upload",
          referrerUserId: params.directReferrerId,
        });

        if (!res?.verified) {
          params.onFailure(res?.error || "Payment verification failed on the server.");
          return;
        }

        // 3. Save uploaded video with verified paid status
        const newVideo = await recordNewVideoUpload({
          userId: effectiveUserId,
          creatorName: effectiveUserName,
          title: effectiveTitle,
          description: effectiveDescription,
          videoType: "premium",
          contentType: params.contentType,
          paymentStatus: "paid",
          paymentId,
          paymentAmount: 6,
        });

        // 4. Update local ledger cache if not a duplicate
        if (!res.duplicate) {
          await distributePremiumVideoIncome({
            uploaderUserId: effectiveUserId,
            uploaderName: effectiveUserName,
            videoId: newVideo.id || effectiveVideoId,
            paymentId,
            txNumber: res.txNumber,
            directReferrerId: params.directReferrerId,
            isSpecialTransaction: res.isSpecialTransaction,
            specialTag: res.specialTag,
            adminAmount: res.distribution?.adminAmount,
          });
        }

        params.onSuccess(paymentId);
      } catch (err: any) {
        console.error("Error finalizing premium payment:", err);
        params.onFailure(err?.message || "Failed to complete payment verification on server.");
      }
    };

    const options: RazorpayOptions = {
      key: orderData.keyId,
      amount: orderData.amountInSubunits,
      currency: "INR",
      name: "FaceTube Creator Studio",
      description: `Premium ${params.contentType === "short" ? "Short" : "Long"} Video Upload (₹5 Base + 18% GST + 2% PG = ₹6 Total)`,
      image: "/favicon.ico",
      order_id: orderData.orderId,
      handler: (response) => {
        handlePaymentCompletion(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature,
        );
      },
      prefill: {
        name: params.userName,
        email: params.userEmail || `${params.userId.toLowerCase()}@facetube.app`,
        contact: params.userMobile || "9999999999",
      },
      theme: {
        color: "#e11d48", // Brand color
      },
      modal: {
        ondismiss: () => {
          if (params.onCancel) params.onCancel();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err: unknown) {
    console.error("Razorpay initiation error:", err);
    params.onFailure("Could not initiate payment gateway.");
  }
}

/**
 * Initiates Razorpay test payment flow for Ads Promotion
 * 7 Days = ₹100 | 15 Days = ₹200 | 1 Month = ₹300 | 1 Year = ₹30,000
 */
export async function initiateAdsPromotionPayment(params: {
  userId: string;
  userName: string;
  userEmail?: string;
  userMobile?: string;
  videoId: string;
  planId: "plan-7-days" | "plan-15-days" | "plan-monthly" | "plan-yearly";
  planName: string;
  durationDays: number;
  price: number;
  directReferrerId?: string | null;
  onSuccess: (result: unknown) => void;
  onFailure: (errorMsg: string) => void;
  onCancel?: () => void;
}): Promise<void> {
  try {
    let orderData: {
      orderId: string;
      amount: number;
      amountInSubunits: number;
      currency: string;
      keyId: string;
    };

    try {
      const res = await api.payments.createOrder({
        purpose: "ads_promotion",
        userId: params.userId,
        userName: params.userName,
        videoId: params.videoId,
        planId: params.planId,
      });

      if (!res?.orderId || !res?.keyId) {
        throw new Error(
          (res as any)?.error ||
            "Server did not return a valid Razorpay order ID or Key ID. Please check server Razorpay configuration.",
        );
      }

      orderData = {
        orderId: res.orderId,
        amount: res.amount,
        amountInSubunits: res.amountInSubunits || Math.round(res.amount * 100),
        currency: res.currency,
        keyId: res.keyId,
      };
    } catch (orderErr: any) {
      params.onFailure(
        orderErr?.message ||
          "Could not create Razorpay payment order. Real Razorpay credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) must be configured in server environment.",
      );
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      params.onFailure(
        "Razorpay checkout SDK could not be loaded. Please check your internet connection.",
      );
      return;
    }

    const handleAdsCompletion = async (paymentId: string, orderId: string, signature?: string) => {
      if (!signature) {
        params.onFailure(
          "Payment signature missing from Razorpay checkout response. Verification aborted.",
        );
        return;
      }

      try {
        const res = await api.payments.verify({
          orderId,
          paymentId,
          signature,
          userId: params.userId,
          purpose: "ads_promotion",
          referrerUserId: params.directReferrerId,
          metadata: { planId: params.planId },
        });

        if (!res?.verified) {
          params.onFailure(res?.error || "Payment verification failed on the server.");
          return;
        }

        // Activate promotion on video
        await markVideoPromoted({
          videoId: params.videoId,
          planId: params.planId,
          durationDays: params.durationDays,
          paymentId,
        });

        params.onSuccess({
          paymentId,
          orderId,
          planId: params.planId,
          days: params.durationDays,
          price: params.price,
        });
      } catch (err: any) {
        console.error("Error completing ads promotion:", err);
        params.onFailure(err?.message || "Could not activate promotion.");
      }
    };

    const options: RazorpayOptions = {
      key: orderData.keyId,
      amount: orderData.amountInSubunits,
      currency: "INR",
      name: "FaceTube Ads Promotions",
      description: `Promotion Campaign: ${params.planName} (₹${params.price})`,
      image: "/favicon.ico",
      order_id: orderData.orderId,
      handler: (response) => {
        handleAdsCompletion(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature,
        );
      },
      prefill: {
        name: params.userName,
        email: params.userEmail || `${params.userId.toLowerCase()}@facetube.app`,
        contact: params.userMobile || "9999999999",
      },
      theme: {
        color: "#10b981", // Emerald accent for ads promotion
      },
      modal: {
        ondismiss: () => {
          if (params.onCancel) params.onCancel();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err: any) {
    console.error("Ads promotion error:", err);
    params.onFailure(err?.message || "Could not initiate ads payment gateway.");
  }
}
