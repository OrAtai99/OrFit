"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { S } from "@/lib/strings";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <PageWrapper title={S.settings.title}>
      <div className="space-y-4">
        <div className="card">
          <p className="text-sm text-muted">בשלב 12 יתווספו הגדרות מלאות</p>
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
