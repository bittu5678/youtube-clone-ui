import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowLeft,
  Check,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/videohub/Logo";
import { FacetubeLogoIcon } from "@/components/videohub/FacetubeLogoIcon";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Create Account — FaceTube" },
      {
        name: "description",
        content:
          "Sign in to FaceTube or create a free account to save videos, follow creators and pick up where you left off.",
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
  "Personalised recommendations across every device",
  "Save videos to watch later, offline-ready playlists",
  "Support creators with memberships and comments",
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
  const { user, profile, role, isAdmin, signIn, signUp, signOut, isLoading, isConfigured } =
    useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  // Reset errors when toggling modes
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isSignup) {
      // Validate signup fields
      if (!username.trim()) {
        setErrorMsg("Please enter a username.");
        return;
      }
      if (username.trim().length < 3) {
        setErrorMsg("Username must be at least 3 characters long.");
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
        setErrorMsg("Username can only contain letters, numbers, hyphens and underscores.");
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
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim() || username.trim(),
      });
      setSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.error?.message || "Failed to create account. Please try again.");
      } else {
        setSuccessMsg("Account created successfully! Profile has been set up.");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 1200);
      }
    } else {
      // Validate login fields
      if (!email.trim()) {
        setErrorMsg("Please enter your email or username.");
        return;
      }
      if (!password) {
        setErrorMsg("Please enter your password.");
        return;
      }

      setSubmitting(true);
      const res = await signIn({
        email: email.trim(),
        password,
      });
      setSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.error?.message || "Invalid credentials. Please try again.");
      } else {
        setSuccessMsg("Signed in successfully! Redirecting...");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 800);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground lg:grid lg:grid-cols-[1.05fr_1fr]">
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
          © 2026 FaceTube. Role-based streaming platform with Supabase authentication.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to FaceTube
          </Link>

          <div className="mb-8 lg:hidden">
            <Logo size={40} />
          </div>

          {/* If already logged in, show current session status */}
          {user ? (
            <div className="rounded-2xl border border-border bg-secondary/40 p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-base font-bold text-brand-foreground">
                  {profile?.username ? profile.username.substring(0, 2).toUpperCase() : "U"}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      @{profile?.username || user.email?.split("@")[0]}
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
                  <p className="text-sm text-muted-foreground">{user.email}</p>
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
                  ? "Join millions of viewers and creators on FaceTube."
                  : "Sign in to continue watching where you left off."}
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
                {isSignup && (
                  <>
                    <Field
                      icon={UserIcon}
                      type="text"
                      placeholder="Username (unique, e.g. alex_creator)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                    <Field
                      icon={UserIcon}
                      type="text"
                      placeholder="Full name (optional)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                  </>
                )}

                <Field
                  icon={Mail}
                  type="email"
                  placeholder={isSignup ? "Email address" : "Email or username"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <div className="relative">
                  <Field
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {isSignup && (
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
                )}

                <div className="flex items-center justify-between pt-1 text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 accent-current text-brand"
                    />
                    {isSignup ? "I agree to the Terms of Service" : "Remember me"}
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("admin@facetube.com");
                        setPassword("password123");
                      }}
                      className="font-medium text-brand hover:underline"
                    >
                      Fill Admin Demo
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
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>

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
                      setEmail(p === "Google" ? "admin@facetube.com" : "alex@facetube.com");
                      setPassword("password123");
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
    </div>
  );
}
