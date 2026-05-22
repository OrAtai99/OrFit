"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { todayISO, isWorkoutDayByDate, num } from "@/lib/calculations";
import { useState, useEffect, useCallback } from "react";
import type { NutritionLog } from "@/types";
import { Card, Button, Input, useToast } from "@/components/ui";
import { Beef, Wheat, Droplet, Flame, Footprints, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getUserId } from "@/lib/use-user";
import { QuickAddFoods } from "@/components/nutrition/QuickAddFoods";
import { FoodSearchModal } from "@/components/nutrition/FoodSearchModal";
import { MealSections } from "@/components/nutrition/MealSections";
import type { FoodEntry, MealType } from "@/types";
import { useProfileValues } from "@/contexts/ProfileContext";

export const dynamic = "force-dynamic";

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
  const remaining = Math.max(0, goal - current);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color + "22" }}
          >
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <div className="text-left">
          <p className="text-sm">
            <span className={over ? "text-danger font-bold" : "font-bold"} style={over ? {} : { color }}>
              {Math.round(current * 10) / 10}
            </span>
            <span className="text-muted"> / {goal} {unit}</span>
          </p>
          <p className="text-[10px] text-muted">
            {over ? `+${Math.round((current - goal) * 10) / 10} מעבר ליעד` : `${remaining} נותר`}
          </p>
        </div>
      </div>
      <div className="relative h-3 bg-[var(--border)]/50 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: pct + "%",
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
        {pct < 100 && (
          <div
            className="absolute inset-y-0 w-0.5 bg-[var(--foreground)]/30"
            style={{ right: "100%" }}
          />
        )}
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const toast = useToast();
  const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } = useProfileValues();
  const TARGETS = {
    calories: dailyCalories,
    protein: dailyProtein,
    carbs: dailyCarbs,
    fat: dailyFat,
  };
  const [, setEntry] = useState<NutritionLog | null>(null);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [searchMeal, setSearchMeal] = useState<MealType | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [logRes, entriesRes] = await Promise.all([
      supabase.from("nutrition_log").select("*").eq("date", todayISO()).maybeSingle(),
      supabase
        .from("nutrition_food_entries")
        .select("*")
        .eq("date", todayISO())
        .order("created_at", { ascending: true }),
    ]);
    if (logRes.data) {
      setEntry(logRes.data);
      setCalories(String(logRes.data.calories ?? ""));
      setProtein(String(logRes.data.protein_g ?? ""));
      setCarbs(String(logRes.data.carbs_g ?? ""));
      setFat(String(logRes.data.fat_g ?? ""));
      setSteps(String(logRes.data.steps ?? ""));
      setNotes(logRes.data.notes ?? "");
    }
    if (entriesRes.data) {
      setFoodEntries(entriesRes.data as FoodEntry[]);
    }
  }, []);

  async function recomputeFromEntries(allEntries: FoodEntry[]) {
    // num() coerces PG numeric strings — JS "+" would otherwise concatenate.
    const totals = allEntries.reduce(
      (acc, e) => ({
        cal: acc.cal + num(e.calories),
        p: acc.p + num(e.protein),
        c: acc.c + num(e.carbs),
        f: acc.f + num(e.fat),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
    const userId = await getUserId();
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("nutrition_log").upsert(
      {
        user_id: userId,
        date: todayISO(),
        calories: Math.round(totals.cal),
        protein_g: Math.round(totals.p * 10) / 10,
        carbs_g: Math.round(totals.c * 10) / 10,
        fat_g: Math.round(totals.f * 10) / 10,
        steps: steps ? parseInt(steps) : null,
        notes: notes || null,
      },
      { onConflict: "user_id,date" }
    );
    setCalories(String(Math.round(totals.cal)));
    setProtein(String(Math.round(totals.p * 10) / 10));
    setCarbs(String(Math.round(totals.c * 10) / 10));
    setFat(String(Math.round(totals.f * 10) / 10));
  }

  async function addFoodEntry(mealType: MealType, food: {
    food_code: string | null;
    food_name: string;
    brand: string | null;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) {
    const userId = await getUserId();
    if (!userId) {
      toast.show(S.errors.auth, "error");
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("nutrition_food_entries")
      .insert({
        user_id: userId,
        date: todayISO(),
        meal_type: mealType,
        ...food,
      })
      .select()
      .single();
    if (error) {
      toast.show("שגיאה: " + error.message, "error");
      return;
    }
    const next = [...foodEntries, data as FoodEntry];
    setFoodEntries(next);
    await recomputeFromEntries(next);
    toast.show("נוסף!", "success");
  }

  async function deleteFoodEntry(id: string) {
    const supabase = createClient();
    await supabase.from("nutrition_food_entries").delete().eq("id", id);
    const next = foodEntries.filter((e) => e.id !== id);
    setFoodEntries(next);
    await recomputeFromEntries(next);
  }

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
  const proteinFloor = Math.max(150, Math.round(dailyProtein * 0.8));
  const proteinWarning = isWorkoutDay && proteinVal > 0 && proteinVal < proteinFloor;

  const liveMacros = {
    calories: parseInt(calories) || 0,
    protein: parseFloat(protein) || 0,
    carbs: parseFloat(carbs) || 0,
    fat: parseFloat(fat) || 0,
    steps: parseInt(steps) || 0,
  };

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

        <Card className="space-y-4">
          <p className="text-sm font-medium">{S.nutrition.today}</p>
          <MacroBar
            icon={Flame}
            label={S.nutrition.calories}
            current={liveMacros.calories}
            goal={TARGETS.calories}
            unit={S.common.kcal}
            color="#1F4E78"
          />
          <MacroBar
            icon={Beef}
            label={S.nutrition.protein}
            current={liveMacros.protein}
            goal={TARGETS.protein}
            unit={S.common.g}
            color="#047857"
          />
          <MacroBar
            icon={Wheat}
            label={S.nutrition.carbs}
            current={liveMacros.carbs}
            goal={TARGETS.carbs}
            unit={S.common.g}
            color="#2563a8"
          />
          <MacroBar
            icon={Droplet}
            label={S.nutrition.fat}
            current={liveMacros.fat}
            goal={TARGETS.fat}
            unit={S.common.g}
            color="#B91C1C"
          />
          <MacroBar
            icon={Footprints}
            label={S.nutrition.steps}
            current={liveMacros.steps}
            goal={10000}
            unit={S.common.steps}
            color="#7C3AED"
          />
        </Card>

        <MealSections
          entries={foodEntries}
          onAdd={(meal) => setSearchMeal(meal)}
          onDelete={deleteFoodEntry}
        />

        <QuickAddFoods onAdd={handleQuickAdd} />

        <button
          onClick={() => setManualOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-muted hover:text-[var(--foreground)]"
        >
          <span>הזנה ידנית של מאקרו / צעדים</span>
          {manualOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {manualOpen && (
          <Card className="space-y-3">
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
        )}
      </div>

      {searchMeal && (
        <FoodSearchModal
          mealType={searchMeal}
          onClose={() => setSearchMeal(null)}
          onSelect={(food) => {
            addFoodEntry(searchMeal, food);
            setSearchMeal(null);
          }}
        />
      )}
    </PageWrapper>
  );
}
