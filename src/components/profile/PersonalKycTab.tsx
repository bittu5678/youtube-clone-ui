import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Building,
  Navigation,
  Hash,
  Users,
  HeartHandshake,
  CheckCircle2,
  Save,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { PersonalKyc, PersonalKycFormData } from "@/types/kyc";
import { getPersonalKyc, savePersonalKyc } from "@/lib/kyc-service";

interface PersonalKycTabProps {
  userId: string;
  defaultFullName?: string;
  defaultMobile?: string;
}

export function PersonalKycTab({ userId, defaultFullName, defaultMobile }: PersonalKycTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kycData, setKycData] = useState<PersonalKyc | null>(null);

  const [formData, setFormData] = useState<PersonalKycFormData>({
    fullName: defaultFullName || "",
    mobile: defaultMobile || "",
    dob: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    nomineeName: "",
    nomineeRelation: "Spouse",
    nomineeMobile: "",
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const userDefaults: { fullName?: string; mobile?: string } = {};
        if (defaultFullName !== undefined) {
          userDefaults.fullName = defaultFullName;
        }
        if (defaultMobile !== undefined) {
          userDefaults.mobile = defaultMobile;
        }
        const data = await getPersonalKyc(userId, userDefaults);
        if (isMounted) {
          setKycData(data);
          setFormData({
            fullName: data.fullName || defaultFullName || "",
            mobile: data.mobile || defaultMobile || "",
            dob: data.dob || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",
            nomineeName: data.nomineeName || "",
            nomineeRelation: data.nomineeRelation || "Spouse",
            nomineeMobile: data.nomineeMobile || "",
          });
        }
      } catch (err) {
        console.error("Failed loading Personal KYC:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [userId, defaultFullName, defaultMobile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!formData.mobile.trim()) {
      toast.error("Please enter your mobile number.");
      return;
    }

    setSaving(true);
    try {
      const res = await savePersonalKyc(userId, formData);
      if (res.success) {
        setKycData(res.data);
        toast.success("Personal KYC details saved successfully in database!");
      } else {
        toast.error(res.error || "Failed to save Personal KYC.");
      }
    } catch (err) {
      toast.error("An error occurred while saving KYC.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-brand mr-2" />
        <span className="text-xs font-medium">Loading Personal KYC record...</span>
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
              <User className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground">Personal KYC Verification</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Complete your personal identity profile and nominee details for seamless withdrawals and
            compliance.
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
        {/* Section 1: Personal Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-brand" />
            1. Applicant Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Full Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Alex Rivera"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Mobile Number <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g. +1 555-014-8392"
                  required
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">City</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco"
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">State</label>
              <div className="relative">
                <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. California"
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* PIN Code */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">PIN Code</label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 94107"
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* Full Address */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Full Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Apartment, Street address, Landmark..."
                className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Nominee Details */}
        <div className="pt-4 border-t border-border/70">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-purple-400" />
            2. Nominee Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Nominee Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Nominee Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="nomineeName"
                  value={formData.nomineeName}
                  onChange={handleChange}
                  placeholder="e.g. Elena Rivera"
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Nominee Relation */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Nominee Relation
              </label>
              <div className="relative">
                <HeartHandshake className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  name="nomineeRelation"
                  value={formData.nomineeRelation}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Nominee Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Nominee Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  name="nomineeMobile"
                  value={formData.nomineeMobile}
                  onChange={handleChange}
                  placeholder="e.g. +1 555-014-9921"
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            🔒 All personal information is encrypted and stored securely according to compliance
            standards.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving KYC...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save KYC
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
