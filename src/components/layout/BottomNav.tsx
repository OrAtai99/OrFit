"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scale, Dumbbell, Apple, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "בית", icon: Home },
  { href: "/weight", label: "שקילה", icon: Scale },
  { href: "/workouts", label: "אימונים", icon: Dumbbell },
  { href: "/nutrition", label: "תזונה", icon: Apple },
  { href: "/coach", label: "מאמן AI", icon: Sparkles },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50 bg-[var(--card)]/90 glass border-t border-[var(--border)] safe-bottom">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors ${
                active ? "text-primary" : "text-muted hover:text-[var(--foreground)]"
              }`}
            >
              {active && (
                <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
