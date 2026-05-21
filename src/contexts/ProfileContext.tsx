"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  /**
   * Optimistic update + persist. Cross-page subscribers refresh from Realtime.
   */
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const DEFAULTS: Partial<Profile> = {
  name: "אורן",
  age: 26,
  height_cm: 180,
  target_weight_kg: 87,
  target_date: "2026-07-31",
  daily_calories: 2092,
  daily_protein_g: 190,
  daily_carbs_g: 180,
  daily_fat_g: 68,
  hypertension_meds: true,
  max_heart_rate: 145,
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Realtime: any change to profile row (from another tab/device) refreshes us.
  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`profile-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profile", filter: `id=eq.${profile.id}` },
        (payload) => setProfile(payload.new as Profile)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = useCallback(
    async (updates: Partial<Profile>): Promise<{ error: string | null }> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: "Not authenticated" };

      const previous = profile;
      // Optimistic
      if (profile) setProfile({ ...profile, ...updates });

      const payload = { user_id: user.id, ...updates };
      const res = profile
        ? await supabase.from("profile").update(updates).eq("id", profile.id).select().single()
        : await supabase.from("profile").insert(payload).select().single();

      if (res.error) {
        if (previous) setProfile(previous);
        return { error: res.error.message };
      }
      setProfile(res.data as Profile);
      return { error: null };
    },
    [profile]
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, refetch: fetch }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}

/**
 * Read-only profile values with sensible defaults. Use this when you don't
 * need the update function and just want to render a goal/setting.
 */
export function useProfileValues() {
  const { profile } = useProfile();
  return {
    name: profile?.name ?? DEFAULTS.name!,
    targetWeight: profile?.target_weight_kg ?? DEFAULTS.target_weight_kg!,
    targetDate: profile?.target_date ?? DEFAULTS.target_date!,
    dailyCalories: profile?.daily_calories ?? DEFAULTS.daily_calories!,
    dailyProtein: profile?.daily_protein_g ?? DEFAULTS.daily_protein_g!,
    dailyCarbs: profile?.daily_carbs_g ?? DEFAULTS.daily_carbs_g!,
    dailyFat: profile?.daily_fat_g ?? DEFAULTS.daily_fat_g!,
    maxHeartRate: profile?.max_heart_rate ?? DEFAULTS.max_heart_rate!,
    hypertensionMeds: profile?.hypertension_meds ?? DEFAULTS.hypertension_meds!,
  };
}
