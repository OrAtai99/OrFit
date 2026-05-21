"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { daysRemaining, progressPercent, todayISO, isWorkoutDayByDate } from "@/lib/calculations";
import { getTodaySchedule, getNextWorkout } from "@/lib/exercises";
import { useState, useEffect } from "react";
import type { DailyWeight, NutritionLog, Workout } from "@/types";

export const dynamic = "force-dynamic";

const TARGET = 87;
const START_WEIGHT = 96.8;
const TARGET_DATE = "2026-07-31";
const RING_RADIUS = 50;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const TYPE_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  upper: "Upper",
  walk: "הליכה",
  rest: "מנוחה",
};

export default function DashboardPage() {
  const [latestWeight, setLatestWeight] = useState<DailyWeight | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<NutritionLog | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("daily_weight").select("*").order("date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("nutrition_log").select("*").eq("date", todayISO()).maybeSingle(),
      supabase.from("workouts").select("*").eq("date", todayISO()).maybeSingle(),
    ]).then(([w, n, wo]) => {
      if (w.data) setLatestWeight(w.data);
      if (n.data) setTodayNutrition(n.data);
      if (wo.data) setTodayWorkout(wo.data);
      setLoaded(true);
    });
  }, []);

  const todaySchedule = getTodaySchedule();
  const nextWorkout = getNextWorkout();
  const daysLeft = daysRemaining(TARGET_DATE);
  const progress = latestWeight
    ? progressPercent(START_WEIGHT, latestWeight.weight_kg, TARGET)
    : 0;
  const isWorkoutDay = isWorkoutDayByDate(todayISO());
  const protein = todayNutrition?.protein_g ?? 0;
  const proteinWarning = isWorkoutDay && loaded && todayNutrition !== null && protein > 0 && protein < 150;
  const ringDash = (progress / 100) * RING_CIRCUMFERENCE;

  return (
    <PageWrapper title={S.app.name}>
      <div className="space-y-4">
        <div className="card text-center py-5">
          <div className="relative inline-flex items-center justify-center w-28 h-28 mb-3">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r={RING_RADIUS} fill="none"
                stroke="#1F4E78"
                strokeWidth="10"
                strokeDasharray={`${ringDash} ${RING_CIRCUMFERENCE}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl font-bold text-primary">{progress}%</p>
              <p className="text-xs text-muted">{S.dashboard.target}</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            {latestWeight ? `${latestWeight.weight_kg} ${S.common.kg}` : "—"} → {TARGET} {S.common.kg}
          </p>
          <p className="text-xs text-muted mt-1">{daysLeft} {S.dashboard.daysToFinish}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p className="text-xs text-muted">{S.dashboard.currentWeight}</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {latestWeight ? latestWeight.weight_kg : "—"}
              <span className="text-sm font-normal mr-1">{S.common.kg}</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-muted">{S.dashboard.daysLeft}</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {daysLeft}
              <span className="text-sm font-normal mr-1">{S.common.days}</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-muted">{S.dashboard.todayProtein}</p>
            <p className={`text-2xl font-bold mt-1 ${proteinWarning ? "text-danger" : "text-success"}`}>
              {protein > 0 ? protein : "—"}
              <span className="text-sm font-normal mr-1">{S.common.g}</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-muted">{S.dashboard.todayCalories}</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {todayNutrition?.calories ?? "—"}
              {todayNutrition?.calories ? <span className="text-sm font-normal mr-1">{S.common.kcal}</span> : null}
            </p>
          </div>
        </div>

        <div className="card">
          <p className="text-xs text-muted mb-1">{S.dashboard.todayWorkout}</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">
                {TYPE_LABELS[todaySchedule.type]} {todaySchedule.time ? `— ${todaySchedule.time}` : ""}
              </p>
              {nextWorkout && todaySchedule.type === "rest" && (
                <p className="text-xs text-muted">
                  {S.dashboard.nextWorkoutIn}{TYPE_LABELS[nextWorkout.type]} {S.dashboard.inDays}{nextWorkout.daysFromNow} {S.common.days}
                </p>
              )}
            </div>
            {todayWorkout?.completed && (
              <span className="text-success font-semibold text-sm bg-success/10 px-3 py-1 rounded-lg">✓ {S.dashboard.completed}</span>
            )}
          </div>
        </div>

        {proteinWarning ? (
          <div className="card border-danger/50 bg-danger/10">
            <p className="text-sm font-semibold text-danger">⚠️ {S.redRules.proteinLow}</p>
          </div>
        ) : (
          <div className="card border-success/50 bg-success/10">
            <p className="text-sm font-semibold text-success">✓ {S.redRules.allClear}</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
