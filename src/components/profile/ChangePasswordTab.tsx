import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function ChangePasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg("Current password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg("New password cannot be the same as your current password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message || "Password changed successfully.");
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = (res as any).error || "Failed to change password.";
        setErrorMsg(err);
        toast.error(err);
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to change password. Please check your current password.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Change Password</h3>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Update your account password. Passwords are securely hashed with BCRYPT and never stored
            in plaintext.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Encrypted</span>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-500">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Change Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Current Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="h-11 w-full rounded-xl border border-border bg-secondary/40 px-3.5 pr-10 text-sm text-foreground outline-none transition focus:border-brand/50 focus:bg-background"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            New Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="h-11 w-full rounded-xl border border-border bg-secondary/40 px-3.5 pr-10 text-sm text-foreground outline-none transition focus:border-brand/50 focus:bg-background"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Must be at least 6 characters and differ from current password.
          </p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Confirm New Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              className="h-11 w-full rounded-xl border border-border bg-secondary/40 px-3.5 pr-10 text-sm text-foreground outline-none transition focus:border-brand/50 focus:bg-background"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lift transition hover:bg-brand-dark active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
