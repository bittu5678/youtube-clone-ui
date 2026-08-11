import { Menu, Search, Mic, Plus, Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Navbar({
  onToggleSidebar,
  query,
  onQueryChange,
}: {
  onToggleSidebar: () => void;
  query?: string;
  onQueryChange?: (value: string) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-5">
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={onToggleSidebar}
          className="rounded-full p-2 text-foreground/80 transition hover:bg-secondary active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Logo />

        <div className="mx-auto hidden w-full max-w-xl items-center gap-2 md:flex">
          <div className="group flex h-10 w-full items-center rounded-full border border-border bg-secondary/60 pl-4 pr-1 transition focus-within:border-brand/50 focus-within:bg-background focus-within:shadow-lift">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search videos, creators, topics…"
              value={query ?? ""}
              onChange={(e) => onQueryChange?.(e.target.value)}
              className="h-full w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              aria-label="Search"
              className="grid h-8 w-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand-dark"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            aria-label="Search with voice"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-foreground/80 transition hover:bg-brand/10 hover:text-brand"
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Search"
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-secondary md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lift transition hover:bg-brand-dark active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-secondary"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-background" />
          </button>
          <button
            type="button"
            aria-label="Your profile"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-brand-foreground ring-2 ring-transparent transition hover:ring-brand/30"
          >
            AK
          </button>
          <Link
            to="/auth"
            className="hidden rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:text-brand sm:block"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}