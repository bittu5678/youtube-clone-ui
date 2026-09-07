import { useState, type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface VideoHubLayoutProps {
  children: ReactNode;
  query?: string;
  onQueryChange?: (val: string) => void;
  showCategoryChips?: boolean;
}

export function VideoHubLayout({ children, query, onQueryChange }: VideoHubLayoutProps) {
  const [railOpen, setRailOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar
        onToggleSidebar={() => {
          setRailOpen((v) => !v);
          setDrawerOpen((v) => !v);
        }}
        query={query}
        onQueryChange={onQueryChange}
      />

      <div className="flex">
        {/* Left Sidebar (Fixed on Desktop, Drawer on Mobile) */}
        <Sidebar open={railOpen} drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 pb-24 lg:pb-12">{children}</main>
      </div>

      {/* Fixed Bottom Navigation (5 tabs: Home, Shorts, +, Live, You) */}
      <BottomNav />
    </div>
  );
}
