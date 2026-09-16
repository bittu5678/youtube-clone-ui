import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Gift,
  ArrowLeft,
  Check,
  AlertCircle,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Sparkles,
  Inbox,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/videohub/Logo";
import { ThemeToggle } from "@/components/videohub/ThemeToggle";
import { FacetubeLogoIcon } from "@/components/videohub/FacetubeLogoIcon";
import { useAuth } from "@/lib/auth-context";
import { generateWelcomeEmailContent } from "@/lib/email-service";
import type { DbUser } from "@/types/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Create Account — FaceTube" },
      {
        name: "description",
        content:
          "Sign in to FaceTube with your FT User ID or Email, or create an account with instant FT ID generation.",
      },
      { property: "og:title", content: "Sign in or Create Account — FaceTube" },
      {
        property: "og:description",
        content: "Access your FaceTube feed, subscriptions and watch history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const perks = [
  "Automatic unique FT User ID generation (e.g. FT102857)",
  "Seamless login using either User ID or Email",
  "Personalised recommendations and creator subscriptions",
  "Database-backed profile with welcome email dispatch",
];

function Field({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail }) {
  return (
    <label className="group flex h-12 items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 transition focus-within:border-brand/50 focus-within:bg-background focus-within:shadow-lift">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition group-focus-within:text-brand" />
      <input
        {...props}
        className="h-full w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, signIn, signUp, signOut } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration Form fields
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Login Form fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Success Popup State
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<DbUser | null>(null);
  const [registeredUserId, setRegisteredUserId] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);

  // Email Viewer Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);

  const isSignup = mode === "signup";

  // Reset errors when toggling modes
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [mode]);

  const handleCopyUserId = (idToCopy: string) => {
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    toast.success("User ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isSignup) {
      // 1. Validate all fields
      if (!fullName.trim()) {
        setErrorMsg("Please enter your Full Name.");
        return;
      }
      if (fullName.trim().length < 2) {
        setErrorMsg("Full Name must be at least 2 characters long.");
        return;
      }

      if (!mobile.trim()) {
        setErrorMsg("Please enter your Mobile Number.");
        return;
      }
      // Mobile validation: digits, spaces, plus, hyphens (minimum 7 characters)
      const cleanMobile = mobile.replace(/[^0-9+]/g, "");
      if (cleanMobile.length < 7) {
        setErrorMsg("Please enter a valid Mobile Number (at least 7 digits).");
        return;
      }

      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }

      if (!password) {
        setErrorMsg("Please enter a password.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please verify your confirm password.");
        return;
      }

      setSubmitting(true);
      const res = await signUp({
        name: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });
      setSubmitting(false);

      if (!res.success || !res.userId) {
        setErrorMsg(res.error?.message || "Failed to create account. Please try again.");
      } else {
        // Registration Flow Step 5: Show popup
        setRegisteredUserId(res.userId);
        if (res.user) setRegisteredUser(res.user);
        setShowSuccessPopup(true);
        setSuccessMsg(`Registration successful! Generated User ID: ${res.userId}`);

        // Pre-fill login identifier for ease of use
        setLoginIdentifier(res.userId);
        setLoginPassword(password);
      }
    } else {
      // Validate login fields
      if (!loginIdentifier.trim()) {
        setErrorMsg("Please enter your User ID (e.g. FT123456) or Email.");
        return;
      }
      if (!loginPassword) {
        setErrorMsg("Please enter your password.");
        return;
      }

      setSubmitting(true);
      const res = await signIn({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });
      setSubmitting(false);

      if (!res.success) {
        setErrorMsg(
          res.error?.message ||
            "Invalid credentials. Please verify your User ID / Email and password.",
        );
      } else {
        setSuccessMsg("Signed in successfully! Redirecting to feed...");
        toast.success("Welcome back to FaceTube!");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 800);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left Marketing Banner */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand via-brand-dark to-black p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/30 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <FacetubeLogoIcon size={44} className="drop-shadow-lg" />
          <span className="text-xl font-extrabold tracking-tight text-white">FaceTube</span>
        </div>

        <div className="relative max-w-md">
          <div className="mb-6 drop-shadow-2xl">
            <FacetubeLogoIcon size={96} />
          </div>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
            Every story worth watching, in one hub.
          </h2>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-white/85">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15">
                  <Check className="h-3 w-3 text-white" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © 2026 FaceTube. Database-backed streaming platform with Supabase PostgreSQL.
        </p>
      </aside>

      {/* Right Form Area */}
      <main className="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to FaceTube
            </Link>
            <ThemeToggle showLabelsOnWide={false} />
          </div>

          <div className="mb-8 lg:hidden">
            <Logo size={40} />
          </div>

          {/* If already logged in, show current session status */}
          {user ? (
            <div className="rounded-2xl border border-border bg-secondary/40 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-base font-bold text-brand-foreground shadow-sm">
                  {profile?.name
                    ? profile.name.substring(0, 2).toUpperCase()
                    : profile?.user_id
                      ? profile.user_id.substring(0, 2)
                      : "FT"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold truncate">
                      {profile?.name || user.email?.split("@")[0]}
                    </h2>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                        isAdmin
                          ? "bg-brand text-brand-foreground shadow-sm"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {role}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-semibold text-brand">
                    User ID: {profile?.user_id || "FT102857"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  to="/"
                  className="grid h-11 place-items-center rounded-xl bg-brand text-sm font-bold text-brand-foreground shadow-lift transition hover:bg-brand-dark"
                >
                  Go to Feed
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-secondary"
                  >
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    Open Admin Panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    toast.success("Signed out successfully.");
                  }}
                  className="h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {isSignup ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isSignup
                  ? "Register now to get your unique FT User ID and start streaming."
                  : "Sign in using your FT User ID or Email to continue."}
              </p>

              {/* Mode switch */}
              <div className="mt-7 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-full py-2 text-sm font-semibold transition ${
                      mode === m
                        ? "bg-background text-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "login" ? "Sign in" : "Sign up"}
                  </button>
                ))}
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-green-500/30 bg-green-500/10 p-3.5 text-sm text-green-600 dark:text-green-400">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
                {isSignup ? (
                  <>
                    {/* 1. Full Name */}
                    <div>
                      <Field
                        icon={UserIcon}
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>

                    {/* 2. Mobile Number */}
                    <div>
                      <Field
                        icon={Phone}
                        type="tel"
                        placeholder="Mobile Number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        autoComplete="tel"
                      />
                    </div>

                    {/* 3. Email */}
                    <div>
                      <Field
                        icon={Mail}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>

                    {/* 4. Password */}
                    <div className="relative">
                      <Field
                        icon={Lock}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* 5. Confirm Password */}
                    <div className="relative">
                      <Field
                        icon={Lock}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* 6. Referral Code (Optional) */}
                    <div>
                      <Field
                        icon={Gift}
                        type="text"
                        placeholder="Referral Code (Optional)"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Login Identifier (User ID e.g. FT123456 OR Email) */}
                    <div>
                      <Field
                        icon={UserIcon}
                        type="text"
                        placeholder="User ID (FT123456) or Email"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        required
                        autoComplete="username"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground px-1">
                        Tip: You can log in using your <strong>FT User ID</strong> (e.g. FT102857)
                        or your <strong>Email</strong>.
                      </p>
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Field
                        icon={Lock}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-1 text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 accent-current text-brand rounded"
                    />
                    {isSignup ? "I agree to the Terms & Privacy" : "Remember me"}
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier("FT102857");
                        setLoginPassword("password123");
                        toast.info("Filled Admin User ID & Demo Password");
                      }}
                      className="font-medium text-brand hover:underline"
                    >
                      Fill Admin Demo (FT102857)
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-12 w-full rounded-xl bg-brand text-sm font-bold text-brand-foreground shadow-lift transition hover:bg-brand-dark active:scale-[0.99] disabled:opacity-50"
                >
                  {submitting
                    ? isSignup
                      ? "Creating account..."
                      : "Signing in..."
                    : isSignup
                      ? "Create Account"
                      : "Sign in"}
                </button>
              </form>

              {/* Fast Demo Credentials helper */}
              {!isSignup && (
                <div className="mt-4 rounded-xl border border-border/70 bg-secondary/30 p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">
                    Quick Demo Accounts (Database Seeded):
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier("FT102857");
                        setLoginPassword("password123");
                      }}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-left hover:border-brand/40"
                    >
                      <span className="font-bold text-brand block">Admin: FT102857</span>
                      <span className="truncate block opacity-80">admin@facetube.com</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier("FT483921");
                        setLoginPassword("password123");
                      }}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-left hover:border-brand/40"
                    >
                      <span className="font-bold text-brand block">Alex: FT483921</span>
                      <span className="truncate block opacity-80">alex@facetube.com</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or continue with
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["Google", "Apple"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setLoginIdentifier(p === "Google" ? "FT102857" : "FT483921");
                      setLoginPassword("password123");
                    }}
                    className="h-11 rounded-xl border border-border text-sm font-semibold text-foreground transition hover:border-brand/40 hover:bg-secondary"
                  >
                    {p} (Demo)
                  </button>
                ))}
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                {isSignup ? "Already have an account?" : "New to FaceTube?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(isSignup ? "login" : "signup")}
                  className="font-semibold text-brand hover:underline"
                >
                  {isSignup ? "Sign in" : "Create one free"}
                </button>
              </p>
            </>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* Registration Successful Popup Modal (Matches Exact User Specification)     */}
      {/* ========================================================================= */}
      {showSuccessPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 sm:p-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Icon */}
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand/15 text-brand shadow-inner">
              <CheckCircle2 className="h-9 w-9 text-brand" />
            </div>

            {/* Title & Body */}
            <div className="mt-4 text-center">
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                Registration Successful!
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your account has been securely saved into the database.
              </p>
            </div>

            {/* Big User ID Display Card */}
            <div className="mt-6 rounded-2xl border-2 border-brand/30 bg-brand/5 p-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Your User ID
              </span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="font-mono text-3xl font-extrabold tracking-widest text-foreground">
                  {registeredUserId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUserId(registeredUserId)}
                  aria-label="Copy User ID"
                  className="rounded-xl border border-brand/30 bg-background p-2 text-brand transition hover:bg-brand hover:text-brand-foreground"
                >
                  {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs font-semibold text-foreground/90">
                You can login using your User ID or Email.
              </p>
            </div>

            {/* Stored User Details Summary */}
            {registeredUser && (
              <div className="mt-4 rounded-xl border border-border/80 bg-secondary/40 p-3.5 text-xs space-y-1.5 text-foreground/85">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium text-foreground">{registeredUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground">{registeredUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile:</span>
                  <span className="font-medium text-foreground">{registeredUser.mobile}</span>
                </div>
                {registeredUser.referral_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referral Code:</span>
                    <span className="font-medium text-brand">{registeredUser.referral_code}</span>
                  </div>
                )}
              </div>
            )}

            {/* Welcome Email Trigger Notice */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 shrink-0" />
                <span>Welcome email sent to {registeredUser?.email || email}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="font-bold underline hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                View Email
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessPopup(false);
                  setMode("login");
                  setLoginIdentifier(registeredUserId);
                }}
                className="grid h-12 place-items-center rounded-xl bg-brand text-sm font-bold text-brand-foreground shadow-lift transition hover:bg-brand-dark"
              >
                Log In Now with {registeredUserId}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessPopup(false);
                  navigate({ to: "/" });
                }}
                className="h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                Go to Home Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Welcome Email Inspection Modal (Demonstrates Sent Email Integration)       */}
      {/* ========================================================================= */}
      {showEmailModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowEmailModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-brand">
                <Inbox className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-base font-bold text-foreground">Welcome Email Preview</h4>
                <p className="text-xs text-muted-foreground">
                  Delivered upon successful registration
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 text-xs font-mono">
              <div className="border-b border-border/80 pb-2 mb-3 space-y-1">
                <p>
                  <strong className="text-muted-foreground">To:</strong>{" "}
                  <span className="text-foreground">{registeredUser?.email || email}</span>
                </p>
                <p>
                  <strong className="text-muted-foreground">Subject:</strong>{" "}
                  <span className="text-foreground font-semibold">Welcome to Facetube</span>
                </p>
              </div>

              <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                {
                  generateWelcomeEmailContent(
                    registeredUser?.name || fullName,
                    registeredUser?.email || email,
                    registeredUserId,
                  ).body
                }
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="rounded-xl bg-secondary px-5 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary/80"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
