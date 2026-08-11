import { Home, Compass, PlusCircle, Clapperboard, User } from "lucide-react";

const items = [
  { label: "Home", icon: Home, active: true },
  { label: "Explore", icon: Compass },
  { label: "Create", icon: PlusCircle },
  { label: "Subs", icon: Clapperboard },
  { label: "You", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ label, icon: Icon, active }) => (
          <li key={label}>
            <button
              type="button"
              className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-brand" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}