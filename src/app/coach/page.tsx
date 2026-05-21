"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { Button, Card, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { todayISO, isWorkoutDayByDate } from "@/lib/calculations";
import { getTodaySchedule } from "@/lib/exercises";
import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, MessageCircle, RotateCcw } from "lucide-react";
import type { DailyWeight, NutritionLog, Workout } from "@/types";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "orfit-coach-chat";
const SUGGESTIONS = [
  "מה כדאי לי לאכול היום לפני האימון?",
  "המשקל לא יורד שבועיים. מה לעשות?",
  "תן לי תוכנית הליכה ליום שבת",
  "מה התרגיל הכי חשוב באימון Push?",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("daily_weight").select("*").order("date", { ascending: false }).limit(3),
      supabase.from("nutrition_log").select("*").order("date", { ascending: false }).limit(7),
      supabase.from("workouts").select("*, workout_sets(*)").order("date", { ascending: false }).limit(5),
    ]).then(([wRes, nRes, woRes]) => {
      const weights = (wRes.data as DailyWeight[]) ?? [];
      const nutritionList = (nRes.data as NutritionLog[]) ?? [];
      const workouts = (woRes.data as (Workout & { workout_sets: { weight_kg: number | null; reps: number | null; exercise_name: string; set_number: number }[] })[]) ?? [];
      const schedule = getTodaySchedule();
      const isWorkoutDay = isWorkoutDayByDate(todayISO());
      const today = todayISO();
      const todayNutrition = nutritionList.find((n) => n.date === today);
      const todayWorkout = workouts.find((w) => w.date === today);

      const parts: string[] = [];

      // Today
      parts.push(`היום: ${schedule.type === "rest" ? "מנוחה" : schedule.type === "walk" ? "הליכה" : schedule.type.toUpperCase()}${isWorkoutDay ? " (יום אימון)" : ""}`);

      // Recent weights
      if (weights.length > 0) {
        const recent = weights.map((w) => `${w.date.slice(5)}=${w.weight_kg}ק"ג`).join(", ");
        parts.push(`שקילות אחרונות: ${recent}`);
        if (weights.length >= 2) {
          const delta = Math.round((weights[0].weight_kg - weights[weights.length - 1].weight_kg) * 10) / 10;
          parts.push(`שינוי ב-${weights.length} שקילות אחרונות: ${delta > 0 ? "+" : ""}${delta}ק"ג`);
        }
      }

      // Today's nutrition
      if (todayNutrition) {
        parts.push(
          `תזונה היום: ${todayNutrition.calories ?? 0} קק"ל / ${todayNutrition.protein_g ?? 0}g חלבון / ${todayNutrition.carbs_g ?? 0}g פחמ' / ${todayNutrition.fat_g ?? 0}g שומן / ${todayNutrition.steps ?? 0} צעדים`
        );
      } else {
        parts.push("עוד לא הוזנה תזונה היום");
      }

      // 7-day macro averages
      const valid = nutritionList.filter((n) => n.calories !== null);
      if (valid.length >= 3) {
        const avg = (key: keyof NutritionLog) =>
          Math.round(valid.reduce((s, n) => s + ((n[key] as number) ?? 0), 0) / valid.length);
        parts.push(
          `ממוצע 7 ימים: ${avg("calories")} קק"ל / ${avg("protein_g")}g חלבון / ${avg("steps")} צעדים`
        );
      }

      // Recent workouts
      const completed = workouts.filter((w) => w.completed);
      if (completed.length > 0) {
        const summary = completed
          .slice(0, 3)
          .map((w) => {
            const heaviest = w.workout_sets
              .filter((s) => s.weight_kg)
              .sort((a, b) => (b.weight_kg ?? 0) - (a.weight_kg ?? 0))[0];
            return `${w.date.slice(5)} ${w.type}${heaviest ? ` (כבד ביותר: ${heaviest.exercise_name} ${heaviest.weight_kg}ק"ג×${heaviest.reps ?? "?"})` : ""}`;
          })
          .join(" | ");
        parts.push(`אימונים אחרונים: ${summary}`);
      }

      if (todayWorkout?.completed) parts.push("האימון של היום סומן הושלם");

      setContext(parts.join("\n"));
    });
  }, []);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "שגיאה");
        setSending(false);
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setError("שגיאת תקשורת");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <PageWrapper title="מאמן AI">
      <div className="flex flex-col h-[calc(100vh-9rem)]">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto -mx-4 px-4 pb-2 space-y-3"
        >
          {messages.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="המאמן האישי שלך"
              description="שאל אותי על אימונים, תזונה, התקדמות או חוקים אדומים. אני יודע על הפרופיל שלך."
            />
          ) : (
            messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))
          )}
          {sending && (
            <MessageBubble role="assistant" content="•••" />
          )}
          {error && (
            <Card variant="danger" className="text-sm">{error}</Card>
          )}
        </div>

        {messages.length === 0 && (
          <div className="space-y-2 pb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full text-right px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm hover:border-primary/40 transition-colors"
              >
                <MessageCircle size={12} className="inline ml-2 text-primary" />
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="bg-[var(--background)] pt-2 sticky bottom-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="שאל את המאמן..."
              disabled={sending}
              className="flex-1 h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:border-primary"
            />
            <Button
              onClick={() => send(input)}
              disabled={!input.trim() || sending}
              size="md"
              className="h-12 px-4"
              aria-label="שלח"
            >
              <Send size={18} />
            </Button>
            {messages.length > 0 && (
              <Button
                onClick={reset}
                variant="outline"
                size="md"
                className="h-12 px-3"
                aria-label="התחל מחדש"
              >
                <RotateCcw size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function MessageBubble({ role, content }: ChatMessage) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={
          "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed " +
          (isUser
            ? "bg-primary text-white rounded-bl-md"
            : "bg-[var(--card)] border border-[var(--border)] rounded-br-md")
        }
      >
        {content}
      </div>
    </div>
  );
}
