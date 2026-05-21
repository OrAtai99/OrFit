export function movingAverage(data: (number | null)[], window: number): (number | null)[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1).filter((v) => v !== null) as number[];
    if (slice.length === 0) return null;
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10;
  });
}

export function progressPercent(
  startWeight: number,
  currentWeight: number,
  targetWeight: number
): number {
  if (startWeight === targetWeight) return 100;
  const totalToLose = startWeight - targetWeight;
  const lost = startWeight - currentWeight;
  return Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100)));
}

export function daysRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function requiredWeeklyLoss(
  currentWeight: number,
  targetWeight: number,
  daysLeft: number
): number {
  if (daysLeft <= 0) return 0;
  const weeksLeft = daysLeft / 7;
  const tolose = currentWeight - targetWeight;
  return Math.round((tolose / weeksLeft) * 100) / 100;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTH_NAMES = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יוני", "יולי", "אוג", "ספט", "אוק", "נוב", "דצמ"];

export function formatDateHe(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${day}/${month}`;
}

export function dayNameHe(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr).getDay()];
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function isWorkoutDayByDate(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return [1, 2, 4, 5].includes(day);
}

export function weighingStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function weeklyWeightDelta(entries: { date: string; weight_kg: number }[]): number | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const weekAgo = new Date(latest.date);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString().slice(0, 10);
  const earlier = sorted.find((e) => e.date >= weekAgoIso);
  if (!earlier || earlier === latest) return null;
  return Math.round((latest.weight_kg - earlier.weight_kg) * 10) / 10;
}

export function predictedDaysToGoal(
  entries: { date: string; weight_kg: number }[],
  targetKg: number
): number | null {
  if (entries.length < 7) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  const first = last7[0];
  const last = last7[last7.length - 1];
  const daysSpan =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000;
  if (daysSpan <= 0) return null;
  const dailyLoss = (first.weight_kg - last.weight_kg) / daysSpan;
  if (dailyLoss <= 0) return null;
  const remaining = last.weight_kg - targetKg;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / dailyLoss);
}

export function workoutVolume(sets: { weight_kg: number | null; reps: number | null }[]): number {
  return sets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
}
