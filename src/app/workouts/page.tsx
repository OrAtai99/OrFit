"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/calculations";
import { WEEKLY_SCHEDULE, getTemplateForType } from "@/lib/exercises";
import { useState, useEffect, useCallback } from "react";
import type { Workout, WorkoutSet } from "@/types";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  upper: "Upper",
  walk: "הליכה",
  rest: "מנוחה",
};

type WorkoutWithSets = Workout & { sets: WorkoutSet[] };

export default function WorkoutsPage() {
  const [todayWorkout, setTodayWorkout] = useState<WorkoutWithSets | null>(null);
  const [history, setHistory] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutWithSets | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"schedule" | "logger">("schedule");

  const todaySchedule = WEEKLY_SCHEDULE[new Date().getDay()];

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: workouts } = await supabase
      .from("workouts")
      .select("*, workout_sets(*)")
      .order("date", { ascending: false })
      .limit(20);

    if (workouts) {
      const today = workouts.find((w) => w.date === todayISO());
      const setsToday: WorkoutSet[] = today ? (today.workout_sets as WorkoutSet[]) ?? [] : [];
      setTodayWorkout(today ? { ...today, sets: setsToday } : null);
      setHistory(workouts.filter((w) => w.date !== todayISO()));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startWorkout() {
    if (todaySchedule.type === "rest") return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("workouts")
      .upsert({ date: todayISO(), type: todaySchedule.type, completed: false }, { onConflict: "user_id,date" })
      .select()
      .single();

    if (!error && data) {
      const template = getTemplateForType(todaySchedule.type);
      const prefilledSets: object[] = [];
      template?.exercises.forEach((ex) => {
        ex.sets.forEach((w, i) => {
          prefilledSets.push({
            workout_id: data.id,
            exercise_name: ex.name,
            set_number: i + 1,
            weight_kg: w,
            reps: ex.repsUnit === "seconds" ? null : 12,
            duration_seconds: ex.repsUnit === "seconds" ? w : null,
            is_warmup: false,
          });
        });
      });

      if (prefilledSets.length > 0) {
        await supabase.from("workout_sets").insert(prefilledSets);
      }

      const { data: freshSets } = await supabase.from("workout_sets").select("*").eq("workout_id", data.id);
      const typedSets: WorkoutSet[] = (freshSets as WorkoutSet[]) ?? [];
      const workout: WorkoutWithSets = { ...data, sets: typedSets };
      setActiveWorkout(workout);
      setView("logger");
      await load();
    }
  }

  async function updateSet(setId: string, field: "weight_kg" | "reps" | "duration_seconds", value: number | null) {
    const supabase = createClient();
    await supabase.from("workout_sets").update({ [field]: value }).eq("id", setId);
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      const updated = prev.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s);
      return { ...prev, sets: updated };
    });
  }

  async function finishWorkout() {
    if (!activeWorkout) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("workouts").update({ completed: true }).eq("id", activeWorkout.id);
    setSaving(false);
    setView("schedule");
    await load();
  }

  if (view === "logger" && activeWorkout) {
    const grouped: string[] = [];
    const groupedSets: Record<string, WorkoutSet[]> = {};
    activeWorkout.sets.forEach((s) => {
      if (!groupedSets[s.exercise_name]) {
        groupedSets[s.exercise_name] = [];
        grouped.push(s.exercise_name);
      }
      groupedSets[s.exercise_name].push(s);
    });
    const workoutTitle = TYPE_LABELS[activeWorkout.type] + " — " + todayISO();

    return (
      <PageWrapper title={workoutTitle}>
        <div className="space-y-3">
          {grouped.map((exercise) => (
            <div key={exercise} className="card">
              <p className="font-semibold mb-2">{exercise}</p>
              <div className="space-y-2">
                {groupedSets[exercise].map((s) => (
                  <div key={s.id} className="flex gap-2 items-center">
                    <span className="text-xs text-muted w-8">{"סט " + s.set_number}</span>
                    {s.duration_seconds !== null ? (
                      <input
                        type="number"
                        defaultValue={s.duration_seconds ?? ""}
                        onChange={(e) => updateSet(s.id, "duration_seconds", e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="שניות"
                        dir="ltr"
                        className="w-20 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-center text-sm"
                      />
                    ) : (
                      <>
                        <input
                          type="number"
                          step="0.5"
                          defaultValue={s.weight_kg ?? ""}
                          onChange={(e) => updateSet(s.id, "weight_kg", e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder={"ק\"ג"}
                          dir="ltr"
                          className="w-20 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-center text-sm"
                        />
                        <span className="text-xs text-muted">x</span>
                        <input
                          type="number"
                          defaultValue={s.reps ?? ""}
                          onChange={(e) => updateSet(s.id, "reps", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={"חז'"}
                          dir="ltr"
                          className="w-16 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-center text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={finishWorkout}
            disabled={saving}
            className="w-full min-h-[52px] bg-success text-white font-bold rounded-xl disabled:opacity-50"
          >
            {saving ? S.workouts.finishing : S.workouts.finishWorkout}
          </button>
          <button
            onClick={() => setView("schedule")}
            className="w-full min-h-[44px] border border-[var(--border)] text-muted rounded-xl text-sm"
          >
            חזור
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={S.workouts.title}>
      <div className="space-y-4">
        <div className="card">
          <p className="text-sm text-muted mb-1">{S.workouts.thisWeek}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{TYPE_LABELS[todaySchedule.type]}</p>
              <p className="text-sm text-muted">
                {todaySchedule.time ?? "כל היום"} — {todaySchedule.dayName}
              </p>
            </div>
            {todaySchedule.type !== "rest" && (
              <button
                onClick={todayWorkout?.completed ? undefined : startWorkout}
                className={
                  "px-4 py-2 rounded-xl font-semibold text-sm " +
                  (todayWorkout?.completed ? "bg-success/20 text-success" : "bg-primary text-white")
                }
              >
                {todayWorkout?.completed ? "הושלם" : S.workouts.startWorkout}
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <p className="text-sm font-medium mb-2">לוח שבועי</p>
          <div className="space-y-1">
            {WEEKLY_SCHEDULE.map((day) => (
              <div
                key={day.day}
                className={"flex justify-between py-1.5 px-2 rounded-lg " + (day.day === new Date().getDay() ? "bg-primary/10" : "")}
              >
                <span className="text-sm font-medium">{day.dayName}</span>
                <span className="text-sm text-muted">
                  {TYPE_LABELS[day.type]} {day.time ?? ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="card">
            <p className="text-sm font-medium mb-2">{S.workouts.history}</p>
            <div className="space-y-1">
              {history.slice(0, 10).map((w) => (
                <div key={w.id} className="flex justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-muted">{w.date}</span>
                  <span className="text-sm font-medium">
                    {w.completed ? "✓ " : ""}{TYPE_LABELS[w.type]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
