"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { todayISO, dayNameHe, formatDate } from "@/lib/calculations";
import { WEEKLY_SCHEDULE, getTemplateForType } from "@/lib/exercises";
import { useState, useEffect, useCallback } from "react";
import type { Workout, WorkoutSet } from "@/types";

export const dynamic = "force-dynamic";

const TYPE_LABELS = S.workouts.types;

type WorkoutWithSets = Workout & { sets: WorkoutSet[] };

export default function WorkoutsPage() {
  const [todayWorkout, setTodayWorkout] = useState<WorkoutWithSets | null>(null);
  const [history, setHistory] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutWithSets | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"schedule" | "logger" | "detail">("schedule");
  const [detailWorkout, setDetailWorkout] = useState<WorkoutWithSets | null>(null);

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

    const { data: existing } = await supabase
      .from("workouts")
      .select("*, workout_sets(*)")
      .eq("date", todayISO())
      .maybeSingle();

    let workout: Workout & { workout_sets: WorkoutSet[] };
    if (existing) {
      workout = existing as Workout & { workout_sets: WorkoutSet[] };
    } else {
      const { data: created, error } = await supabase
        .from("workouts")
        .insert({ date: todayISO(), type: todaySchedule.type, completed: false })
        .select()
        .single();
      if (error || !created) return;
      workout = { ...(created as Workout), workout_sets: [] };
    }

    const existingSets = workout.workout_sets ?? [];

    if (existingSets.length === 0) {
      const template = getTemplateForType(todaySchedule.type);
      const prefilledSets: object[] = [];
      template?.exercises.forEach((ex) => {
        ex.sets.forEach((value, i) => {
          const isSeconds = ex.repsUnit === "seconds";
          const isReps = ex.repsUnit === "reps";
          prefilledSets.push({
            workout_id: workout.id,
            exercise_name: ex.name,
            set_number: i + 1,
            weight_kg: isSeconds || isReps ? null : value,
            reps: isSeconds ? null : isReps ? value : 12,
            duration_seconds: isSeconds ? value : null,
            is_warmup: false,
          });
        });
      });
      if (prefilledSets.length > 0) {
        await supabase.from("workout_sets").insert(prefilledSets);
      }
    }

    const { data: freshSets } = await supabase
      .from("workout_sets")
      .select("*")
      .eq("workout_id", workout.id)
      .order("set_number");
    const typedSets: WorkoutSet[] = (freshSets as WorkoutSet[]) ?? [];
    setActiveWorkout({ ...workout, sets: typedSets });
    setView("logger");
    await load();
  }

  async function logWalkOrCompleted() {
    const supabase = createClient();
    const { error } = await supabase
      .from("workouts")
      .upsert(
        { date: todayISO(), type: todaySchedule.type, completed: true },
        { onConflict: "user_id,date" }
      );
    if (!error) await load();
  }

  async function updateSet(
    setId: string,
    field: "weight_kg" | "reps" | "duration_seconds",
    value: number | null
  ) {
    const supabase = createClient();
    await supabase.from("workout_sets").update({ [field]: value }).eq("id", setId);
    setActiveWorkout((prev) => {
      if (!prev) return prev;
      const updated = prev.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s));
      return { ...prev, sets: updated };
    });
  }

  async function updateWorkoutField(field: "max_heart_rate" | "duration_minutes" | "notes", value: number | string | null) {
    if (!activeWorkout) return;
    const supabase = createClient();
    await supabase.from("workouts").update({ [field]: value }).eq("id", activeWorkout.id);
    setActiveWorkout((prev) => (prev ? { ...prev, [field]: value } : prev));
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

  async function openDetail(workoutId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("workouts")
      .select("*, workout_sets(*)")
      .eq("id", workoutId)
      .maybeSingle();
    if (data) {
      const sets = ((data.workout_sets as WorkoutSet[]) ?? []).sort((a, b) => a.set_number - b.set_number);
      setDetailWorkout({ ...(data as Workout), sets });
      setView("detail");
    }
  }

  // === Detail view ===
  if (view === "detail" && detailWorkout) {
    return <DetailView workout={detailWorkout} onBack={() => setView("schedule")} />;
  }

  // === Logger view ===
  if (view === "logger" && activeWorkout) {
    return (
      <LoggerView
        workout={activeWorkout}
        saving={saving}
        onUpdateSet={updateSet}
        onUpdateWorkout={updateWorkoutField}
        onFinish={finishWorkout}
        onBack={() => setView("schedule")}
      />
    );
  }

  // === Schedule view ===
  const isWalk = todaySchedule.type === "walk";
  const isRest = todaySchedule.type === "rest";
  const startLabel = isWalk ? S.workouts.workoutSaved : S.workouts.startWorkout;

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
            {!isRest && (
              <button
                onClick={
                  todayWorkout?.completed
                    ? undefined
                    : isWalk
                    ? logWalkOrCompleted
                    : startWorkout
                }
                className={
                  "px-4 py-2 rounded-xl font-semibold text-sm " +
                  (todayWorkout?.completed
                    ? "bg-success/20 text-success"
                    : "bg-primary text-white")
                }
              >
                {todayWorkout?.completed ? S.dashboard.completed : isWalk ? S.common.done : startLabel}
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
                className={
                  "flex justify-between py-1.5 px-2 rounded-lg " +
                  (day.day === new Date().getDay() ? "bg-primary/10" : "")
                }
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
                <button
                  key={w.id}
                  onClick={() => openDetail(w.id)}
                  className="w-full flex justify-between items-center py-2 px-2 -mx-2 rounded-lg hover:bg-[var(--border)]/30 border-b border-[var(--border)] last:border-0"
                >
                  <span className="text-sm text-muted">
                    {dayNameHe(w.date)} · {formatDate(w.date)}
                  </span>
                  <span className="text-sm font-medium">
                    {w.completed ? "✓ " : ""}
                    {TYPE_LABELS[w.type]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// ----- Logger View -----

function LoggerView({
  workout,
  saving,
  onUpdateSet,
  onUpdateWorkout,
  onFinish,
  onBack,
}: {
  workout: Workout & { sets: WorkoutSet[] };
  saving: boolean;
  onUpdateSet: (id: string, field: "weight_kg" | "reps" | "duration_seconds", v: number | null) => void;
  onUpdateWorkout: (field: "max_heart_rate" | "duration_minutes" | "notes", v: number | string | null) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const grouped: Record<string, WorkoutSet[]> = {};
  const order: string[] = [];
  workout.sets.forEach((s) => {
    if (!grouped[s.exercise_name]) {
      grouped[s.exercise_name] = [];
      order.push(s.exercise_name);
    }
    grouped[s.exercise_name].push(s);
  });

  const hrWarning = workout.max_heart_rate !== null && (workout.max_heart_rate ?? 0) > 145;
  const title = TYPE_LABELS[workout.type] + " · " + dayNameHe(workout.date);

  return (
    <PageWrapper title={title}>
      <div className="space-y-3">
        {order.map((exercise) => (
          <div key={exercise} className="card">
            <p className="font-semibold mb-2">{exercise}</p>
            <div className="space-y-2">
              {grouped[exercise].map((s) => (
                <SetRow key={s.id} set={s} onUpdate={onUpdateSet} />
              ))}
            </div>
          </div>
        ))}

        <div className="card space-y-3">
          <p className="font-semibold">{S.workouts.vitals}</p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted w-24 shrink-0">{S.workouts.maxHR}</label>
            <input
              type="number"
              min="40"
              max="220"
              defaultValue={workout.max_heart_rate ?? ""}
              onChange={(e) =>
                onUpdateWorkout("max_heart_rate", e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="145"
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </div>
          {hrWarning && (
            <p className="text-sm text-danger font-medium">⚠️ {S.redRules.heartRateHigh}</p>
          )}
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted w-24 shrink-0">{S.workouts.duration}</label>
            <input
              type="number"
              min="0"
              max="300"
              defaultValue={workout.duration_minutes ?? ""}
              onChange={(e) =>
                onUpdateWorkout("duration_minutes", e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="60"
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <input
            type="text"
            defaultValue={workout.notes ?? ""}
            onChange={(e) => onUpdateWorkout("notes", e.target.value || null)}
            placeholder={S.workouts.notes}
            className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
          />
        </div>

        <button
          onClick={onFinish}
          disabled={saving}
          className="w-full min-h-[52px] bg-success text-white font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? S.workouts.finishing : S.workouts.finishWorkout}
        </button>
        <button
          onClick={onBack}
          className="w-full min-h-[44px] border border-[var(--border)] text-muted rounded-xl text-sm"
        >
          {S.common.back}
        </button>
      </div>
    </PageWrapper>
  );
}

function SetRow({
  set,
  onUpdate,
}: {
  set: WorkoutSet;
  onUpdate: (id: string, field: "weight_kg" | "reps" | "duration_seconds", v: number | null) => void;
}) {
  const isDuration = set.duration_seconds !== null;
  const isBodyweight = !isDuration && (set.weight_kg === null || set.weight_kg === 0);

  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs text-muted w-10">{S.workouts.set} {set.set_number}</span>
      {isDuration ? (
        <input
          type="number"
          min="0"
          defaultValue={set.duration_seconds ?? ""}
          onChange={(e) =>
            onUpdate(set.id, "duration_seconds", e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder={S.workouts.seconds}
          dir="ltr"
          className="w-24 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-center text-sm"
        />
      ) : isBodyweight ? (
        <>
          <span className="text-xs text-muted">{S.workouts.reps}:</span>
          <input
            type="number"
            min="0"
            defaultValue={set.reps ?? ""}
            onChange={(e) =>
              onUpdate(set.id, "reps", e.target.value ? parseInt(e.target.value) : null)
            }
            placeholder={S.workouts.reps}
            dir="ltr"
            className="w-20 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-center text-sm"
          />
        </>
      ) : (
        <>
          <input
            type="number"
            step="0.5"
            min="0"
            defaultValue={set.weight_kg ?? ""}
            onChange={(e) =>
              onUpdate(set.id, "weight_kg", e.target.value ? parseFloat(e.target.value) : null)
            }
            placeholder={S.weight.kg}
            dir="ltr"
            className="w-20 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-center text-sm"
          />
          <span className="text-xs text-muted">×</span>
          <input
            type="number"
            min="0"
            defaultValue={set.reps ?? ""}
            onChange={(e) =>
              onUpdate(set.id, "reps", e.target.value ? parseInt(e.target.value) : null)
            }
            placeholder={S.workouts.reps}
            dir="ltr"
            className="w-16 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-center text-sm"
          />
        </>
      )}
    </div>
  );
}

// ----- Detail View -----

function DetailView({
  workout,
  onBack,
}: {
  workout: Workout & { sets: WorkoutSet[] };
  onBack: () => void;
}) {
  const grouped: Record<string, WorkoutSet[]> = {};
  const order: string[] = [];
  workout.sets.forEach((s) => {
    if (!grouped[s.exercise_name]) {
      grouped[s.exercise_name] = [];
      order.push(s.exercise_name);
    }
    grouped[s.exercise_name].push(s);
  });

  const title = TYPE_LABELS[workout.type] + " · " + dayNameHe(workout.date);

  return (
    <PageWrapper title={title}>
      <div className="space-y-3">
        <div className="card text-sm">
          <p className="text-muted">{formatDate(workout.date)}</p>
          {workout.max_heart_rate && (
            <p className="mt-1">
              <span className="text-muted">{S.workouts.maxHR}: </span>
              <span className={workout.max_heart_rate > 145 ? "text-danger font-semibold" : ""}>
                {workout.max_heart_rate}
              </span>
            </p>
          )}
          {workout.duration_minutes && (
            <p className="mt-1">
              <span className="text-muted">{S.workouts.duration}: </span>
              {workout.duration_minutes}
            </p>
          )}
          {workout.notes && (
            <p className="mt-1">
              <span className="text-muted">{S.workouts.notes}: </span>
              {workout.notes}
            </p>
          )}
        </div>

        {order.length === 0 ? (
          <div className="card text-center text-muted text-sm py-6">
            {workout.type === "walk" ? "הליכה הושלמה" : "אין סטים מתועדים"}
          </div>
        ) : (
          order.map((exercise) => (
            <div key={exercise} className="card">
              <p className="font-semibold mb-2">{exercise}</p>
              <div className="space-y-1">
                {grouped[exercise].map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-muted">{S.workouts.set} {s.set_number}</span>
                    <span>
                      {s.duration_seconds !== null
                        ? `${s.duration_seconds} ${S.workouts.seconds}`
                        : s.weight_kg === null || s.weight_kg === 0
                        ? `${s.reps ?? 0} ${S.workouts.reps}`
                        : `${s.weight_kg} ${S.weight.kg} × ${s.reps ?? 0}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <button
          onClick={onBack}
          className="w-full min-h-[44px] border border-[var(--border)] text-muted rounded-xl text-sm"
        >
          {S.common.back}
        </button>
      </div>
    </PageWrapper>
  );
}
