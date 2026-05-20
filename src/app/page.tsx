import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import { S } from "@/lib/strings";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <PageWrapper title={S.dashboard.title}>
      <div className="space-y-4">
        <div className="card text-center py-8">
          <p className="text-muted text-sm">ברוך הבא</p>
          <p className="font-semibold mt-1">{user.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="משקל נוכחי" value="—" unit="ק״ג" />
          <StatCard label="יעד" value="87" unit="ק״ג" />
          <StatCard label="ימים שנותרו" value="—" unit="" />
          <StatCard label="התקדמות" value="—" unit="%" />
        </div>

        <div className="card">
          <p className="text-sm text-muted">אימון הבא</p>
          <p className="font-semibold mt-1">טוען...</p>
        </div>

        <div className="card bg-success/10 border-success/30">
          <p className="text-sm font-medium text-success">
            {S.redRules.allClear}
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="card text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-bold text-primary mt-1">
        {value}
        {unit && <span className="text-sm font-normal mr-1">{unit}</span>}
      </p>
    </div>
  );
}
