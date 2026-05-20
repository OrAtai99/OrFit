import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";

export default function WeightPage() {
  return (
    <PageWrapper title={S.weight.title}>
      <div className="card text-center py-12">
        <p className="text-4xl font-bold text-primary mb-2">שקלת היום?</p>
        <p className="text-muted text-sm">בשלב 3 יתווסף טופס הזנה וגרף</p>
      </div>
    </PageWrapper>
  );
}
