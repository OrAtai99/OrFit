"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location: string;
  link: string;
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);

  useEffect(() => {
    fetch("/api/calendar?days=3")
      .then((r) => r.json())
      .then((d) => {
        // Silently hide on any error (missing token, scope not granted, etc).
        // Connect button lives in /settings.
        setEvents(d.error ? [] : (d.events ?? []));
      })
      .catch(() => setEvents([]));
  }, []);

  if (events === null) return null;
  if (events.length === 0) return null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => e.start.startsWith(todayIso));

  const displayEvents = todayEvents.length > 0 ? todayEvents : events.slice(0, 3);
  const isToday = todayEvents.length > 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar size={16} className="text-primary" />
          </div>
          <p className="text-sm font-semibold">{isToday ? "ביומן היום" : "הקרובים"}</p>
        </div>
      </div>
      <div className="space-y-2">
        {displayEvents.map((e) => (
          <Link
            key={e.id}
            href={e.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-[var(--border)]/30"
          >
            <div className="text-xs text-muted shrink-0 w-12 text-center">
              {formatTime(e.start)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.summary || "ללא כותרת"}</p>
              {e.location && (
                <p className="text-xs text-muted truncate">{e.location}</p>
              )}
            </div>
            <ExternalLink size={14} className="text-muted shrink-0" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

function formatTime(iso: string) {
  if (iso.length === 10) return "כל היום";
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}
