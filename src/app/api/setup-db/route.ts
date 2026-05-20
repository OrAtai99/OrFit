import { NextResponse } from "next/server";

const MIGRATION_SQL = `
create table if not exists profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  name text not null default 'אורן',
  age int default 26,
  height_cm int default 180,
  current_weight_kg numeric(5,2),
  target_weight_kg numeric(5,2) default 87,
  target_date date default '2026-07-31',
  hypertension_meds boolean default true,
  max_heart_rate int default 145,
  daily_calories int default 2092,
  daily_protein_g int default 190,
  daily_carbs_g int default 180,
  daily_fat_g int default 68,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists daily_weight (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  weight_kg numeric(5,2) not null,
  note text,
  recorded_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  type text not null check (type in ('push','pull','legs','upper','walk','rest')),
  duration_minutes int,
  max_heart_rate int,
  notes text,
  calendar_event_id text,
  completed boolean default false
);

create table if not exists workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts not null on delete cascade,
  exercise_name text not null,
  set_number int not null,
  weight_kg numeric(5,2),
  reps int,
  duration_seconds int,
  is_warmup boolean default false
);

create table if not exists nutrition_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  calories int,
  protein_g numeric(5,1),
  carbs_g numeric(5,1),
  fat_g numeric(5,1),
  steps int,
  notes text,
  unique(user_id, date)
);

create table if not exists weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  week_start date not null,
  avg_weight numeric(5,2),
  avg_protein numeric(5,1),
  avg_steps int,
  workout_count int,
  notes text,
  unique(user_id, week_start)
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null check (type in ('red_rule_violation','missed_workout','protein_low','weight_stall')),
  message text not null,
  severity text default 'warning' check (severity in ('warning','critical')),
  created_at timestamptz default now(),
  acknowledged boolean default false
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create index if not exists idx_daily_weight_user_date on daily_weight(user_id, date desc);
create index if not exists idx_workouts_user_date on workouts(user_id, date desc);
create index if not exists idx_nutrition_user_date on nutrition_log(user_id, date desc);
create index if not exists idx_alerts_user_ack on alerts(user_id, acknowledged);

alter table profile enable row level security;
alter table daily_weight enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table nutrition_log enable row level security;
alter table weekly_summaries enable row level security;
alter table alerts enable row level security;
alter table push_subscriptions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profile' and policyname='own data') then
    create policy "own data" on profile for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='daily_weight' and policyname='own data') then
    create policy "own data" on daily_weight for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='workouts' and policyname='own data') then
    create policy "own data" on workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='workout_sets' and policyname='own data') then
    create policy "own data" on workout_sets for all
      using (workout_id in (select id from workouts where user_id = auth.uid()))
      with check (workout_id in (select id from workouts where user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename='nutrition_log' and policyname='own data') then
    create policy "own data" on nutrition_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='weekly_summaries' and policyname='own data') then
    create policy "own data" on weekly_summaries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='alerts' and policyname='own data') then
    create policy "own data" on alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='push_subscriptions' and policyname='own data') then
    create policy "own data" on push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='profile_updated_at') then
    create trigger profile_updated_at
      before update on profile
      for each row execute function update_updated_at();
  end if;
end $$;
`;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!dbPassword) {
    return NextResponse.json(
      { error: "SUPABASE_DB_PASSWORD not set in environment" },
      { status: 500 }
    );
  }

  try {
    // Dynamic import so pg is only loaded on the Node.js runtime
    const { Client } = await import("pg");

    const client = new Client({
      host: "db.xrdeycakwdowzpuddwdl.supabase.co",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: dbPassword,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    await client.connect();

    // Check if already migrated
    const check = await client.query(
      "SELECT to_regclass('public.profile') AS tbl"
    );
    if (check.rows[0]?.tbl) {
      await client.end();
      return NextResponse.json({
        ok: true,
        message: "Already migrated — tables exist",
      });
    }

    await client.query(MIGRATION_SQL);
    await client.end();

    return NextResponse.json({ ok: true, message: "Migration successful — all tables created" });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
