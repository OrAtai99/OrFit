"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { S } from "@/lib/strings";
import { useState, useEffect, useCallback } from "react";
import type { Profile } from "@/types";
import { Card, Button, useToast } from "@/components/ui";
import { Bell, BellOff, BellRing, LogOut, User, Target, Calendar, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
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
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied">("default");
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/calendar?days=1")
      .then((r) => r.json())
      .then((d) => setCalendarConnected(!d.error))
      .catch(() => setCalendarConnected(false));
  }, []);

  async function connectCalendar() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) toast.show("שגיאה: " + error.message, "error");
  }

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
      toast.show(S.errors.auth, "error");
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
      toast.show(S.settings.errorSave, "error");
    } else {
      toast.show(S.settings.saved, "success");
      await load();
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission as "default" | "granted" | "denied");
    if (permission === "denied") {
      toast.show(S.settings.notificationsBlocked, "error");
      return;
    }
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
        toast.show(S.settings.notificationsActive, "success");
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
        <Card className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <User size={18} className="text-primary" /> {S.settings.profile}
          </h2>

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
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Target size={18} className="text-primary" /> {S.settings.goals}
          </h2>
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
        </Card>

        <Button onClick={saveProfile} loading={saving} variant="primary" size="lg" fullWidth>
          {saving ? S.settings.saving : S.settings.save}
        </Button>

        <Card>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> {S.settings.googleCalendar}
          </h2>
          {calendarConnected ? (
            <p className="text-sm text-success flex items-center gap-2">
              <CheckCircle2 size={16} /> {S.settings.calendarConnected}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted mb-3">
                חבר את יומן Google כדי לראות את אימוני השבוע על הדשבורד.
              </p>
              <Button onClick={connectCalendar} variant="secondary" fullWidth>
                <Calendar size={16} /> {S.settings.connectCalendar}
              </Button>
            </>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Bell size={18} className="text-primary" /> {S.settings.notifications}
          </h2>
          {notifStatus === "granted" ? (
            <p className="text-sm text-success flex items-center gap-2">
              <BellRing size={16} /> {S.settings.notificationsActive}
            </p>
          ) : notifStatus === "denied" ? (
            <p className="text-sm text-danger flex items-center gap-2">
              <BellOff size={16} /> {S.settings.notificationsBlocked}
            </p>
          ) : (
            <Button onClick={enableNotifications} variant="secondary" fullWidth>
              <Bell size={16} /> {S.settings.enableNotifications}
            </Button>
          )}
        </Card>

        <Button onClick={signOut} variant="outline" size="lg" fullWidth className="border-danger text-danger">
          <LogOut size={16} /> {S.auth.signOut}
        </Button>
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
