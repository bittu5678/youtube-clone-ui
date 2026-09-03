import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Radio, Plus, User } from "lucide-react";
import { useState } from "react";
import { ShortsIcon } from "./ShortsIcon";
import { UploadOptionsModal } from "./UploadOptionsModal";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, profile } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const isHomeActive = currentPath === "/";
  const isShortsActive = currentPath.startsWith("/shorts");
  const isLiveActive = currentPath.startsWith("/live");
  const isYouActive = currentPath.startsWith("/profile") || currentPath.startsWith("/auth");
  const isUploadActive = currentPath.startsWith("/upload") || uploadModalOpen;

  return (
    <>
      <nav
        aria-label="Bottom Navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[480px] md:max-w-xl md:rounded-2xl md:border md:border-border/80 md:bg-card/90 md:shadow-2xl md:backdrop-blur-xl md:px-3 md:py-1"
      >
        <ul className="grid grid-cols-5 items-center justify-items-center h-14 md:h-13">
          {/* 1. Home (House icon) */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              className={`flex w-full flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition active:scale-95 ${
                isHomeActive
                  ? "text-brand font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Home className={`h-5 w-5 ${isHomeActive ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
              </div>
              <span>Home</span>
            </Link>
          </li>

          {/* 2. Shorts (Shorts icon) */}
          <li className="w-full flex justify-center">
            <Link
              to="/shorts"
              className={`flex w-full flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition active:scale-95 ${
                isShortsActive
                  ? "text-brand font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <ShortsIcon className="h-5 w-5" active={isShortsActive} />
              </div>
              <span>Shorts</span>
            </Link>
          </li>

          {/* 3. Upload (Large center + button) */}
          <li className="w-full flex justify-center">
            <button
              type="button"
              aria-label="Upload Options"
              onClick={() => setUploadModalOpen(true)}
              className="group relative -mt-2.5 md:-mt-1 flex flex-col items-center justify-center focus-visible:outline-none"
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-full border-2 transition-all duration-200 shadow-md group-hover:scale-105 active:scale-95 ${
                  isUploadActive
                    ? "bg-brand text-white border-brand shadow-brand/20 ring-4 ring-brand/20"
                    : "bg-secondary text-foreground border-border/80 hover:border-brand/60 hover:text-brand"
                }`}
              >
                <Plus className="h-6 w-6 stroke-[2.4]" />
              </div>
              <span className="sr-only">Upload</span>
            </button>
          </li>

          {/* 4. Live (Live icon) */}
          <li className="w-full flex justify-center">
            <Link
              to="/live"
              className={`flex w-full flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition active:scale-95 ${
                isLiveActive
                  ? "text-brand font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Radio
                  className={`h-5 w-5 ${isLiveActive ? "stroke-[2.4] text-red-500" : "stroke-[1.8]"}`}
                />
                <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <span>Live</span>
            </Link>
          </li>

          {/* 5. You (Profile icon) */}
          <li className="w-full flex justify-center">
            <Link
              to="/profile"
              className={`flex w-full flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition active:scale-95 ${
                isYouActive
                  ? "text-brand font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                {user ? (
                  <div
                    className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white transition ${
                      isYouActive
                        ? "ring-2 ring-brand bg-gradient-to-br from-brand to-brand-dark"
                        : "bg-gradient-to-br from-brand to-brand-dark"
                    }`}
                  >
                    {(profile?.username || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <User className={`h-5 w-5 ${isYouActive ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
                )}
              </div>
              <span>You</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Upload Options Dialog Modal / Sheet */}
      <UploadOptionsModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
    </>
  );
}
