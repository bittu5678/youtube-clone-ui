import { Logo } from "./Logo";

export function Footer() {
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
        </ul>
        <p className="text-sm text-muted-foreground">© 2026 Facetube</p>
      </div>
    </footer>
  );
}
