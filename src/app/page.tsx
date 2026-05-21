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
} from "@/lib/calculations";
import { getTodaySchedule, getNextWorkout } from "@/lib/exercises";
import { useState, useEffect } from "react";
import type { DailyWeight, NutritionLog, Workout } from "@/types";
import { Card, Badge } from "@/components/ui";
import { Flame, TrendingDown, TrendingUp, CalendarClock, Dumbbell, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TARGET = 87;
const START_WEIGHT = 96.8;
const TARGET_DATE = "2026-07-31";
const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const TYPE_LABELS = S.workouts.types;

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
  const proteinWarning = isWorkoutDay && loaded && todayNutrition !== null && protein > 0 && protein < 150;
  const ringDash = (progress / 100) * RING_CIRCUMFERENCE;
  const streak = weighingStreak(allWeights.map((w) => w.date));
  const weekDelta = weeklyWeightDelta(allWeights);
  const etaDays = predictedDaysToGoal(allWeights, TARGET);

  return (
    <PageWrapper title={S.app.name}>
      <div className="space-y-4">
        {/* Hero — progress ring + key stats */}
        <Card className="text-center py-6">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-3">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r={RING_RADIUS}
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="8"
                strokeDasharray={`${ringDash} ${RING_CIRCUMFERENCE}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1F4E78" />
                  <stop offset="100%" stopColor="#2563a8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <p className="text-3xl font-bold text-primary">{progress}<span className="text-base">%</span></p>
              <p className="text-[10px] text-muted uppercase tracking-wider">{S.dashboard.target}</p>
            </div>
          </div>
          <p className="text-base font-medium">
            {latestWeight ? `${latestWeight.weight_kg}` : "—"} <span className="text-muted text-sm">{S.common.kg}</span>
            <span className="text-muted mx-2">→</span>
            {TARGET} <span className="text-muted text-sm">{S.common.kg}</span>
          </p>
          <p className="text-xs text-muted mt-1">{daysLeft} {S.dashboard.daysToFinish}</p>

          <div className="flex justify-center gap-2 mt-3">
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
        </Card>

        {/* Quick log buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/weight"
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="text-right">
              <p className="text-xs text-muted">{S.dashboard.currentWeight}</p>
              <p className="text-xl font-bold text-primary mt-0.5">
                {latestWeight ? latestWeight.weight_kg : "—"}
                <span className="text-xs font-normal text-muted mr-1">{S.common.kg}</span>
              </p>
            </div>
            <TrendingDown size={20} className="text-primary/40" />
          </Link>
          <Link
            href="/nutrition"
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="text-right">
              <p className="text-xs text-muted">{S.dashboard.todayProtein}</p>
              <p className={`text-xl font-bold mt-0.5 ${proteinWarning ? "text-danger" : "text-success"}`}>
                {protein > 0 ? protein : "—"}
                <span className="text-xs font-normal text-muted mr-1">{S.common.g}</span>
              </p>
            </div>
            <div className="text-2xl">🥩</div>
          </Link>
          <div className="card text-center py-3">
            <p className="text-xs text-muted">{S.dashboard.daysLeft}</p>
            <p className="text-xl font-bold text-primary mt-0.5">
              {daysLeft}
              <span className="text-xs font-normal text-muted mr-1">{S.common.days}</span>
            </p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-muted">{S.dashboard.todayCalories}</p>
            <p className="text-xl font-bold text-primary mt-0.5">
              {todayNutrition?.calories ?? "—"}
              {todayNutrition?.calories ? <span className="text-xs font-normal text-muted mr-1">{S.common.kcal}</span> : null}
            </p>
          </div>
        </div>

        {/* Today's workout */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted uppercase tracking-wider">{S.dashboard.todayWorkout}</p>
            {todayWorkout?.completed && (
              <Badge variant="success">
                <CheckCircle2 size={12} /> {S.dashboard.completed}
              </Badge>
            )}
          </div>
          <Link href="/workouts" className="flex items-center justify-between active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Dumbbell size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold">{TYPE_LABELS[todaySchedule.type]}</p>
                <p className="text-xs text-muted">
                  {todaySchedule.time ?? "כל היום"} · {todaySchedule.dayName}
                </p>
              </div>
            </div>
            {nextWorkout && todaySchedule.type === "rest" && (
              <p className="text-xs text-muted text-left">
                {S.dashboard.nextWorkoutIn}<br />
                <span className="font-medium text-[var(--foreground)]">{TYPE_LABELS[nextWorkout.type]}</span>
                <br />
                {S.dashboard.inDays}{nextWorkout.daysFromNow} {S.common.days}
              </p>
            )}
          </Link>
        </Card>

        {/* Red rules */}
        {proteinWarning ? (
          <Card variant="danger">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-danger shrink-0" />
              <p className="text-sm font-semibold text-danger">{S.redRules.proteinLow}</p>
            </div>
          </Card>
        ) : (
          <Card variant="success">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-success shrink-0" />
              <p className="text-sm font-semibold text-success">{S.redRules.allClear}</p>
            </div>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
