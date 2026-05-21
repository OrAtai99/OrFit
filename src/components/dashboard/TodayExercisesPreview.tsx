"use client";

import { getTemplateForType } from "@/lib/exercises";
import type { WorkoutType } from "@/types";
import { S } from "@/lib/strings";

interface Props {
  type: WorkoutType;
}

export function TodayExercisesPreview({ type }: Props) {
  const template = getTemplateForType(type);
  if (!template || template.exercises.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border)]">
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
        תרגילי היום
      </p>
      <div className="space-y-1">
        {template.exercises.map((ex) => {
          const isSeconds = ex.repsUnit === "seconds";
          const isReps = ex.repsUnit === "reps";
          const summary = isSeconds
            ? ex.sets.map((v) => `${v}″`).join(" · ")
            : isReps
            ? ex.sets.map((v) => `${v}×`).join(" · ")
            : ex.sets.map((v) => `${v}${S.weight.kg}`).join(" · ");
          return (
            <div key={ex.name} className="flex items-baseline justify-between text-sm py-0.5">
              <span className="font-medium truncate ml-2">{ex.name}</span>
              <span className="text-xs text-muted text-left whitespace-nowrap">{summary}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
