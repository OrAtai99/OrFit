import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";

export default function NutritionPage() {
  return (
    <PageWrapper title={S.nutrition.title}>
      <div className="card text-center py-12">
        <p className="text-4xl font-bold text-primary mb-2">תזונה</p>
        <p className="text-muted text-sm">בשלב 5 יתווסף טופס הזנת מאקרו</p>
      </div>
    </PageWrapper>
  );
}
