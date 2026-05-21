"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { S } from "@/lib/strings";
import { useState, useEffect, useCallback } from "react";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

type Status = "idle" | "saved" | "error";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("אורן");
  const [age, setAge] = useState("26");
  const [heightCm, setHeightCm] = useState("180");
  const [targetWeight, setTargetWeight] = useState("87");
  const [targetDate, setTargetDate] = useState("2026-07-31");
  const [dailyCalories, setDailyCalories] = useState("2092");
  const [dailyProtein, setDailyProtein] = useState("190");
  const [dailyCarbs, setDailyCarbs] = useState("180");
  const [dailyFat, setDailyFat] = useState("68");
  const [hypertensionMeds, setHypertensionMeds] = useState(true);
  const [maxHR, setMaxHR] = useState("145");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied">("default");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", user.user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setName(data.name ?? "אורן");
      setAge(String(data.age ?? 26));
      setHeightCm(String(data.height_cm ?? 180));
      setTargetWeight(String(data.target_weight_kg ?? 87));
      setTargetDate(data.target_date ?? "2026-07-31");
      setDailyCalories(String(data.daily_calories ?? 2092));
      setDailyProtein(String(data.daily_protein_g ?? 190));
      setDailyCarbs(String(data.daily_carbs_g ?? 180));
      setDailyFat(String(data.daily_fat_g ?? 68));
      setHypertensionMeds(data.hypertension_meds ?? true);
      setMaxHR(String(data.max_heart_rate ?? 145));
    }
  }, []);

  useEffect(() => {
    load();
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifStatus(Notification.permission as "default" | "granted" | "denied");
    }
  }, [load]);

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setSaving(false);
      setStatus("error");
      return;
    }

    const payload = {
      user_id: user.user.id,
      name,
      age: parseInt(age),
      height_cm: parseInt(heightCm),
      target_weight_kg: parseFloat(targetWeight),
      target_date: targetDate,
      daily_calories: parseInt(dailyCalories),
      daily_protein_g: parseInt(dailyProtein),
      daily_carbs_g: parseInt(dailyCarbs),
      daily_fat_g: parseInt(dailyFat),
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
        await supabase.from("push_subscriptions").upsert(
          {
            endpoint: sub.endpoint,
            p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(key)))),
            auth: btoa(String.fromCharCode(...Array.from(new Uint8Array(auth)))),
          },
          { onConflict: "user_id" }
        );
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
        <div className="card space-y-3">
          <h2 className="font-semibold">{S.settings.profile}</h2>

          <Field label={S.settings.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>

          <Field label={S.settings.age}>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>

          <Field label={S.settings.height}>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>

          <Field label={S.settings.targetWeight}>
            <input
              type="number"
              step="0.5"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>

          <Field label={S.settings.targetDate}>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>

          <Field label={S.settings.maxHeartRate}>
            <input
              type="number"
              value={maxHR}
              onChange={(e) => setMaxHR(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted flex-1">{S.settings.hypertensionMeds}</label>
            <button
              type="button"
              onClick={() => setHypertensionMeds(!hypertensionMeds)}
              className={`w-12 h-6 rounded-full transition-colors ${hypertensionMeds ? "bg-primary" : "bg-[var(--border)]"}`}
              aria-label={S.settings.hypertensionMeds}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${hypertensionMeds ? "translate-x-6" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">{S.settings.goals}</h2>
          <Field label={S.settings.dailyCalories}>
            <input
              type="number"
              value={dailyCalories}
              onChange={(e) => setDailyCalories(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>
          <Field label={S.settings.dailyProtein}>
            <input
              type="number"
              value={dailyProtein}
              onChange={(e) => setDailyProtein(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>
          <Field label={S.settings.dailyCarbs}>
            <input
              type="number"
              value={dailyCarbs}
              onChange={(e) => setDailyCarbs(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>
          <Field label={S.settings.dailyFat}>
            <input
              type="number"
              value={dailyFat}
              onChange={(e) => setDailyFat(e.target.value)}
              dir="ltr"
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:border-primary text-sm"
            />
          </Field>
        </div>

        {status === "error" && <p className="text-sm text-danger">{S.settings.errorSave}</p>}

        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full min-h-[48px] bg-primary text-white font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? S.settings.saving : status === "saved" ? S.settings.saved : S.settings.save}
        </button>

        <div className="card">
          <h2 className="font-semibold mb-3">{S.settings.notifications}</h2>
          {notifStatus === "granted" ? (
            <p className="text-sm text-success">✓ {S.settings.notificationsActive}</p>
          ) : notifStatus === "denied" ? (
            <p className="text-sm text-danger">{S.settings.notificationsBlocked}</p>
          ) : (
            <button
              onClick={enableNotifications}
              className="w-full min-h-[48px] border border-primary text-primary font-semibold rounded-xl"
            >
              {S.settings.enableNotifications}
            </button>
          )}
        </div>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted w-28 shrink-0">{label}</label>
      {children}
    </div>
  );
}
