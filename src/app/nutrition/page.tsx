"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { todayISO, isWorkoutDayByDate } from "@/lib/calculations";
import { useState, useEffect, useCallback } from "react";
import type { NutritionLog } from "@/types";
import { Card, Button, Input, useToast } from "@/components/ui";
import { Beef, Wheat, Droplet, Flame, Footprints, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getUserId } from "@/lib/use-user";
import { QuickAddFoods } from "@/components/nutrition/QuickAddFoods";

export const dynamic = "force-dynamic";

const TARGETS = S.nutrition.targets;

type MacroBarProps = {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  icon: LucideIcon;
};

function MacroBar({ label, current, goal, unit, color, icon: Icon }: MacroBarProps) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const over = current > goal;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color }} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted">
          <span className={over ? "text-danger font-semibold" : "font-semibold text-[var(--foreground)]"}>
            {current}
          </span>
          {" / "}
          {goal} {unit}
        </span>
      </div>
      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: pct + "%", backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const toast = useToast();
  const [entry, setEntry] = useState<NutritionLog | null>(null);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("nutrition_log")
      .select("*")
      .eq("date", todayISO())
      .maybeSingle();
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

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    const userId = await getUserId();
    if (!userId) {
      setSaving(false);
      toast.show(S.errors.auth, "error");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("nutrition_log").upsert(
      {
        user_id: userId,
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
      toast.show(`שגיאה: ${error.message}`, "error");
    } else {
      toast.show(S.nutrition.saved, "success");
      await load();
    }
  }

  const isWorkoutDay = isWorkoutDayByDate(todayISO());
  const proteinVal = parseFloat(protein) || 0;
  const proteinWarning = isWorkoutDay && proteinVal > 0 && proteinVal < 150;

  function handleQuickAdd(delta: { calories: number; protein: number; carbs: number; fat: number }) {
    const curCal = parseInt(calories) || 0;
    const curProtein = parseFloat(protein) || 0;
    const curCarbs = parseFloat(carbs) || 0;
    const curFat = parseFloat(fat) || 0;
    setCalories(String(curCal + delta.calories));
    setProtein(String(Math.round((curProtein + delta.protein) * 10) / 10));
    setCarbs(String(Math.round((curCarbs + delta.carbs) * 10) / 10));
    setFat(String(Math.round((curFat + delta.fat) * 10) / 10));
    toast.show("נוסף, אל תשכח לשמור", "info");
  }

  const macroFields = [
    { label: S.nutrition.calories, value: calories, set: setCalories, placeholder: "2092", icon: Flame },
    { label: S.nutrition.protein, value: protein, set: setProtein, placeholder: "190", icon: Beef },
    { label: S.nutrition.carbs, value: carbs, set: setCarbs, placeholder: "180", icon: Wheat },
    { label: S.nutrition.fat, value: fat, set: setFat, placeholder: "68", icon: Droplet },
    { label: S.nutrition.steps, value: steps, set: setSteps, placeholder: "10000", icon: Footprints },
  ];

  return (
    <PageWrapper title={S.nutrition.title}>
      <div className="space-y-4">
        {proteinWarning && (
          <Card variant="danger" className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-danger shrink-0" />
            <p className="text-sm font-medium text-danger">{S.nutrition.proteinWarning}</p>
          </Card>
        )}

        {entry && (
          <Card className="space-y-4">
            <p className="text-sm font-medium">{S.nutrition.today}</p>
            <MacroBar
              icon={Flame}
              label={S.nutrition.calories}
              current={entry.calories ?? 0}
              goal={TARGETS.calories}
              unit={S.common.kcal}
              color="#1F4E78"
            />
            <MacroBar
              icon={Beef}
              label={S.nutrition.protein}
              current={entry.protein_g ?? 0}
              goal={TARGETS.protein}
              unit={S.common.g}
              color="#047857"
            />
            <MacroBar
              icon={Wheat}
              label={S.nutrition.carbs}
              current={entry.carbs_g ?? 0}
              goal={TARGETS.carbs}
              unit={S.common.g}
              color="#2563a8"
            />
            <MacroBar
              icon={Droplet}
              label={S.nutrition.fat}
              current={entry.fat_g ?? 0}
              goal={TARGETS.fat}
              unit={S.common.g}
              color="#B91C1C"
            />
            {entry.steps !== null && (
              <MacroBar
                icon={Footprints}
                label={S.nutrition.steps}
                current={entry.steps}
                goal={10000}
                unit={S.common.steps}
                color="#7C3AED"
              />
            )}
          </Card>
        )}

        <QuickAddFoods onAdd={handleQuickAdd} />

        <Card className="space-y-3">
          <h2 className="font-semibold">{entry ? S.nutrition.update : S.nutrition.today}</h2>

          {macroFields.map(({ label, value, set, placeholder, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={18} className="text-muted shrink-0" />
              <label className="text-sm text-muted w-16 shrink-0">{label}</label>
              <Input
                type="number"
                min="0"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}

          <Input
            type="text"
            placeholder={S.nutrition.notes}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            inputSize="sm"
          />

          <Button onClick={handleSave} loading={saving} variant="primary" size="lg" fullWidth>
            {saving ? S.nutrition.saving : S.nutrition.save}
          </Button>
        </Card>
      </div>
    </PageWrapper>
  );
}
