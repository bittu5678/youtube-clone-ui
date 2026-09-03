import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, PlusCircle, Clapperboard, User } from "lucide-react";

export function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const items = [
    { label: "Home", icon: Home, to: "/", active: currentPath === "/" },
    { label: "Explore", icon: Compass, to: "/", active: false },
    {
      label: "Create",
      icon: PlusCircle,
      to: "/upload",
      active: currentPath.startsWith("/upload"),
      isCenter: true,
    },
    { label: "Subs", icon: Clapperboard, to: "/", active: false },
    {
      label: "You",
      icon: User,
      to: "/auth",
      active: currentPath.startsWith("/auth") || currentPath.startsWith("/admin"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <ul className="grid grid-cols-5 items-center">
        {items.map(({ label, icon: Icon, to, active, isCenter }) => (
          <li key={label}>
            <Link
              to={to}
              className={`flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition active:scale-95 ${
                active ? "text-brand font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`relative ${isCenter ? "text-brand" : ""}`}>
                <Icon className={isCenter ? "h-6 w-6 stroke-[2.2]" : "h-5 w-5"} />
              </div>
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
