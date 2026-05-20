import type { RedRuleCheck } from "@/types";
import { S } from "./strings";

export function checkHeartRate(hr: number | null): RedRuleCheck {
  const triggered = hr !== null && hr > 145;
  return {
    id: "heart_rate",
    triggered,
    message: S.redRules.heartRateHigh,
    severity: "critical",
  };
}

export function checkBloodPressure(
  systolic: number | null,
  diastolic: number | null
): RedRuleCheck {
  const triggered =
    systolic !== null &&
    diastolic !== null &&
    (systolic > 160 || diastolic > 100);
  return {
    id: "blood_pressure",
    triggered,
    message: S.redRules.bloodPressureHigh,
    severity: "critical",
  };
}

export function checkProtein(
  proteinG: number | null,
  isWorkoutDay: boolean
): RedRuleCheck {
  const triggered = isWorkoutDay && proteinG !== null && proteinG < 150;
  return {
    id: "protein_workout_day",
    triggered,
    message: S.redRules.proteinLow,
    severity: "warning",
  };
}

export function checkSymptoms(hasDizziness: boolean, hasHeadache: boolean): RedRuleCheck {
  return {
    id: "symptoms",
    triggered: hasDizziness || hasHeadache,
    message: S.redRules.symptoms,
    severity: "critical",
  };
}

export interface ActiveAlertInput {
  maxHR?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  proteinG?: number | null;
  isWorkoutDay?: boolean;
  hasDizziness?: boolean;
  hasHeadache?: boolean;
}

export function getActiveRedRules(input: ActiveAlertInput): RedRuleCheck[] {
  const checks: RedRuleCheck[] = [
    checkHeartRate(input.maxHR ?? null),
    checkBloodPressure(input.systolic ?? null, input.diastolic ?? null),
    checkProtein(input.proteinG ?? null, input.isWorkoutDay ?? false),
    checkSymptoms(input.hasDizziness ?? false, input.hasHeadache ?? false),
  ];
  return checks.filter((c) => c.triggered);
}
