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
        <header className="sticky top-0 z-40 bg-[var(--card)] border-b border-[var(--border)] px-4 py-3">
          <h1 className="text-lg font-bold text-[var(--foreground)]">{title}</h1>
        </header>
      )}
      <main className={`flex-1 p-4 ${showNav ? "pb-24" : ""}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
