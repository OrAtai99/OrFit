"use client";

import { Card, Button } from "@/components/ui";
import { Plus, X, Coffee, Sun, Dumbbell, Apple, Moon, Cookie } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FoodEntry, MealType } from "@/types";
import { S } from "@/lib/strings";

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sun,
  pre_workout: Dumbbell,
  post_workout: Apple,
  dinner: Moon,
  snack: Cookie,
};

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "pre_workout", "post_workout", "dinner", "snack"];

interface MealSectionsProps {
  entries: FoodEntry[];
  onAdd: (meal: MealType) => void;
  onDelete: (id: string) => void;
}

export function MealSections({ entries, onAdd, onDelete }: MealSectionsProps) {
  return (
    <div className="space-y-2">
      {MEAL_ORDER.map((meal) => {
        const mealEntries = entries.filter((e) => e.meal_type === meal);
        const Icon = MEAL_ICONS[meal];
        const totals = mealEntries.reduce(
          (acc, e) => ({
            cal: acc.cal + e.calories,
            p: acc.p + e.protein,
          }),
          { cal: 0, p: 0 }
        );

        return (
          <Card key={meal} noPadding>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{S.nutrition.meals[meal]}</p>
                    {mealEntries.length > 0 && (
                      <p className="text-[11px] text-muted">
                        {totals.cal} קק&quot;ל · {Math.round(totals.p * 10) / 10}g חלבון
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={() => onAdd(meal)} variant="ghost" size="sm">
                  <Plus size={14} />
                </Button>
              </div>
              {mealEntries.length > 0 && (
                <div className="space-y-1 pr-10">
                  {mealEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate">{entry.food_name}</span>
                        {entry.brand && <span className="text-muted"> · {entry.brand}</span>}
                      </div>
                      <span className="text-muted shrink-0 mx-2">
                        {entry.grams}g · {entry.calories} קק&quot;ל
                      </span>
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="w-6 h-6 rounded-md text-muted hover:text-danger flex items-center justify-center shrink-0"
                        aria-label={S.nutrition.deleteEntry}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
