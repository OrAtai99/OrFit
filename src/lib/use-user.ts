"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

let cached: User | null = null;
let inflight: Promise<User | null> | null = null;

async function fetchUser(): Promise<User | null> {
  if (cached) return cached;
  if (inflight) return inflight;
  const supabase = createClient();
  inflight = supabase.auth.getUser().then(({ data }) => {
    cached = data.user;
    inflight = null;
    return cached;
  });
  return inflight;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(cached);

  useEffect(() => {
    let alive = true;
    fetchUser().then((u) => {
      if (alive) setUser(u);
    });
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      cached = session?.user ?? null;
      if (alive) setUser(cached);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return user;
}

export async function getUserId(): Promise<string | null> {
  const u = await fetchUser();
  return u?.id ?? null;
}
