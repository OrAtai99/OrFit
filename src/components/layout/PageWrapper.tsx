import Link from "next/link";
import { Settings } from "lucide-react";
import BottomNav from "./BottomNav";

interface PageWrapperProps {
  title?: string;
  children: React.ReactNode;
  showNav?: boolean;
}

export default function PageWrapper({
  title,
  children,
  showNav = true,
}: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {title && (
        <header className="sticky top-0 z-40 bg-[var(--card)]/90 glass border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-[var(--foreground)]">{title}</h1>
          <Link
            href="/settings"
            className="text-muted hover:text-primary p-2 -m-2 transition-colors"
            aria-label="הגדרות"
          >
            <Settings size={20} />
          </Link>
        </header>
      )}
      <main className={`flex-1 p-4 fade-in ${showNav ? "pb-24" : ""}`}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
