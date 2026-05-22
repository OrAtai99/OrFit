"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";
import { createClient } from "@/lib/supabase/client";
import {
  movingAverage,
  formatDate,
  formatDateShort,
  dayNameHe,
  todayISO,
  predictedDaysToGoal,
  num,
} from "@/lib/calculations";
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
import { Card, Button, Input, EmptyState, useToast } from "@/components/ui";
import { Scale, TrendingDown, Target, CalendarClock } from "lucide-react";
import { getUserId } from "@/lib/use-user";
import { useProfileValues } from "@/contexts/ProfileContext";

export const dynamic = "force-dynamic";

export default function WeightPage() {
  const { targetWeight: TARGET } = useProfileValues();
  const toast = useToast();
  const [entries, setEntries] = useState<DailyWeight[]>([]);
  const [todayEntry, setTodayEntry] = useState<DailyWeight | null>(null);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("daily_weight")
      .select("*")
      .order("date", { ascending: true })
      .limit(60);
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
    const userId = await getUserId();
    if (!userId) {
      setSaving(false);
      toast.show(S.errors.auth, "error");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("daily_weight").upsert(
      {
        user_id: userId,
        date: todayISO(),
        weight_kg: parseFloat(weight),
        note: note || null,
      },
      { onConflict: "user_id,date" }
    );
    setSaving(false);
    if (error) {
      toast.show(`${S.weight.errorSave} ${error.message}`, "error");
    } else {
      toast.show(S.weight.saved, "success");
      await load();
    }
  }

  const weights = entries.map((e) => e.weight_kg);
  const avgArr = movingAverage(weights, 7);
  const chartData = entries.map((e, i) => ({
    date: formatDateShort(e.date),
    weight: num(e.weight_kg),
    avg: avgArr[i],
  }));

  const latestWeight = entries.length > 0 ? num(entries[entries.length - 1].weight_kg) : null;
  const etaDays = predictedDaysToGoal(entries, TARGET);
  const remaining = latestWeight !== null ? Math.max(0, latestWeight - TARGET) : 0;

  return (
    <PageWrapper title={S.weight.title}>
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Scale size={18} className="text-primary" />
            {todayEntry ? S.weight.alreadyLogged : S.weight.todayQuestion}
          </h2>
          <div className="flex gap-2 mb-2">
            <Input
              type="number"
              step="0.1"
              min="50"
              max="200"
              placeholder={S.weight.enterWeight}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              inputSize="lg"
            />
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!weight}
              size="lg"
              className="px-5"
            >
              {todayEntry ? S.weight.updateWeight : S.weight.save}
            </Button>
          </div>
          <Input
            type="text"
            placeholder={S.weight.note}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            inputSize="sm"
          />
        </Card>

        {latestWeight && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <Card className="py-3">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Scale size={12} className="text-primary" />
                <p className="text-xs text-muted">{S.weight.current}</p>
              </div>
              <p className="text-xl font-bold text-primary">{latestWeight}</p>
              <p className="text-xs text-muted">{S.weight.kg}</p>
            </Card>
            <Card className="py-3">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target size={12} className="text-success" />
                <p className="text-xs text-muted">{S.weight.target}</p>
              </div>
              <p className="text-xl font-bold text-success">{TARGET}</p>
              <p className="text-xs text-muted">{S.weight.kg}</p>
            </Card>
            <Card className="py-3">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown size={12} className="text-danger" />
                <p className="text-xs text-muted">{S.weight.remaining}</p>
              </div>
              <p className="text-xl font-bold text-danger">{remaining.toFixed(1)}</p>
              <p className="text-xs text-muted">{S.weight.kg}</p>
            </Card>
          </div>
        )}

        {etaDays !== null && etaDays > 0 && (
          <Card variant="primary" className="flex items-center gap-3">
            <CalendarClock size={20} className="text-primary shrink-0" />
            <p className="text-sm">
              בקצב הנוכחי תגיע ליעד בעוד <span className="font-bold text-primary">{etaDays}</span>{" "}
              {S.common.days}
            </p>
          </Card>
        )}

        {chartData.length === 1 && (
          <Card variant="primary" className="flex items-center gap-3">
            <TrendingDown size={20} className="text-primary shrink-0" />
            <p className="text-sm">
              שקול עוד יום או שניים — הגרף יופיע אוטומטית כשתהיה מגמה למדידה.
            </p>
          </Card>
        )}

        {chartData.length > 1 && (
          <Card>
            <p className="text-sm font-medium mb-3">{S.weight.chart30Days}</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.slice(0, 5)}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} ${S.weight.kg}`,
                    name === "weight"
                      ? S.weight.actualLine
                      : name === "avg"
                      ? S.weight.movingAvg
                      : S.weight.targetLine,
                  ]}
                />
                <ReferenceLine
                  y={TARGET}
                  stroke="#047857"
                  strokeDasharray="4 4"
                  label={{
                    value: `${S.weight.target} ${TARGET}`,
                    fontSize: 10,
                    fill: "#047857",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#1F4E78"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  name="weight"
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#2563a8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  name="avg"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {entries.length > 0 ? (
          <Card>
            <p className="text-sm font-medium mb-2">{S.weight.history}</p>
            <div className="space-y-1 max-h-72 overflow-y-auto -mx-2">
              {[...entries].reverse().map((e, i, arr) => {
                const prev = arr[i + 1];
                const delta = prev ? Math.round((num(e.weight_kg) - num(prev.weight_kg)) * 10) / 10 : null;
                return (
                  <div
                    key={e.id}
                    className="flex justify-between items-center py-2 px-2 border-b border-[var(--border)] last:border-0"
                  >
                    <span className="text-sm text-muted">
                      {dayNameHe(e.date)} · {formatDate(e.date)}
                    </span>
                    <div className="flex items-center gap-2">
                      {delta !== null && delta !== 0 && (
                        <span
                          className={
                            "text-xs " + (delta < 0 ? "text-success" : "text-danger")
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {delta}
                        </span>
                      )}
                      <span className="font-semibold">
                        {e.weight_kg} {S.weight.kg}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={Scale}
              title={S.weight.noHistory}
              description="הזן את משקלך הראשון למעלה"
            />
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
