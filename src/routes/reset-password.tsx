import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/videohub/Logo";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { api } from "@/lib/api";

export interface ResetPasswordSearch {
  token?: string | undefined;
  email?: string | undefined;
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search["token"] === "string" ? search["token"] : undefined,
    email: typeof search["email"] === "string" ? search["email"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset Password — FaceTube" },
      {
        name: "description",
        content: "Set a new secure password for your FaceTube creator account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const rawToken = searchParams["token"] || "";
  const email = searchParams["email"] || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isLinkIncomplete = !rawToken || !email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isLinkIncomplete) {
      setErrorMsg("Missing reset token or email address in the link.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.auth.resetPassword({
        email,
        token: rawToken,
        newPassword,
        confirmPassword,
      });

      if (res && res.success) {
        setSuccess(true);
        toast.success("Password reset successfully!");
      } else {
        const err = (res as any)?.error || "Failed to reset password. Link may be expired.";
        setErrorMsg(err);
        toast.error(err);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Network or server error while resetting password.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card space-y-6">
          {/* Brand Icon Header */}
          <div className="flex items-center gap-3 border-b border-border pb-5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Reset Your Password</h1>
              <p className="text-xs text-muted-foreground">Set a new password for your account</p>
            </div>
          </div>

          {/* Invalid Link State */}
          {isLinkIncomplete ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Invalid or Incomplete Link</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  This password reset link is missing required verification parameters. Please
                  request a new reset link from the login page.
                </p>
              </div>

              <Link
                to="/auth"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-xs font-bold text-brand-foreground shadow-lift transition hover:bg-brand-dark"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Sign In
              </Link>
            </div>
          ) : success ? (
            /* Success State */
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Password Reset Successfully!</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Your FaceTube account password has been updated. All active sessions have been
                  invalidated for security. You can now sign in with your new password.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Account Secured</span>
                </div>
                <p className="text-[11px]">
                  Encrypted using BCRYPT password hashing and single-use token verification.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate({ to: "/auth" })}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-xs font-bold text-brand-foreground shadow-lift transition hover:bg-brand-dark"
              >
                Sign In with New Password &rarr;
              </button>
            </div>
          ) : (
            /* Reset Password Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Identifier Badge */}
              <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs space-y-1">
                <span className="text-muted-foreground font-medium">Resetting account for:</span>
                <p className="font-mono font-semibold text-foreground truncate">{email}</p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  New Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    autoFocus
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/40 px-3.5 pr-10 text-sm text-foreground outline-none transition focus:border-brand/50 focus:bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Confirm New Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/40 px-3.5 pr-10 text-sm text-foreground outline-none transition focus:border-brand/50 focus:bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password criteria */}
              <div className="rounded-xl border border-border/70 bg-secondary/20 p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[9px] ${
                      newPassword.length >= 6
                        ? "bg-emerald-500/20 text-emerald-500 font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span>At least 6 characters long</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[9px] ${
                      confirmPassword && newPassword === confirmPassword
                        ? "bg-emerald-500/20 text-emerald-500 font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span>Passwords match</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-foreground shadow-lift transition hover:bg-brand-dark active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? "Resetting Password..." : "Update Password"}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/auth"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Cancel and return to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
