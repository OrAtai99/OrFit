import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const dynamic = "force-dynamic";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToAll(subscriptions: Subscription[], payload: object) {
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );
  return results.filter((r) => r.status === "fulfilled").length;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  const hour = new Date().getUTCHours() + 3; // Israel time (UTC+3)
  let payload = null;

  if (hour === 7) {
    payload = { title: "OrFit ⚖️", body: "שקלת בוקר? הזן משקל עכשיו", url: "/weight" };
  } else if (hour === 17) {
    payload = { title: "OrFit 🥩", body: "ארוחה לפני אימון — אל תשכח חלבון!", url: "/nutrition" };
  } else if (hour === 21) {
    payload = { title: "OrFit 📊", body: "סגור את יום התזונה", url: "/nutrition" };
  }

  if (!payload) return NextResponse.json({ sent: 0, hour });

  const sent = await sendToAll(subs, payload);
  return NextResponse.json({ sent, hour });
}
