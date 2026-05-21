"use client";

import { useEffect } from "react";
import { S } from "@/lib/strings";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="card max-w-sm w-full space-y-4">
        <h1 className="text-2xl font-bold text-danger">{S.errors.generic}</h1>
        <p className="text-sm text-muted break-words">
          {error.message || "Unknown error"}
        </p>
        <button
          onClick={reset}
          className="w-full min-h-[48px] bg-primary text-white font-semibold rounded-xl"
        >
          {S.common.confirm}
        </button>
      </div>
    </main>
  );
}
