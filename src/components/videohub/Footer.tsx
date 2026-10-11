import { Sparkles } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  const handleReplaySplash = () => {
    window.dispatchEvent(new CustomEvent("facetube:replay-splash"));
  };

  return (
    <footer className="mt-16 border-t border-border py-10">
      <div className="grid gap-6 sm:flex sm:items-center sm:justify-between">
        <Logo size={28} />
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["About", "Terms", "Privacy", "Contact"].map((l) => (
            <li key={l}>
              <a href="#" className="transition-colors hover:text-brand">
                {l}
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={handleReplaySplash}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80 hover:text-brand transition-colors cursor-pointer"
              title="Replay animated FaceTube splash screen"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              Replay Intro
            </button>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">© 2026 FaceTube</p>
      </div>
    </footer>
  );
}
