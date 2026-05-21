import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
  location?: string;
  htmlLink?: string;
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { session } } = await supabase.auth.getSession();
  const providerToken = session?.provider_token;
  if (!providerToken) {
    return NextResponse.json(
      { error: "No Google access token. Please sign in again with Google.", events: [] },
      { status: 200 }
    );
  }

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") ?? "7");
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + days);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${providerToken}` } }
  );

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: `Google API: ${res.status}`, detail: body.slice(0, 200), events: [] },
      { status: 200 }
    );
  }

  const data = await res.json();
  const events = ((data.items ?? []) as GoogleCalendarEvent[]).map((e) => ({
    id: e.id,
    summary: e.summary ?? "",
    description: e.description ?? "",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
    location: e.location ?? "",
    link: e.htmlLink ?? "",
  }));

  return NextResponse.json({ events });
}
