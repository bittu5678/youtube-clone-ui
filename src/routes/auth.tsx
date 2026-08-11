import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/videohub/Logo";
import logo from "@/assets/videohub-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Create Account — VideoHub" },
      {
        name: "description",
        content:
          "Sign in to VideoHub or create a free account to save videos, follow creators and pick up where you left off.",
      },
      { property: "og:title", content: "Sign in or Create Account — VideoHub" },
      {
        property: "og:description",
        content: "Access your VideoHub feed, subscriptions and watch history.",
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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";

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
          <img
            src={logo.url}
            alt="VideoHub logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain drop-shadow-lg"
          />
          <span className="text-xl font-extrabold tracking-tight text-white">VideoHub</span>
        </div>

        <div className="relative max-w-md">
          <img
            src={logo.url}
            alt=""
            aria-hidden
            width={96}
            height={96}
            className="mb-6 h-24 w-24 object-contain opacity-90 drop-shadow-2xl"
          />
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
          © 2026 VideoHub. Interface prototype — no data is stored.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to VideoHub
          </Link>

          <div className="mb-8 lg:hidden">
            <Logo size={40} />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Join millions of viewers and creators on VideoHub."
              : "Sign in to continue watching where you left off."}
          </p>

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

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {isSignup && (
              <Field icon={User} type="text" placeholder="Full name" autoComplete="name" />
            )}
            <Field icon={Mail} type="email" placeholder="you@example.com" autoComplete="email" />

            <div className="relative">
              <Field
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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

            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="h-4 w-4 accent-current text-brand" />
                {isSignup ? "I agree to the terms" : "Remember me"}
              </label>
              {!isSignup && (
                <button type="button" className="font-medium text-brand hover:underline">
                  Forgot password?
                </button>
              )}
            </div>

            <button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-brand text-sm font-bold text-brand-foreground shadow-lift transition hover:bg-brand-dark active:scale-[0.99]"
            >
              {isSignup ? "Create account" : "Sign in"}
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
                className="h-11 rounded-xl border border-border text-sm font-semibold text-foreground transition hover:border-brand/40 hover:bg-secondary"
              >
                {p}
              </button>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "New to VideoHub?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isSignup ? "login" : "signup")}
              className="font-semibold text-brand hover:underline"
            >
              {isSignup ? "Sign in" : "Create one free"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}