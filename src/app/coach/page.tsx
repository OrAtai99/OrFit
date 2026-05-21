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
      supabase.from("daily_weight").select("*").order("date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("nutrition_log").select("*").eq("date", todayISO()).maybeSingle(),
      supabase.from("workouts").select("*").eq("date", todayISO()).maybeSingle(),
    ]).then(([w, n, wo]) => {
      const weight = (w.data as DailyWeight | null)?.weight_kg;
      const nutrition = n.data as NutritionLog | null;
      const workout = wo.data as Workout | null;
      const schedule = getTodaySchedule();
      const isWorkoutDay = isWorkoutDayByDate(todayISO());

      const parts: string[] = [];
      if (weight) parts.push(`משקל אחרון: ${weight} ק"ג`);
      parts.push(`היום: ${schedule.type === "rest" ? "מנוחה" : schedule.type === "walk" ? "הליכה" : schedule.type.toUpperCase()}`);
      if (isWorkoutDay) parts.push("יום אימון");
      if (nutrition) {
        parts.push(
          `תזונה היום: ${nutrition.calories ?? 0} קק"ל, ${nutrition.protein_g ?? 0}g חלבון, ${nutrition.steps ?? 0} צעדים`
        );
      } else {
        parts.push("עוד לא הוזנה תזונה היום");
      }
      if (workout?.completed) parts.push("האימון של היום סומן הושלם");
      setContext(parts.join(" | "));
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
