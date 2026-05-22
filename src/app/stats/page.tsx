"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { movingAverage, formatDateShort, num } from "@/lib/calculations";
import { useState, useEffect } from "react";
import type { DailyWeight, NutritionLog, Workout } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, EmptyState, Button } from "@/components/ui";
import { BarChart2, Scale, Apple } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Range = 7 | 30 | 90;

export default function StatsPage() {
  const [weights, setWeights] = useState<DailyWeight[]>([]);
  const [nutrition, setNutrition] = useState<NutritionLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [range, setRange] = useState<Range>(30);

  useEffect(() => {
    const supabase = createClient();
    const since = new Date();
    since.setDate(since.getDate() - range);
    const sinceIso = since.toISOString().slice(0, 10);
    Promise.all([
      supabase.from("daily_weight").select("*").gte("date", sinceIso).order("date", { ascending: true }),
      supabase.from("nutrition_log").select("*").gte("date", sinceIso).order("date", { ascending: true }),
      supabase.from("workouts").select("*").gte("date", sinceIso).order("date", { ascending: false }),
    ]).then(([w, n, wo]) => {
      if (w.data) setWeights(w.data);
      if (n.data) setNutrition(n.data);
      if (wo.data) setWorkouts(wo.data);
    });
  }, [range]);

  const weightAvg = movingAverage(weights.map((w) => w.weight_kg), 7);
  const weightChartData = weights.map((w, i) => ({
    date: formatDateShort(w.date),
    weight: num(w.weight_kg),
    avg: weightAvg[i],
  }));

  const proteinChartData = nutrition.map((n) => ({
    date: formatDateShort(n.date),
    protein: num(n.protein_g),
  }));

  const stepsChartData = nutrition
    .filter((n) => n.steps)
    .map((n) => ({
      date: formatDateShort(n.date),
      steps: n.steps,
    }));

  const completedWorkouts = workouts.filter((w) => w.completed).length;
  const avgProtein =
    nutrition.length > 0
      ? Math.round(nutrition.reduce((s, n) => s + num(n.protein_g), 0) / nutrition.length)
      : 0;
  const avgWeight = weights.length > 0
    ? (weights.reduce((s, w) => s + num(w.weight_kg), 0) / weights.length).toFixed(1)
    : "—";

  if (weights.length === 0 && nutrition.length === 0 && workouts.length === 0) {
    return (
      <PageWrapper title={S.stats.title}>
        <RangeSelector range={range} setRange={setRange} />
        <Card className="mt-4">
          <EmptyState
            icon={BarChart2}
            title="עדיין אין מספיק נתונים"
            description="כדי לראות מגמות, רשום משקל ותזונה לפחות 3-4 ימים. הגרפים יופיעו אוטומטית כשיש מספיק נתונים."
            action={
              <div className="flex gap-2">
                <Link href="/weight">
                  <Button variant="primary" size="sm">
                    <Scale size={14} /> שקילה
                  </Button>
                </Link>
                <Link href="/nutrition">
                  <Button variant="secondary" size="sm">
                    <Apple size={14} /> תזונה
                  </Button>
                </Link>
              </div>
            }
          />
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={S.stats.title}>
      <div className="space-y-4">
        <RangeSelector range={range} setRange={setRange} />

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="card py-3">
            <p className="text-xs text-muted">{S.stats.completedWorkouts}</p>
            <p className="text-xl font-bold text-primary">{completedWorkouts}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-muted">{S.stats.avgProtein}</p>
            <p className="text-xl font-bold text-success">{avgProtein}<span className="text-sm font-normal mr-1">{S.common.g}</span></p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-muted">{S.stats.avgWeight}</p>
            <p className="text-xl font-bold text-primary">{avgWeight}<span className="text-sm font-normal mr-1">{S.common.kg}</span></p>
          </div>
        </div>

        {weightChartData.length > 1 && (
          <div className="card">
            <p className="text-sm font-medium mb-3">{S.stats.weightTrend}</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} />
                <Tooltip formatter={(v: number) => [`${v} ${S.common.kg}`]} />
                <Line type="monotone" dataKey="weight" stroke="#1F4E78" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avg" stroke="#2563a8" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {proteinChartData.length > 1 && (
          <div className="card">
            <p className="text-sm font-medium mb-3">{S.stats.proteinTrend}</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={proteinChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => [`${v} ${S.common.g}`]} />
                <Bar dataKey="protein" fill="#047857" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {stepsChartData.length > 1 && (
          <div className="card">
            <p className="text-sm font-medium mb-3">{S.stats.stepsTrend}</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={stepsChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => [`${v} ${S.common.steps}`]} />
                <Bar dataKey="steps" fill="#2563a8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function RangeSelector({ range, setRange }: { range: Range; setRange: (r: Range) => void }) {
  return (
    <div className="flex gap-2">
      {([7, 30, 90] as const).map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={
            "flex-1 h-10 rounded-xl text-sm font-medium transition-colors " +
            (range === r
              ? "bg-primary text-white"
              : "bg-[var(--card)] border border-[var(--border)] text-muted")
          }
        >
          {r} {S.common.days}
        </button>
      ))}
    </div>
  );
}
