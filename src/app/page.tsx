"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import {
  daysRemaining,
  progressPercent,
  todayISO,
  isWorkoutDayByDate,
  weighingStreak,
  weeklyWeightDelta,
  predictedDaysToGoal,
  dayNameHe,
} from "@/lib/calculations";
import { getTodaySchedule, getNextWorkout } from "@/lib/exercises";
import { useState, useEffect } from "react";
import type { DailyWeight, NutritionLog, Workout } from "@/types";
import { Card, Badge } from "@/components/ui";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import {
  Flame,
  TrendingDown,
  TrendingUp,
  CalendarClock,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  Apple,
  Scale,
  ChevronLeft,
  Bed,
  Footprints,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TARGET = 87;
const START_WEIGHT = 96.8;
const TARGET_DATE = "2026-07-31";

const TYPE_LABELS = S.workouts.types;
const TYPE_ICONS: Record<string, LucideIcon> = {
  push: Dumbbell,
  pull: Dumbbell,
  legs: Dumbbell,
  upper: Dumbbell,
  walk: Footprints,
  rest: Bed,
};

export default function DashboardPage() {
  const [allWeights, setAllWeights] = useState<DailyWeight[]>([]);
  const [todayNutrition, setTodayNutrition] = useState<NutritionLog | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("daily_weight").select("*").order("date", { ascending: false }).limit(30),
      supabase.from("nutrition_log").select("*").eq("date", todayISO()).maybeSingle(),
      supabase.from("workouts").select("*").eq("date", todayISO()).maybeSingle(),
    ]).then(([w, n, wo]) => {
      if (w.data) setAllWeights(w.data);
      if (n.data) setTodayNutrition(n.data);
      if (wo.data) setTodayWorkout(wo.data);
      setLoaded(true);
    });
  }, []);

  const latestWeight = allWeights[0] ?? null;
  const todaySchedule = getTodaySchedule();
  const nextWorkout = getNextWorkout();
  const daysLeft = daysRemaining(TARGET_DATE);
  const progress = latestWeight ? progressPercent(START_WEIGHT, latestWeight.weight_kg, TARGET) : 0;
  const isWorkoutDay = isWorkoutDayByDate(todayISO());
  const protein = todayNutrition?.protein_g ?? 0;
  const calories = todayNutrition?.calories ?? 0;
  const proteinWarning = isWorkoutDay && loaded && todayNutrition !== null && protein > 0 && protein < 150;
  const streak = weighingStreak(allWeights.map((w) => w.date));
  const weekDelta = weeklyWeightDelta(allWeights);
  const etaDays = predictedDaysToGoal(allWeights, TARGET);
  const todayName = dayNameHe(todayISO());
  const TodayIcon = TYPE_ICONS[todaySchedule.type];
  const insight = buildInsight({ progress, weekDelta, streak, isWorkoutDay, protein, proteinWarning });

  return (
    <PageWrapper title={S.app.name}>
      <div className="space-y-4">
        <HeroProgress
          progress={progress}
          latest={latestWeight?.weight_kg ?? null}
          target={TARGET}
          start={START_WEIGHT}
          daysLeft={daysLeft}
          todayName={todayName}
        />

        <div className="flex flex-wrap gap-2">
          {streak > 0 && (
            <Badge variant="warning">
              <Flame size={12} /> {streak} {streak === 1 ? "יום" : "ימים"}
            </Badge>
          )}
          {weekDelta !== null && (
            <Badge variant={weekDelta < 0 ? "success" : weekDelta > 0 ? "danger" : "muted"}>
              {weekDelta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {Math.abs(weekDelta)} {S.common.kg} השבוע
            </Badge>
          )}
          {etaDays !== null && etaDays > 0 && (
            <Badge variant="primary">
              <CalendarClock size={12} /> {etaDays} ימים ליעד
            </Badge>
          )}
        </div>

        {insight && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-primary/80 font-semibold uppercase tracking-wider mb-1">תובנה</p>
                <p className="text-sm font-medium">{insight}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatLink
            href="/weight"
            label={S.dashboard.currentWeight}
            value={latestWeight ? String(latestWeight.weight_kg) : "—"}
            unit={S.common.kg}
            icon={Scale}
            tone="primary"
          />
          <StatLink
            href="/nutrition"
            label={S.dashboard.todayProtein}
            value={protein > 0 ? String(protein) : "—"}
            unit={S.common.g}
            icon={Apple}
            tone={proteinWarning ? "danger" : "success"}
          />
          <StatLink
            href="/nutrition"
            label={S.dashboard.todayCalories}
            value={calories > 0 ? String(calories) : "—"}
            unit={S.common.kcal}
            icon={Flame}
            tone="muted"
          />
          <StatLink
            href="/workouts"
            label={S.dashboard.daysLeft}
            value={String(daysLeft)}
            unit={S.common.days}
            icon={CalendarClock}
            tone="muted"
          />
        </div>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted uppercase tracking-wider font-semibold">{S.dashboard.todayWorkout}</p>
            {todayWorkout?.completed && (
              <Badge variant="success">
                <CheckCircle2 size={12} /> {S.dashboard.completed}
              </Badge>
            )}
          </div>
          <Link href="/workouts" className="flex items-center justify-between active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white">
                <TodayIcon size={22} />
              </div>
              <div>
                <p className="font-bold text-lg">{TYPE_LABELS[todaySchedule.type]}</p>
                <p className="text-xs text-muted">
                  {todaySchedule.time ?? "כל היום"} · {todaySchedule.dayName}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {nextWorkout && todaySchedule.type === "rest" && (
                <p className="text-xs text-muted text-left">
                  הבא: <span className="font-semibold text-[var(--foreground)]">{TYPE_LABELS[nextWorkout.type]}</span>
                  {" "}בעוד {nextWorkout.daysFromNow} ימים
                </p>
              )}
              <ChevronLeft size={18} className="text-muted" />
            </div>
          </Link>
        </Card>

        <CalendarWidget />

        {proteinWarning ? (
          <Card variant="danger" className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-danger shrink-0" />
            <p className="text-sm font-semibold text-danger">{S.redRules.proteinLow}</p>
          </Card>
        ) : (
          <Card variant="success" className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-success shrink-0" />
            <p className="text-sm font-semibold text-success">{S.redRules.allClear}</p>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

function HeroProgress({
  progress,
  latest,
  target,
  start,
  daysLeft,
  todayName,
}: {
  progress: number;
  latest: number | null;
  target: number;
  start: number;
  daysLeft: number;
  todayName: string;
}) {
  const RING_R = 56;
  const CIRC = 2 * Math.PI * RING_R;
  const dash = (progress / 100) * CIRC;
  const lost = latest !== null ? Math.max(0, start - latest) : 0;
  const remaining = latest !== null ? Math.max(0, latest - target) : start - target;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark text-white p-5 shadow-lg">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-center gap-4">
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={RING_R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
            <circle
              cx="70"
              cy="70"
              r={RING_R}
              fill="none"
              stroke="white"
              strokeWidth="9"
              strokeDasharray={`${dash} ${CIRC}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-extrabold">{progress}<span className="text-lg">%</span></p>
            <p className="text-[10px] uppercase tracking-widest text-white/70">{S.dashboard.target}</p>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-xs uppercase tracking-wider">{todayName}</p>
          <p className="font-bold text-lg leading-tight mb-3">
            {latest !== null ? `${latest} ${S.common.kg}` : "—"}
            <span className="text-white/60 mx-1.5">→</span>
            {target} {S.common.kg}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <p className="text-white/60 text-[10px]">ירדת</p>
              <p className="font-bold">{lost.toFixed(1)} {S.common.kg}</p>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <p className="text-white/60 text-[10px]">נותר</p>
              <p className="font-bold">{remaining.toFixed(1)} {S.common.kg}</p>
            </div>
          </div>
          <p className="text-[11px] text-white/70 mt-2">עוד {daysLeft} ימים ליעד</p>
        </div>
      </div>
    </div>
  );
}

function StatLink({
  href,
  label,
  value,
  unit,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  tone: "primary" | "success" | "danger" | "muted";
}) {
  const toneColor =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
      ? "text-success"
      : tone === "danger"
      ? "text-danger"
      : "text-[var(--foreground)]";
  const bg =
    tone === "primary"
      ? "bg-primary/10"
      : tone === "success"
      ? "bg-success/10"
      : tone === "danger"
      ? "bg-danger/10"
      : "bg-[var(--border)]/40";

  return (
    <Link
      href={href}
      className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted">{label}</p>
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={14} className={toneColor} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${toneColor}`}>
        {value}
        <span className="text-xs font-normal text-muted mr-1">{unit}</span>
      </p>
    </Link>
  );
}

function buildInsight({
  progress,
  weekDelta,
  streak,
  isWorkoutDay,
  protein,
  proteinWarning,
}: {
  progress: number;
  weekDelta: number | null;
  streak: number;
  isWorkoutDay: boolean;
  protein: number;
  proteinWarning: boolean;
}): string | null {
  if (proteinWarning) {
    return `חלבון מתחת ל-150 גרם ביום אימון. הוסף עוד ${150 - protein} גרם עד 21:00.`;
  }
  if (isWorkoutDay && protein === 0) {
    return "יום אימון היום — אל תשכח לתעד תזונה לפני שמגיעים ל-21:00.";
  }
  if (weekDelta !== null && weekDelta <= -0.5) {
    return `ירידה של ${Math.abs(weekDelta).toFixed(1)} ק"ג השבוע. תמשיך באותו כיוון.`;
  }
  if (weekDelta !== null && weekDelta > 0.3) {
    return `המשקל עלה ב-${weekDelta.toFixed(1)} ק"ג השבוע. בדוק קלוריות וצעדים.`;
  }
  if (streak >= 7) {
    return `סטריק של ${streak} ימי שקילה. עקביות = תוצאות.`;
  }
  if (progress >= 50) {
    return `אתה חצי הדרך ליעד. לא לוותר עכשיו.`;
  }
  return null;
}
