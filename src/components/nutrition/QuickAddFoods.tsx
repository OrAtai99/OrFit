"use client";

import { useState } from "react";
import { FOODS, FOOD_CATEGORIES, type Food } from "@/lib/foods";
import { Card, Button } from "@/components/ui";
import { Plus, X, Minus, Search } from "lucide-react";

interface QuickAddFoodsProps {
  onAdd: (delta: { calories: number; protein: number; carbs: number; fat: number }) => void;
}

export function QuickAddFoods({ onAdd }: QuickAddFoodsProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Food["category"] | "all">("all");
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filtered = FOODS.filter((f) => {
    if (category !== "all" && f.category !== category) return false;
    if (search && !f.name.includes(search)) return false;
    return true;
  });

  function adjust(id: string, delta: number) {
    setQuantities((q) => {
      const next = (q[id] ?? 0) + delta;
      if (next <= 0) {
        const rest = { ...q };
        delete rest[id];
        return rest;
      }
      return { ...q, [id]: next };
    });
  }

  const summary = Object.entries(quantities).reduce(
    (acc, [id, qty]) => {
      const food = FOODS.find((f) => f.id === id);
      if (!food) return acc;
      return {
        calories: acc.calories + food.perUnit.calories * qty,
        protein: acc.protein + food.perUnit.protein * qty,
        carbs: acc.carbs + food.perUnit.carbs * qty,
        fat: acc.fat + food.perUnit.fat * qty,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  function confirm() {
    onAdd({
      calories: Math.round(summary.calories),
      protein: Math.round(summary.protein * 10) / 10,
      carbs: Math.round(summary.carbs * 10) / 10,
      fat: Math.round(summary.fat * 10) / 10,
    });
    setQuantities({});
    setOpen(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="secondary" fullWidth>
        <Plus size={16} /> הוסף מאכל מהיר
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 inset-x-0 bg-[var(--background)] rounded-t-3xl max-h-[88vh] flex flex-col"
      >
        <div className="px-4 pt-3 pb-2 border-b border-[var(--border)]">
          <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">הוספה מהירה</h2>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
              aria-label="סגור"
            >
              <X size={18} />
            </button>
          </div>
          <div className="relative mt-2">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש..."
              className="w-full h-10 pr-9 pl-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto mt-2 -mx-1 px-1 pb-1">
            <CategoryChip
              active={category === "all"}
              onClick={() => setCategory("all")}
              emoji="📋"
              label="הכל"
            />
            {FOOD_CATEGORIES.map((c) => (
              <CategoryChip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
                emoji={c.emoji}
                label={c.label}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted text-sm py-8">לא נמצאו מאכלים</p>
          ) : (
            filtered.map((food) => (
              <FoodRow
                key={food.id}
                food={food}
                quantity={quantities[food.id] ?? 0}
                onAdjust={(delta) => adjust(food.id, delta)}
              />
            ))
          )}
        </div>

        {Object.keys(quantities).length > 0 && (
          <div className="border-t border-[var(--border)] p-4 bg-[var(--card)] space-y-3">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <Tile label="קלוריות" value={Math.round(summary.calories)} color="#1F4E78" />
              <Tile label="חלבון" value={Math.round(summary.protein * 10) / 10} color="#047857" suffix="g" />
              <Tile label="פחמ'" value={Math.round(summary.carbs * 10) / 10} color="#2563a8" suffix="g" />
              <Tile label="שומן" value={Math.round(summary.fat * 10) / 10} color="#B91C1C" suffix="g" />
            </div>
            <Button onClick={confirm} variant="primary" size="lg" fullWidth>
              <Plus size={16} /> הוסף ליום ({Object.values(quantities).reduce((a, b) => a + b, 0)} פריטים)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryChip({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        "shrink-0 px-3 h-9 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors " +
        (active ? "bg-primary text-white" : "bg-[var(--card)] border border-[var(--border)] text-muted")
      }
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function FoodRow({ food, quantity, onAdjust }: { food: Food; quantity: number; onAdjust: (delta: number) => void }) {
  return (
    <Card
      className={"flex items-center gap-3 py-2 " + (quantity > 0 ? "border-primary/40 bg-primary/5" : "")}
    >
      <span className="text-2xl">{food.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{food.name}</p>
        <p className="text-xs text-muted">
          {food.unit} · {food.perUnit.calories} קק"ל · {food.perUnit.protein}g חלבון
        </p>
      </div>
      <div className="flex items-center gap-2">
        {quantity > 0 && (
          <>
            <button
              onClick={() => onAdjust(-1)}
              className="w-8 h-8 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
            >
              <Minus size={14} />
            </button>
            <span className="font-bold w-5 text-center text-sm">{quantity}</span>
          </>
        )}
        <button
          onClick={() => onAdjust(1)}
          className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center"
        >
          <Plus size={14} />
        </button>
      </div>
    </Card>
  );
}

function Tile({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className="font-bold" style={{ color }}>
        {value}
        {suffix ? <span className="text-[10px] font-normal mr-0.5">{suffix}</span> : null}
      </p>
    </div>
  );
}
