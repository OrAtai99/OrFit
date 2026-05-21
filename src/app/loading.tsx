import { S } from "@/lib/strings";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[var(--border)] border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted">{S.common.loading}</p>
      </div>
    </main>
  );
}
