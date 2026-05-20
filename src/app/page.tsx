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

export default function DashboardPage() {
  const [latestWeight, setLatestWeight] = useState<DailyWeight | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<NutritionLog | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("daily_weight").select("*").order("date", { ascending: false }).limit(1).single(),
      supabase.from("nutrition_log").select("*").eq("date", todayISO()).single(),
      supabase.from("workouts").select("*").eq("date", todayISO()).single(),
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
  const proteinWarning = isWorkoutDay && loaded && todayNutrition && protein < 150;

  const TYPE_LABELS: Record<string, string> = {
    push: "Push", pull: "Pull", legs: "Legs", upper: "Upper", walk: "הליכה", rest: "מנוחה"
  };

  return (
    <PageWrapper title={S.app.name}>
      <div className="space-y-4">
        {/* Progress ring simulation */}
        <div className="card text-center py-5">
          <div className="relative inline-flex items-center justify-center w-28 h-28 mb-3">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke="#1F4E78"
                strokeWidth="10"
                strokeDasharray={`${progress * 3.14} 314`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl font-bold text-primary">{progress}%</p>
              <p className="text-xs text-muted">יעד</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            {latestWeight ? `${latestWeight.weight_kg} ק"ג` : "—"} → {TARGET} ק"ג
          </p>
          <p className="text-xs text-muted mt-1">{daysLeft} ימים לסיום</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p className="text-xs text-muted">{S.dashboard.currentWeight}</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {latestWeight ? latestWeight.weight_kg : "—"}
              <span className="text-sm font-normal mr-1">ק"ג</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-muted">{S.dashboard.daysLeft}</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {daysLeft}
              <span className="text-sm font-normal mr-1">ימים</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-muted">חלבון היום</p>
            <p className={`text-2xl font-bold mt-1 ${proteinWarning ? "text-danger" : "text-success"}`}>
              {protein > 0 ? protein : "—"}
              <span className="text-sm font-normal mr-1">גרם</span>
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-muted">קלוריות היום</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {todayNutrition?.calories ?? "—"}
              {todayNutrition?.calories && <span className="text-sm font-normal mr-1">קק"ל</span>}
            </p>
          </div>
        </div>

        {/* Today's workout */}
        <div className="card">
          <p className="text-xs text-muted mb-1">אימון היום</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">
                {TYPE_LABELS[todaySchedule.type]} {todaySchedule.time ? `— ${todaySchedule.time}` : ""}
              </p>
              {nextWorkout && todaySchedule.type === "rest" && (
                <p className="text-xs text-muted">
                  הבא: {TYPE_LABELS[nextWorkout.type]} בעוד {nextWorkout.daysFromNow} ימים
                </p>
              )}
            </div>
            {todayWorkout?.completed && (
              <span className="text-success text-xl">✓</span>
            )}
          </div>
        </div>

        {/* Red rules */}
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
