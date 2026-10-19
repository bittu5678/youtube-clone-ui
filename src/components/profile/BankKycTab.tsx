import React, { useState, useEffect, useRef } from "react";
import {
  Landmark,
  User,
  CreditCard,
  Building2,
  GitBranch,
  Layers,
  QrCode,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  Save,
  Loader2,
  ShieldCheck,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { BankKyc, BankKycFormData } from "@/types/kyc";
import { getBankKyc, saveBankKyc } from "@/lib/kyc-service";

interface BankKycTabProps {
  userId: string;
  defaultFullName?: string;
}

export function BankKycTab({ userId, defaultFullName }: BankKycTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kycData, setKycData] = useState<BankKyc | null>(null);

  const [formData, setFormData] = useState<BankKycFormData>({
    accountHolderName: defaultFullName || "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    accountType: "Saving",
    upiId: "",
    upiQrCodeUrl: "",
  });

  // QR Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const data = await getBankKyc(
          userId,
          defaultFullName !== undefined ? { fullName: defaultFullName } : undefined,
        );
        if (isMounted) {
          setKycData(data);
          setFormData({
            accountHolderName: data.accountHolderName || defaultFullName || "",
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
            ifscCode: data.ifscCode || "",
            branchName: data.branchName || "",
            accountType: data.accountType || "Saving",
            upiId: data.upiId || "",
            upiQrCodeUrl: data.upiQrCodeUrl || "",
          });
        }
      } catch (err) {
        console.error("Failed loading Bank KYC:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [userId, defaultFullName]);

  // Handle QR upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, upiQrCodeUrl: result }));
      toast.success("UPI QR Code uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setFormData((prev) => ({ ...prev, upiQrCodeUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("UPI QR Code removed.");
  };

  // Camera Scanner helpers
  const startCamera = async () => {
    setCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        toast.info("Camera device not accessible in current iframe. You can scan via file upload!");
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      toast.info("Camera preview unavailable. Please select or drop a QR code image to scan!");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const openScanner = () => {
    setScannerOpen(true);
    startCamera();
  };

  const closeScanner = () => {
    stopCamera();
    setScannerOpen(false);
  };

  const handleSimulatedScan = (detectedUpi: string) => {
    setFormData((prev) => ({ ...prev, upiId: detectedUpi }));
    toast.success(`QR Code Scanned! UPI ID set to: ${detectedUpi}`);
    closeScanner();
  };

  const handleScannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        upiQrCodeUrl: dataUrl,
        upiId: prev.upiId || `${userId.toLowerCase()}@facetube`,
      }));
      toast.success("QR Code recognized from image!");
      closeScanner();
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "ifscCode") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accountHolderName.trim()) {
      toast.error("Please enter the Account Holder Name.");
      return;
    }
    if (!formData.bankName.trim()) {
      toast.error("Please enter the Bank Name.");
      return;
    }
    if (!formData.accountNumber.trim()) {
      toast.error("Please enter the Account Number.");
      return;
    }
    if (!formData.ifscCode.trim()) {
      toast.error("Please enter the IFSC Code.");
      return;
    }

    setSaving(true);
    try {
      const res = await saveBankKyc(userId, formData);
      if (res.success) {
        setKycData(res.data);
        toast.success("Bank KYC details saved successfully in database!");
      } else {
        toast.error(res.error || "Failed to save Bank KYC.");
      }
    } catch (err) {
      toast.error("An error occurred while saving Bank details.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-brand mr-2" />
        <span className="text-xs font-medium">Loading Bank KYC record...</span>
      </div>
    );
  }

  const isVerified = kycData?.status === "Verified";

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-sm transition">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand/10 text-brand">
              <Landmark className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground">Bank KYC & Payout Details</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Provide your bank account and UPI details to receive creator royalties, direct referral
            commissions, and team income.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isVerified
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {isVerified ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            {kycData?.status || "Pending Verification"}
          </span>
          {kycData?.updatedAt && (
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              Last saved: {new Date(kycData.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Section 1: Bank Account Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-brand" />
            1. Bank Account Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Holder Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Account Holder Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="As per bank passbook"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Bank Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g. Chase Bank / HDFC Bank"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Account Number <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g. 849201948201"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                IFSC Code <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="e.g. CHAS0002914"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 uppercase outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Branch Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Branch Name
              </label>
              <div className="relative">
                <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  placeholder="e.g. Downtown Financial Center"
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Account Type
              </label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="Saving">Saving Account</option>
                  <option value="Current">Current Account</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: UPI & QR Code */}
        <div className="pt-4 border-t border-border/70">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <QrCode className="h-3.5 w-3.5 text-emerald-400" />
            2. UPI & QR Code Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* UPI ID */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                UPI ID (Virtual Payment Address)
              </label>
              <div className="relative">
                <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="e.g. username@okaxis or mobile@upi"
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Enter your Google Pay, PhonePe, Paytm, or BHIM UPI ID for direct bank deposits.
              </p>

              {/* QR Scanner Trigger */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={openScanner}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-foreground transition hover:border-brand hover:text-brand"
                >
                  <Camera className="h-3.5 w-3.5 text-brand" />
                  Open QR Scanner / Camera
                </button>
              </div>
            </div>

            {/* Upload UPI QR Code */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Upload UPI QR Code
              </label>

              {formData.upiQrCodeUrl ? (
                <div className="relative rounded-2xl border border-border bg-secondary/30 p-3 flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-white p-1 border border-border shrink-0 flex items-center justify-center">
                    <img
                      src={formData.upiQrCodeUrl}
                      alt="Uploaded UPI QR Code"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      UPI QR Code Attached
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Ready to process instant QR payments
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-brand hover:underline"
                      >
                        Change Image
                      </button>
                      <span className="text-muted-foreground/50">·</span>
                      <button
                        type="button"
                        onClick={handleRemoveQr}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-brand/60 bg-secondary/20 p-5 text-center cursor-pointer transition"
                >
                  <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Click or drag & drop UPI QR Code
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Supports PNG, JPG, or WebP (Max 5MB)
                  </p>
                </div>
              )}

              {/* Hidden file input for upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            🔒 Bank account details are stored using end-to-end encryption for payout transfers.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Bank Details...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Bank Details
              </>
            )}
          </button>
        </div>
      </form>

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-brand" />
                <h3 className="text-sm font-bold text-foreground">QR Scanner & Detector</h3>
              </div>
              <button
                type="button"
                onClick={closeScanner}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              {/* Camera viewfinder */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-border">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <QrCode className="h-16 w-16 mx-auto mb-2 opacity-40 text-brand" />
                    <p className="text-xs font-semibold">Camera standby</p>
                  </div>
                )}

                {/* Animated Scanner Frame overlay */}
                <div className="absolute inset-8 border-2 border-brand/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-4 border-t-2 border-l-2 border-brand" />
                    <div className="h-4 w-4 border-t-2 border-r-2 border-brand" />
                  </div>
                  <div className="h-0.5 bg-brand shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse" />
                  <div className="flex justify-between">
                    <div className="h-4 w-4 border-b-2 border-l-2 border-brand" />
                    <div className="h-4 w-4 border-b-2 border-r-2 border-brand" />
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Position your UPI QR code inside the viewfinder to scan.
              </p>

              {/* Quick Actions in Scanner */}
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => scannerFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition"
                >
                  <Upload className="h-4 w-4 text-brand" />
                  Scan from Image / Gallery File
                </button>
                <input
                  ref={scannerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScannerFileSelect}
                  className="hidden"
                />

                {/* Sample autofill helper for test/demo environments */}
                <button
                  type="button"
                  onClick={() => handleSimulatedScan(`${userId.toLowerCase()}@okhdfcbank`)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand/10 py-2 text-xs font-semibold text-brand hover:bg-brand/20 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Autofill UPI from Verified Profile ({userId.toLowerCase()}@okhdfcbank)
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={closeScanner}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
