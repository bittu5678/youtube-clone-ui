import {
  Home,
  Compass,
  Clapperboard,
  History,
  Clock,
  ThumbsUp,
  Video,
  Settings,
  CircleHelp,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";

const items = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Explore", icon: Compass, to: "/explore" },
  { label: "Subscriptions", icon: Clapperboard, to: "/subscriptions" },
  { label: "History", icon: History, to: "/history" },
  { label: "Watch Later", icon: Clock, to: "/watch-later" },
  { label: "Liked Videos", icon: ThumbsUp, to: "/liked-videos" },
  { label: "Your Videos", icon: Video, to: "/your-videos" },
  { label: "Settings", icon: Settings, to: "/settings" },
  { label: "Help", icon: CircleHelp, to: "/help" },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav className="flex flex-col gap-1 p-3">
      {isAdmin && (
        <Link
          to="/admin"
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
            currentPath === "/admin"
              ? "bg-brand text-white shadow-lift font-bold"
              : "bg-brand/10 text-brand hover:bg-brand/20"
          }`}
        >
          <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate">Admin Portal</span>
        </Link>
      )}

      {items.map(({ label, icon: Icon, to }) => {
        const active =
          to === "/" ? currentPath === "/" : currentPath === to || currentPath.startsWith(to + "/");
        return (
          <Link
            key={label}
            to={to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
              active
                ? "bg-brand text-white shadow-sm font-bold"
                : "text-foreground/80 hover:translate-x-0.5 hover:bg-secondary hover:text-foreground font-medium"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${active ? "text-white stroke-[2.4]" : ""}`}
            />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  open,
  drawerOpen,
  onClose,
}: {
  open: boolean;
  drawerOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Desktop rail */}
      <aside
        className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-border bg-background transition-[width] duration-300 lg:block ${
          open ? "w-60" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <NavList />
        <div className="px-6 pb-8 text-xs leading-relaxed text-muted-foreground">
          <p>About · Terms · Privacy</p>
          <p className="mt-2">© 2026 FaceTube</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 w-64 bg-background shadow-2xl transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Logo size={30} />
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavList onNavigate={onClose} />
        </div>
      </div>
    </>
  );
}
