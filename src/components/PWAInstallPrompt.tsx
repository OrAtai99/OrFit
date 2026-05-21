"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "orfit-install-dismissed";

export function PWAInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !event) return null;

  async function install() {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-xl p-4 fade-in">
      <button
        onClick={dismiss}
        className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
        aria-label="סגור"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Download size={24} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">התקן את OrFit כאפליקציה</p>
          <p className="text-xs text-white/80">פתיחה מהירה מהמסך הראשי, עובד גם offline</p>
        </div>
        <button
          onClick={install}
          className="px-3 h-9 rounded-lg bg-white text-primary font-bold text-sm hover:bg-white/90"
        >
          התקן
        </button>
      </div>
    </div>
  );
}
