"use client";

import { Flame, Apple, Footprints, Dumbbell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StreakCardProps {
  icon: LucideIcon;
  count: number;
  label: string;
  gradient: string;
}

function StreakCard({ icon: Icon, count, label, gradient }: StreakCardProps) {
  return (
    <div
      className="rounded-2xl p-3 text-white relative overflow-hidden"
      style={{ background: gradient }}
    >
      <div className="absolute -top-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <Icon size={18} />
          <span className="text-2xl">🔥</span>
        </div>
        <p className="text-2xl font-extrabold leading-none">{count}</p>
        <p className="text-[10px] text-white/90 mt-1 leading-tight">{label}</p>
      </div>
    </div>
  );
}

interface StreakCardsProps {
  proteinStreak: number;
  stepsStreak: number;
  workoutStreak: number;
  weighingStreak: number;
}

export function StreakCards({ proteinStreak, stepsStreak, workoutStreak, weighingStreak }: StreakCardsProps) {
  const items: StreakCardProps[] = [];
  if (proteinStreak >= 2)
    items.push({
      icon: Apple,
      count: proteinStreak,
      label: "ימים ביעד חלבון",
      gradient: "linear-gradient(135deg, #f97316, #c2410c)",
    });
  if (workoutStreak >= 2)
    items.push({
      icon: Dumbbell,
      count: workoutStreak,
      label: "אימונים ברצף",
      gradient: "linear-gradient(135deg, #2563a8, #1F4E78)",
    });
  if (stepsStreak >= 3)
    items.push({
      icon: Footprints,
      count: stepsStreak,
      label: "ימים מעל 10K צעדים",
      gradient: "linear-gradient(135deg, #db2777, #be185d)",
    });
  if (weighingStreak >= 3)
    items.push({
      icon: Flame,
      count: weighingStreak,
      label: "ימי שקילה ברצף",
      gradient: "linear-gradient(135deg, #16a34a, #047857)",
    });

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((s, i) => (
        <StreakCard key={i} {...s} />
      ))}
    </div>
  );
}
