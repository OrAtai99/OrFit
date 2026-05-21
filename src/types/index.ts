export type WorkoutType = "push" | "pull" | "legs" | "upper" | "walk" | "rest";
export type AlertType =
  | "red_rule_violation"
  | "missed_workout"
  | "protein_low"
  | "weight_stall";
export type AlertSeverity = "warning" | "critical";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  height_cm: number;
  current_weight_kg: number | null;
  target_weight_kg: number;
  target_date: string;
  hypertension_meds: boolean;
  max_heart_rate: number;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  created_at: string;
  updated_at: string;
}

export interface DailyWeight {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  note: string | null;
  recorded_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  type: WorkoutType;
  duration_minutes: number | null;
  max_heart_rate: number | null;
  notes: string | null;
  calendar_event_id: string | null;
  completed: boolean;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_name: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  is_warmup: boolean;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  steps: number | null;
  notes: string | null;
}

export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  avg_weight: number | null;
  avg_protein: number | null;
  avg_steps: number | null;
  workout_count: number | null;
  notes: string | null;
}

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  created_at: string;
  acknowledged: boolean;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export type MealType = "breakfast" | "lunch" | "pre_workout" | "post_workout" | "dinner" | "snack";

export interface FoodEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  food_code: string | null;
  food_name: string;
  brand: string | null;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  storage_path: string;
  weight_at_time: number | null;
  notes: string | null;
  created_at: string;
}

export interface ExerciseTemplate {
  name: string;
  sets: number[];
  repsUnit?: "reps" | "seconds";
}

export interface WorkoutTemplate {
  type: WorkoutType;
  exercises: ExerciseTemplate[];
}

export interface RedRuleCheck {
  id: string;
  triggered: boolean;
  message: string;
  severity: AlertSeverity;
}

export interface DashboardData {
  profile: Profile | null;
  latestWeight: DailyWeight | null;
  todayNutrition: NutritionLog | null;
  nextWorkout: { type: WorkoutType; time: string; dayName: string } | null;
  activeAlerts: Alert[];
  progressPercent: number;
  daysRemaining: number;
  weightToLose: number;
}

export interface WeightChartPoint {
  date: string;
  weight: number | null;
  movingAvg: number | null;
  target: number;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  workoutType?: WorkoutType;
}
