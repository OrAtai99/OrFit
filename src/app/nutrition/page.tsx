"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { todayISO, isWorkoutDayByDate } from "@/lib/calculations";
import { useState, useEffect, useCallback } from "react";
import type { NutritionLog } from "@/types";

export const dynamic = "force-dynamic";

const TARGETS = S.nutrition.targets;

type MacroBarProps = {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
};

function MacroBar({ label, current, goal, unit, color }: MacroBarProps) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{label}</span>
        <span>{current} / {goal} {unit}</span>
      </div>
      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: pct + "%", backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const [entry, setEntry] = useState<NutritionLog | null>(null);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("nutrition_log")
      .select("*")
      .eq("date", todayISO())
      .single();
    if (data) {
      setEntry(data);
      setCalories(String(data.calories ?? ""));
      setProtein(String(data.protein_g ?? ""));
      setCarbs(String(data.carbs_g ?? ""));
      setFat(String(data.fat_g ?? ""));
      setSteps(String(data.steps ?? ""));
      setNotes(data.notes ?? "");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("nutrition_log").upsert(
      {
        date: todayISO(),
        calories: calories ? parseInt(calories) : null,
        protein_g: protein ? parseFloat(protein) : null,
        carbs_g: carbs ? parseFloat(carbs) : null,
        fat_g: fat ? parseFloat(fat) : null,
        steps: steps ? parseInt(steps) : null,
        notes: notes || null,
      },
      { onConflict: "user_id,date" }
    );
    setSaving(false);
    if (error) {
      setStatus("error");
    } else {
      setStatus("saved");
      await load();
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const isWorkoutDay = isWorkoutDayByDate(todayISO());
  const proteinVal = parseFloat(protein) || 0;
  const proteinWarning = isWorkoutDay && proteinVal > 0 && proteinVal < 150;

  return (
    <PageWrapper title={S.nutrition.title}>
      <div className="space-y-4">

        {proteinWarning && (
          <div className="card border-danger bg-danger/10">
            <p className="text-sm font-medium text-danger">{"⚠️ " + S.nutrition.proteinWarning}</p>
          </div>
        )}

        {entry && (
          <div className="card space-y-3">
            <p className="text-sm font-medium">{S.nutrition.today}</p>
            <MacroBar
              label={S.nutrition.calories + ' (קק"ל)'}
              current={entry.calories ?? 0}
              goal={TARGETS.calories}
              unit={'קק"ל'}
              color="#1F4E78"
            />
            <MacroBar
              label={S.nutrition.protein}
              current={entry.protein_g ?? 0}
              goal={TARGETS.protein}
              unit="גרם"
              color="#047857"
            />
            <MacroBar
              label={S.nutrition.carbs}
              current={entry.carbs_g ?? 0}
              goal={TARGETS.carbs}
              unit="גרם"
              color="#2563a8"
            />
            <MacroBar
              label={S.nutrition.fat}
              current={entry.fat_g ?? 0}
              goal={TARGETS.fat}
              unit="גרם"
              color="#B91C1C"
            />
          </div>
        )}

        <div className="card space-y-3">
          <h2 className="font-semibold">{entry ? S.nutrition.update : S.nutrition.today}</h2>

          {[
            { label: S.nutrition.calories, value: calories, set: setCalories, placeholder: "2092" },
            { label: S.nutrition.protein, value: protein, set: setProtein, placeholder: "190" },
            { label: S.nutrition.carbs, value: carbs, set: setCarbs, placeholder: "180" },
            { label: S.nutrition.fat, value: fat, set: setFat, placeholder: "68" },
            { label: S.nutrition.steps, value: steps, set: setSteps, placeholder: "8000" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="flex items-center gap-3">
              <label className="text-sm text-muted w-20 shrink-0">{label}</label>
              <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                dir="ltr"
                className="flex-1 h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary"
              />
            </div>
          ))}

          <input
            type="text"
            placeholder={S.nutrition.notes}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
          />

          {status === "error" && <p className="text-sm text-danger">שגיאה. נסה שוב.</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full min-h-[52px] bg-primary text-white font-bold rounded-xl disabled:opacity-50"
          >
            {saving ? S.nutrition.saving : status === "saved" ? S.nutrition.saved : S.nutrition.save}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
