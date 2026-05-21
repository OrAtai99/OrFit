"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";

const PRESETS = [60, 90, 120, 180];

export function RestTimer() {
  const [target, setTarget] = useState(90);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const beepRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          beepRef.current?.play().catch(() => {});
          if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function start(seconds: number) {
    setTarget(seconds);
    setRemaining(seconds);
    setRunning(true);
  }

  function toggle() {
    if (remaining <= 0) start(target);
    else setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setRemaining(0);
  }

  const pct = target > 0 ? Math.max(0, Math.min(100, ((target - remaining) / target) * 100)) : 0;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;

  return (
    <div className="sticky bottom-20 z-40 mx-auto bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-lg p-3">
      <audio
        ref={beepRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAB/f39/f39/f39/f39/f39/f38="
      />
      {remaining > 0 ? (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="#1F4E78"
                strokeWidth="3"
                strokeDasharray={`${(pct / 100) * 106.8} 106.8`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Timer size={16} className="text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted">מנוחה</p>
            <p className="text-xl font-bold tabular-nums">
              {min}:{sec.toString().padStart(2, "0")}
            </p>
          </div>
          <button
            onClick={() => setRemaining((r) => Math.max(0, r - 15))}
            className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
            aria-label="-15"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setRemaining((r) => r + 15)}
            className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
            aria-label="+15"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center"
            aria-label={running ? "השהה" : "המשך"}
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={reset}
            className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
            aria-label="אפס"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-muted shrink-0" />
          <span className="text-xs text-muted shrink-0">מנוחה:</span>
          <div className="flex gap-1 flex-1 justify-end">
            {PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => start(s)}
                className="px-3 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
              >
                {s < 60 ? `${s}ש` : `${s / 60}ד${s % 60 ? ":" + (s % 60).toString().padStart(2, "0") : ""}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
