"use client";

import { useEffect, useState, useRef } from "react";
import { Button, Spinner } from "@/components/ui";
import { Search, X, Plus, Minus } from "lucide-react";
import { S } from "@/lib/strings";
import type { MealType } from "@/types";

interface SearchResult {
  code: string;
  name: string;
  brand: string;
  image: string | null;
  per100g: { calories: number; protein: number; carbs: number; fat: number };
}

interface FoodSearchModalProps {
  mealType: MealType;
  onClose: () => void;
  onSelect: (entry: {
    food_code: string | null;
    food_name: string;
    brand: string | null;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}

export function FoodSearchModal({ mealType, onClose, onSelect }: FoodSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [grams, setGrams] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(id);
  }, [query]);

  function confirm() {
    if (!selected) return;
    const factor = grams / 100;
    onSelect({
      food_code: selected.code || null,
      food_name: selected.name,
      brand: selected.brand || null,
      grams,
      calories: Math.round(selected.per100g.calories * factor),
      protein: Math.round(selected.per100g.protein * factor * 10) / 10,
      carbs: Math.round(selected.per100g.carbs * factor * 10) / 10,
      fat: Math.round(selected.per100g.fat * factor * 10) / 10,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--background)] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[88vh] flex flex-col"
      >
        <div className="px-4 pt-3 pb-2 border-b border-[var(--border)]">
          <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mb-2 sm:hidden" />
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">
              {S.nutrition.searchFood} · {S.nutrition.meals[mealType]}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
              aria-label="סגור"
            >
              <X size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setSelected(null);
                setQuery(e.target.value);
              }}
              placeholder={S.nutrition.searchPlaceholder}
              className="w-full h-11 pr-9 pl-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-center text-muted text-sm py-8">{S.nutrition.noResults}</p>
          )}
          {!loading && query.length < 2 && (
            <p className="text-center text-muted text-xs py-8">
              הקלד לפחות 2 אותיות. הנתונים מ-Open Food Facts.
            </p>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <button
                  key={r.code + r.name}
                  onClick={() => setSelected(r)}
                  className={
                    "w-full flex items-center gap-3 p-2 rounded-xl border text-right transition-colors " +
                    (selected?.code === r.code
                      ? "border-primary bg-primary/10"
                      : "border-[var(--border)] hover:border-primary/40")
                  }
                >
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[var(--card)]" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[var(--border)]/40 flex items-center justify-center shrink-0 text-2xl">
                      🍽️
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    {r.brand && <p className="text-xs text-muted truncate">{r.brand}</p>}
                    <p className="text-xs text-muted">
                      {Math.round(r.per100g.calories)} קק&quot;ל · {Math.round(r.per100g.protein)}g חלבון · {Math.round(r.per100g.carbs)}g פחמ&apos;
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="border-t border-[var(--border)] p-4 bg-[var(--card)] space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate flex-1">{selected.name}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGrams((g) => Math.max(10, g - 50))}
                  className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
                >
                  <Minus size={16} />
                </button>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={grams}
                    onChange={(e) => setGrams(parseInt(e.target.value) || 0)}
                    dir="ltr"
                    className="w-20 h-9 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-center text-sm"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
                    {S.nutrition.grams_unit}
                  </span>
                </div>
                <button
                  onClick={() => setGrams((g) => g + 50)}
                  className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <Tile label="קלוריות" value={Math.round(selected.per100g.calories * (grams / 100))} color="#1F4E78" />
              <Tile label="חלבון" value={Math.round(selected.per100g.protein * (grams / 100) * 10) / 10} color="#047857" suffix="g" />
              <Tile label="פחמ'" value={Math.round(selected.per100g.carbs * (grams / 100) * 10) / 10} color="#2563a8" suffix="g" />
              <Tile label="שומן" value={Math.round(selected.per100g.fat * (grams / 100) * 10) / 10} color="#B91C1C" suffix="g" />
            </div>
            <Button onClick={confirm} variant="primary" size="lg" fullWidth>
              <Plus size={16} /> {S.nutrition.addToMeal} {S.nutrition.meals[mealType]}
            </Button>
          </div>
        )}
      </div>
    </div>
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
