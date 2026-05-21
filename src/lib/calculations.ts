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
