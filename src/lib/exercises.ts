import type { WorkoutTemplate } from "@/types";

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    type: "push",
    exercises: [
      { name: "Bench Press", sets: [20, 17.5, 15, 12.5] },
      { name: "Chest Fly", sets: [59, 56, 54, 52] },
      { name: "Reverse Fly", sets: [45, 43, 41] },
      { name: "Shoulder Press", sets: [35, 35, 35] },
      { name: "Lateral Raise", sets: [8, 8, 8] },
      { name: "Triceps Pushdown", sets: [20, 17.5, 15, 12.5] },
    ],
  },
  {
    type: "pull",
    exercises: [
      { name: "Pullover", sets: [30, 25, 25] },
      { name: "Lat Pulldown", sets: [60, 55, 50] },
      { name: "Seated Row", sets: [60, 50, 50] },
      { name: "Back Extension", sets: [0, 0, 10] },
      { name: "Bicep Curl", sets: [30, 25, 20, 15] },
    ],
  },
  {
    type: "legs",
    exercises: [
      { name: "Leg Press", sets: [90, 90, 80, 80] },
      { name: "Calf Press", sets: [80, 80, 80, 80] },
      { name: "Leg Extension", sets: [77, 75, 80] },
      { name: "Lying Leg Curl", sets: [31, 30, 25] },
      { name: "Plank", sets: [45, 45, 45], repsUnit: "seconds" },
      { name: "Crunch", sets: [20, 20, 20], repsUnit: "reps" },
    ],
  },
  {
    type: "upper",
    exercises: [
      { name: "Bench Press", sets: [20, 17.5, 15] },
      { name: "Lat Pulldown", sets: [60, 55, 50] },
      { name: "Shoulder Press", sets: [35, 35, 35] },
      { name: "Seated Row", sets: [60, 50, 50] },
      { name: "Lateral Raise", sets: [8, 8, 8] },
      { name: "Bicep Curl", sets: [30, 25, 20] },
      { name: "Triceps Pushdown", sets: [20, 17.5, 15] },
    ],
  },
  {
    type: "walk",
    exercises: [],
  },
  {
    type: "rest",
    exercises: [],
  },
];

export const WEEKLY_SCHEDULE = [
  { day: 0, dayName: "ראשון", type: "rest" as const, time: null },
  { day: 1, dayName: "שני", type: "push" as const, time: "19:00" },
  { day: 2, dayName: "שלישי", type: "pull" as const, time: "19:00" },
  { day: 3, dayName: "רביעי", type: "rest" as const, time: null },
  { day: 4, dayName: "חמישי", type: "legs" as const, time: "19:00" },
  { day: 5, dayName: "שישי", type: "upper" as const, time: "11:00" },
  { day: 6, dayName: "שבת", type: "walk" as const, time: null },
] as const;

export function getTemplateForType(type: string): WorkoutTemplate | undefined {
  return WORKOUT_TEMPLATES.find((t) => t.type === type);
}

export function isWorkoutDay(dayOfWeek: number): boolean {
  return WEEKLY_SCHEDULE[dayOfWeek].type !== "rest";
}

export function getTodaySchedule() {
  const today = new Date().getDay();
  return WEEKLY_SCHEDULE[today];
}

export function getNextWorkout() {
  const today = new Date().getDay();
  for (let i = 1; i <= 7; i++) {
    const nextDay = (today + i) % 7;
    const schedule = WEEKLY_SCHEDULE[nextDay];
    if (schedule.type !== "rest" && schedule.type !== "walk") {
      return { ...schedule, daysFromNow: i };
    }
  }
  return null;
}
