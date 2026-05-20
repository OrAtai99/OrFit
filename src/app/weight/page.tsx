"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import { movingAverage, formatDate, todayISO } from "@/lib/calculations";
import { useState, useEffect, useCallback } from "react";
import type { DailyWeight } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export const dynamic = "force-dynamic";

const TARGET = 87;

export default function WeightPage() {
  const [entries, setEntries] = useState<DailyWeight[]>([]);
  const [todayEntry, setTodayEntry] = useState<DailyWeight | null>(null);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("daily_weight")
      .select("*")
      .order("date", { ascending: true })
      .limit(30);
    if (data) {
      setEntries(data);
      const today = data.find((e) => e.date === todayISO());
      setTodayEntry(today ?? null);
      if (today) setWeight(String(today.weight_kg));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!weight || isNaN(parseFloat(weight))) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("daily_weight").upsert(
      {
        date: todayISO(),
        weight_kg: parseFloat(weight),
        note: note || null,
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

  const weights = entries.map((e) => e.weight_kg);
  const avgArr = movingAverage(weights, 7);
  const chartData = entries.map((e, i) => ({
    date: formatDate(e.date),
    weight: e.weight_kg,
    avg: avgArr[i],
    target: TARGET,
  }));

  const latestWeight = entries.length > 0 ? entries[entries.length - 1].weight_kg : null;

  return (
    <PageWrapper title={S.weight.title}>
      <div className="space-y-4">
        {/* Today's weight form */}
        <div className="card">
          <h2 className="font-semibold mb-3">
            {todayEntry ? S.weight.alreadyLogged : S.weight.todayQuestion}
          </h2>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              step="0.1"
              min="50"
              max="200"
              placeholder={S.weight.enterWeight}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              dir="ltr"
              className="flex-1 h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-lg"
            />
            <button
              onClick={handleSave}
              disabled={saving || !weight}
              className="px-5 h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? S.weight.saving : status === "saved" ? S.weight.saved : S.weight.save}
            </button>
          </div>
          <input
            type="text"
            placeholder={S.weight.note}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-10 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
          />
          {status === "error" && (
            <p className="text-sm text-danger mt-2">שגיאה בשמירה. נסה שוב.</p>
          )}
        </div>

        {/* Stats summary */}
        {latestWeight && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="card py-3">
              <p className="text-xs text-muted">נוכחי</p>
              <p className="text-xl font-bold text-primary">{latestWeight}</p>
              <p className="text-xs text-muted">ק"ג</p>
            </div>
            <div className="card py-3">
              <p className="text-xs text-muted">יעד</p>
              <p className="text-xl font-bold text-success">{TARGET}</p>
              <p className="text-xs text-muted">ק"ג</p>
            </div>
            <div className="card py-3">
              <p className="text-xs text-muted">נותר</p>
              <p className="text-xl font-bold text-danger">
                {Math.max(0, latestWeight - TARGET).toFixed(1)}
              </p>
              <p className="text-xs text-muted">ק"ג</p>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="card">
            <p className="text-sm font-medium mb-3">{S.weight.chart30Days}</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.slice(0, 5)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} ק"ג`,
                    name === "weight" ? S.weight.actualLine : name === "avg" ? S.weight.movingAvg : S.weight.targetLine,
                  ]}
                />
                <ReferenceLine y={TARGET} stroke="#047857" strokeDasharray="4 4" label={{ value: `יעד ${TARGET}`, fontSize: 10, fill: "#047857" }} />
                <Line type="monotone" dataKey="weight" stroke="#1F4E78" strokeWidth={2} dot={false} name="weight" />
                <Line type="monotone" dataKey="avg" stroke="#2563a8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History */}
        {entries.length > 0 && (
          <div className="card">
            <p className="text-sm font-medium mb-2">{S.weight.history}</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {[...entries].reverse().map((e) => (
                <div key={e.id} className="flex justify-between items-center py-1.5 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-muted">{formatDate(e.date)}</span>
                  <span className="font-semibold">{e.weight_kg} ק"ג</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="card text-center py-8">
            <p className="text-muted">{S.weight.noHistory}</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
