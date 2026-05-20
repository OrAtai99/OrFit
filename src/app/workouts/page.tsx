import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";

export default function WorkoutsPage() {
  return (
    <PageWrapper title={S.workouts.title}>
      <div className="card text-center py-12">
        <p className="text-4xl font-bold text-primary mb-2">אימונים</p>
        <p className="text-muted text-sm">בשלב 4 יתווסף לוח שבועי וטופס סטים</p>
      </div>
    </PageWrapper>
  );
}
