"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { movingAverage, formatDate } from "@/lib/calculations";
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

export const dynamic = "force-dynamic";

export default function StatsPage() {
  const [weights, setWeights] = useState<DailyWeight[]>([]);
  const [nutrition, setNutrition] = useState<NutritionLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("daily_weight").select("*").order("date", { ascending: true }).limit(30),
      supabase.from("nutrition_log").select("*").order("date", { ascending: true }).limit(30),
      supabase.from("workouts").select("*").order("date", { ascending: false }).limit(30),
    ]).then(([w, n, wo]) => {
      if (w.data) setWeights(w.data);
      if (n.data) setNutrition(n.data);
      if (wo.data) setWorkouts(wo.data);
    });
  }, []);

  const weightAvg = movingAverage(weights.map((w) => w.weight_kg), 7);
  const weightChartData = weights.map((w, i) => ({
    date: formatDate(w.date).slice(0, 5),
    weight: w.weight_kg,
    avg: weightAvg[i],
  }));

  const proteinChartData = nutrition.map((n) => ({
    date: formatDate(n.date).slice(0, 5),
    protein: n.protein_g ?? 0,
  }));

  const stepsChartData = nutrition
    .filter((n) => n.steps)
    .map((n) => ({
      date: formatDate(n.date).slice(0, 5),
      steps: n.steps,
    }));

  const completedWorkouts = workouts.filter((w) => w.completed).length;
  const avgProtein =
    nutrition.length > 0
      ? Math.round(nutrition.reduce((s, n) => s + (n.protein_g ?? 0), 0) / nutrition.length)
      : 0;

  if (weights.length === 0 && nutrition.length === 0) {
    return (
      <PageWrapper title={S.stats.title}>
        <div className="card text-center py-12">
          <p className="text-muted">{S.stats.noData}</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={S.stats.title}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="card py-3">
            <p className="text-xs text-muted">{S.stats.workoutsPerWeek}</p>
            <p className="text-xl font-bold text-primary">{completedWorkouts}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-muted">{S.stats.avgProtein}</p>
            <p className="text-xl font-bold text-success">{avgProtein}g</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-muted">{S.stats.avgWeight}</p>
            <p className="text-xl font-bold text-primary">
              {weights.length > 0
                ? (weights.reduce((s, w) => s + w.weight_kg, 0) / weights.length).toFixed(1)
                : "—"}
            </p>
          </div>
        </div>

        {weightChartData.length > 1 && (
          <div className="card">
            <p className="text-sm font-medium mb-3">{S.stats.weightTrend}</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} />
                <Tooltip formatter={(v: number) => [`${v} ק"ג`]} />
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
                <Tooltip formatter={(v: number) => [`${v}g`]} />
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
                <Tooltip formatter={(v: number) => [`${v} צעדים`]} />
                <Bar dataKey="steps" fill="#2563a8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
