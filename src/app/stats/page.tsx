import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";

export default function StatsPage() {
  return (
    <PageWrapper title={S.stats.title}>
      <div className="card text-center py-12">
        <p className="text-4xl font-bold text-primary mb-2">סטטיסטיקות</p>
        <p className="text-muted text-sm">בשלב 7 יתווספו גרפים</p>
      </div>
    </PageWrapper>
  );
}
