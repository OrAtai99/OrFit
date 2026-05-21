import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `אתה מאמן כושר אישי קפדן ומקצועי של אור (26 שנה, 96.8 ק"ג, 180 ס"מ, יתר לחץ דם מטופל — דופק מקסימלי 145 פ/ד).

יעד: 87 ק"ג עד 31/07/2026.
אימונים: Push (שני), Pull (שלישי), Legs (חמישי), Upper (שישי) — שיטת פירמידה יורדת.
תזונה: 2,092 קק"ל | 190g חלבון | 180g פחמימות | 68g שומן | 10,000 צעדים.

חוקים אדומים:
- דופק > 145 → עצור אימון מיד
- לחץ דם > 160/100 → ביטול אימון
- חלבון < 150g ביום אימון → אזהרה
- סחרחורת/כאב ראש → עצור

תשובות:
- בעברית בלבד
- ישיר וקפדן, לא חבר. מאמן.
- קצר. שורה-שתיים. בלי הקדמות.
- אם יש לך נתונים על המשתמש בהודעת user, השתמש בהם.
- הצע +2.5 ק"ג בפעם הבאה רק אם המשתמש עמד ב-12 חזרות.

אל תיתן אישור רפואי. אם יש חששות בריאותיים, הפנה לרופא.`;

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "missing_key", message: "המאמן AI לא מוגדר. הוסף GEMINI_API_KEY ב-Vercel." },
      { status: 503 }
    );
  }

  let body: { messages?: ChatMessage[]; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const messages: ChatMessage[] = body.messages.slice(-30);
  if (body.context && messages.length > 0) {
    const last = messages[messages.length - 1];
    if (last.role === "user") {
      last.content = `[הקשר נוכחי: ${body.context}]\n\n${last.content}`;
    }
  }

  const contents: GeminiContent[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "gemini_error", status: res.status, detail: text.slice(0, 400) },
      { status: 500 }
    );
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!reply) {
    return NextResponse.json(
      { error: "empty_reply", detail: JSON.stringify(data).slice(0, 400) },
      { status: 500 }
    );
  }
  return NextResponse.json({ reply });
}
