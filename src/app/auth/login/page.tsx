"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState("");
  const supabase = createClient();
  const router = useRouter();

  async function signInWithGoogle() {
    setError("");
    setLoading("google");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes:
          "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly",
      },
    });
  }

  async function signInWithEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading("email");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("אימייל או סיסמה שגויים");
      setLoading(null);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">OrFit</h1>
          <p className="mt-2 text-muted">המאמן האישי שלך</p>
        </div>

        {/* Google */}
        <button
          onClick={signInWithGoogle}
          disabled={loading !== null}
          className="w-full h-14 bg-white dark:bg-zinc-800 border border-[var(--border)] text-[var(--foreground)] font-semibold rounded-xl flex items-center justify-center gap-3 disabled:opacity-60 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
        >
          {loading === "google" ? "מתחבר..." : <><GoogleIcon /> כניסה עם Google</>}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-muted">או</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Email */}
        <form onSubmit={signInWithEmail} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="אימייל"
            defaultValue="oratai12380@gmail.com"
            required
            dir="ltr"
            className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-primary"
          />
          <input
            name="password"
            type="password"
            placeholder="סיסמה"
            required
            dir="ltr"
            className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-primary"
          />

          {error && <p className="text-sm text-danger text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading !== null}
            className="w-full h-14 bg-primary text-white font-bold rounded-xl disabled:opacity-60 hover:bg-primary-dark transition-colors text-lg"
          >
            {loading === "email" ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
