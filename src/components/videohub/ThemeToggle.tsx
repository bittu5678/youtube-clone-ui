import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "@/lib/theme-context";

interface ThemeToggleProps {
  className?: string;
  showLabelsOnWide?: boolean;
}

const themeOptions: {
  value: Theme;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Forced Light",
    shortLabel: "Light",
    description: "Force light appearance regardless of device",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Forced Dark",
    shortLabel: "Dark",
    description: "Force dark appearance regardless of device",
    icon: Moon,
  },
  {
    value: "system",
    label: "System Theme",
    shortLabel: "System",
    description: "Match device operating system appearance",
    icon: Laptop,
  },
];

export function ThemeToggle({ className = "", showLabelsOnWide = true }: ThemeToggleProps) {
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileMenuOpen]);

  // Current active icon for mobile toggle
  const ActiveIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Laptop;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* 
        Desktop / Tablet: 3-way Segmented Switch Pill
        Provides instant 1-click toggling between Light, Dark, and System modes
      */}
      <div
        role="radiogroup"
        aria-label="Theme selection"
        className="hidden items-center rounded-full border border-border bg-secondary/70 p-0.5 shadow-inner sm:inline-flex"
      >
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              title={`${opt.label}: ${opt.description}${
                opt.value === "system" ? ` (Currently: ${systemTheme})` : ""
              }`}
              onClick={() => setTheme(opt.value)}
              className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isSelected
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {showLabelsOnWide && (
                <span className="hidden xl:inline text-[11px] tracking-tight">
                  {opt.shortLabel}
                </span>
              )}
              {opt.value === "system" && isSelected && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-brand"
                  title={`System is active (${systemTheme} mode)`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 
        Mobile Compact Button & Dropdown Menu (<sm)
      */}
      <div className="relative sm:hidden" ref={menuRef}>
        <button
          type="button"
          aria-label={`Current theme: ${theme}. Click to switch theme.`}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-secondary active:scale-95"
          title={`Theme: ${theme === "system" ? `System (${resolvedTheme})` : theme}`}
        >
          <ActiveIcon className="h-5 w-5 text-foreground" />
          {theme === "system" && (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-background"
              title="Following system theme"
            />
          )}
        </button>

        {mobileMenuOpen && (
          <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="border-b border-border/70 px-3 py-2">
              <p className="text-xs font-bold text-foreground">Theme appearance</p>
              <p className="text-[11px] text-muted-foreground">
                Current:{" "}
                <span className="font-semibold capitalize text-foreground">
                  {theme === "system" ? `System (${resolvedTheme})` : theme}
                </span>
              </p>
            </div>

            <div className="py-1">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTheme(opt.value);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isSelected
                        ? "bg-brand/10 font-semibold text-brand"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="text-left">
                        <p>{opt.label}</p>
                        {opt.value === "system" && (
                          <p className="text-[10px] text-muted-foreground">
                            Matches device ({systemTheme})
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
