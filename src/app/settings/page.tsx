"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { S } from "@/lib/strings";
import { useState, useEffect, useCallback } from "react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("אורן");
  const [targetWeight, setTargetWeight] = useState("87");
  const [dailyCalories, setDailyCalories] = useState("2092");
  const [dailyProtein, setDailyProtein] = useState("190");
  const [hypertensionMeds, setHypertensionMeds] = useState(true);
  const [maxHR, setMaxHR] = useState("145");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied">("default");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", user.user.id)
      .single();

    if (data) {
      setProfile(data);
      setName(data.name);
      setTargetWeight(String(data.target_weight_kg ?? 87));
      setDailyCalories(String(data.daily_calories ?? 2092));
      setDailyProtein(String(data.daily_protein_g ?? 190));
      setHypertensionMeds(data.hypertension_meds ?? true);
      setMaxHR(String(data.max_heart_rate ?? 145));
    }
  }, []);

  useEffect(() => {
    load();
    if ("Notification" in window) {
      setNotifStatus(Notification.permission as "default" | "granted" | "denied");
    }
  }, [load]);

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const payload = {
      user_id: user.user.id,
      name,
      target_weight_kg: parseFloat(targetWeight),
      daily_calories: parseInt(dailyCalories),
      daily_protein_g: parseInt(dailyProtein),
      hypertension_meds: hypertensionMeds,
      max_heart_rate: parseInt(maxHR),
    };

    const { error } = profile
      ? await supabase.from("profile").update(payload).eq("id", profile.id)
      : await supabase.from("profile").insert(payload);

    setSaving(false);
    if (error) {
      setStatus("error");
    } else {
      setStatus("saved");
      await load();
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission as "default" | "granted" | "denied");
    if (permission === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      const supabase = createClient();
      const key = sub.getKey("p256dh");
      const auth = sub.getKey("auth");
      if (key && auth) {
        await supabase.from("push_subscriptions").upsert({
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(key)))),
          auth: btoa(String.fromCharCode(...Array.from(new Uint8Array(auth)))),
        });
      }
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <PageWrapper title={S.settings.title}>
      <div className="space-y-4">
        {/* Profile */}
        <div className="card space-y-3">
          <h2 className="font-semibold">{S.settings.profile}</h2>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted w-24 shrink-0">{S.settings.name}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted w-24 shrink-0">{S.settings.targetWeight}</label>
            <input
              type="number"
              step="0.5"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted w-24 shrink-0">קלוריות יומי</label>
            <input
              type="number"
              value={dailyCalories}
              onChange={(e) => setDailyCalories(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted w-24 shrink-0">חלבון יומי (גרם)</label>
            <input
              type="number"
              value={dailyProtein}
              onChange={(e) => setDailyProtein(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted w-24 shrink-0">{S.settings.maxHeartRate}</label>
            <input
              type="number"
              value={maxHR}
              onChange={(e) => setMaxHR(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted flex-1">{S.settings.hypertensionMeds}</label>
            <button
              onClick={() => setHypertensionMeds(!hypertensionMeds)}
              className={`w-12 h-6 rounded-full transition-colors ${hypertensionMeds ? "bg-primary" : "bg-[var(--border)]"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${hypertensionMeds ? "translate-x-6" : ""}`} />
            </button>
          </div>

          {status === "error" && <p className="text-sm text-danger">שגיאה בשמירה.</p>}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full min-h-[48px] bg-primary text-white font-bold rounded-xl disabled:opacity-50"
          >
            {saving ? S.settings.saving : status === "saved" ? S.settings.saved : S.settings.save}
          </button>
        </div>

        {/* Notifications */}
        <div className="card">
          <h2 className="font-semibold mb-3">{S.settings.notifications}</h2>
          {notifStatus === "granted" ? (
            <p className="text-sm text-success">✓ התראות מופעלות</p>
          ) : notifStatus === "denied" ? (
            <p className="text-sm text-danger">התראות חסומות בדפדפן</p>
          ) : (
            <button
              onClick={enableNotifications}
              className="w-full min-h-[48px] border border-primary text-primary font-semibold rounded-xl"
            >
              {S.settings.enableNotifications}
            </button>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full min-h-[52px] border border-danger text-danger font-semibold rounded-xl"
        >
          {S.auth.signOut}
        </button>
      </div>
    </PageWrapper>
  );
}
