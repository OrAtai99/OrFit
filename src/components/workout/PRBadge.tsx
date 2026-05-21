"use client";

import { Trophy } from "lucide-react";

export function PRBadge({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-sm"
      title="שיא אישי"
    >
      <Trophy size={size - 2} /> PR
    </span>
  );
}
