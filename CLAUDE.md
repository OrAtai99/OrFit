# OrFit — System Prompt למתכנת Claude

## מה האפליקציה

PWA אישית למאמן כושר — משתמש יחיד בשם אור (26, 180 ס"מ, ~96.8 ק"ג).
יעד: ירידה מ-96.8 ל-87 ק"ג עד 31/07/2026.
**מגבלה רפואית קריטית:** יתר לחץ דם — דופק מקסימלי 145 פ/ד בכל אימון.

---

## סטאק טכני קיים — אל תשנה

```
Frontend:  Next.js 14 App Router + TypeScript + Tailwind RTL + Recharts + lucide-react
Backend:   Supabase (Postgres + Auth + RLS) + Next.js API Routes
Hosting:   Vercel + Vercel Cron
PWA:       next-pwa + Service Worker + Web Push (VAPID)
Auth:      Google OAuth דרך Supabase
```

**URLs:**
- Production: `https://or-fit-eight.vercel.app`
- GitHub: `OrAtai99/OrFit`
- Supabase: `xrdeycakwdowzpuddwdl`

---

## DB Schema — טבלאות קיימות

```sql
profile          -- פרופיל משתמש + יעדים
daily_weight     -- שקילה יומית
workouts         -- כותרת אימון (תאריך, סוג)
workout_sets     -- סטים בפועל (תרגיל, משקל, חזרות)
nutrition_log    -- תזונה יומית (קלוריות, מאקרו, צעדים)
weekly_summaries -- סיכום שבועי אוטומטי
push_subscriptions
alerts
```

**חשוב:** כל INSERT חייב לכלול `user_id` (ברירת מחדל: `auth.uid()`).
השתמש תמיד ב-`.maybeSingle()` ולא ב-`.single()`.

---

## קבצי ליבה — היכר אותם לפני כל שינוי

| קובץ | תוכן |
|------|------|
| `src/lib/strings.ts` | כל הטקסטים בעברית — אל תכתוב טקסט ישירות ב-JSX |
| `src/lib/exercises.ts` | תרגילים + משקלי פירמידה נוכחיים |
| `src/lib/calculations.ts` | movingAverage, progressPercent, daysRemaining |
| `src/middleware.ts` | מגן routes + bypass לכל `/api` ולכל `/auth` |
| `public/sw.js` | Service Worker — אל תגע ב-`/auth` ו-`/api` |
| `vercel.json` | Cron jobs |

---

## תכנית האימונים — הנתונים המלאים

### לוח שבועי
```
ראשון  — מנוחה (לימודים זום 16:30-22:15)
שני    — PUSH  19:00
שלישי  — PULL  19:00
רביעי  — מנוחה (מכללה 16:15-22:00)
חמישי  — LEGS  19:00
שישי   — UPPER 11:00
שבת    — הליכה 20:30 + Meal Prep 14:00
```

### שיטת עבודה: פירמידה יורדת
כל סט — משקל יורד. לא עולה. מתחיל כבד ויורד.

### PUSH — משקלים נוכחיים (שבוע 3, מאי 2026)
```
Bench Press (Barbell)     4 סטים  20→17.5→15→12.5 ק"ג
Chest Fly                 4 סטים  59→56→54→52 ק"ג
Reverse Fly (Machine)     3 סטים  45→43→41 ק"ג
Shoulder Press (Machine)  3 סטים  35→35→32 ק"ג
Lateral Raise (Dumbbell)  3 סטים  8→8→6 ק"ג
Triceps Pushdown (Cable)  4 סטים  20→17.5→15→12.5 ק"ג
```

### PULL — משקלים נוכחיים
```
Pullover (Machine)        3 סטים  30→25→25 ק"ג
Lat Pulldown (Cable)      3 סטים  60→55→50 ק"ג
Seated Row (Cable)        3 סטים  60→50→50 ק"ג
Back Extension            3 סטים  0→0→10 ק"ג
Bicep Curl (Barbell)      4 סטים  30→25→20→15 ק"ג
```

### LEGS — משקלים נוכחיים
```
Leg Press                 4 סטים  90→90→80→80 ק"ג
Calf Press on Leg Press   4 סטים  80→80→80→80 ק"ג
Leg Extension (Machine)   3 סטים  77→75→70 ק"ג
Lying Leg Curl (Machine)  3 סטים  31→30→25 ק"ג
Plank                     3 סטים  45→45→45 שניות
Crunch                    3 סטים  20→20→20 חזרות
```

### UPPER — (בעל פה, ללא תבנית Strong)
```
Incline Bench Press       4 סטים  10-12 חזרות
Lat Pulldown (Wide)       4 סטים  10-12 חזרות
Shoulder Press (Machine)  3 סטים  12 חזרות
Face Pull (Cable)         3 סטים  15 חזרות
Side Plank                3 סטים  30 שנ' כל צד
```

---

## יעדי תזונה יומיים

```
קלוריות:   2,092
חלבון:     190 גרם  (36%)
פחמימות:   180 גרם  (34%)
שומן:       68 גרם  (29%)
צעדים:     10,000
```

**כלל קריטי:** אם חלבון מתחת ל-150 גרם ב-21:00 ביום אימון — התראה אדומה.

### תזמון ארוחות
```
12:30  — ארוחת צהריים (מהבית, Meal Prep)
17:15  — לפני אימון (שני/שלישי/חמישי)
10:00  — לפני אימון שישי
20:15  — אחרי אימון
21:30  — סגירת יום MFP
```

---

## תוספים — לא רלוונטי לקוד אבל חשוב להקשר AI
```
קריאטין     5 גרם      לפני אימון
כורכומין    665 מ"ג    ערב עם ארוחה
אשווגנדה   450 מ"ג    ערב עם ארוחה
מגנזיום     200+מ"ג   לפני שינה
שייק חלבון  ~25 גרם   לפי צורך (Dymatize ISO100)
```

---

## Vercel Cron — קיים

```json
07:15 — שקול את עצמך
17:15 — ארוחה לפני אימון (ימי אימון)
21:30 — סגור יום, בדוק חלבון
```

---

## Progressive Overload — לוגיקה

כאשר משתמש מסיים אימון ועמד ביעד החזרות בכל הסטים:
- תרגילי כוח: הצע +2.5 ק"ג לסט הראשון בפעם הבאה
- Plank: הצע +5-10 שניות
- Crunch: הצע +2-3 חזרות

אם לא עמד ביעד — שמור על אותו משקל.
**אל תוריד משקל אוטומטית** — רק אנושית.

---

## כללי קוד — חובה לעמוד בהם

### RTL ועברית
- כל טקסט מוצג דרך `src/lib/strings.ts` — אסור טקסט ישיר ב-JSX
- `dir="rtl"` על כל קומפוננטה שמכילה טקסט
- Tailwind: השתמש ב-`text-right`, `mr-*` (לא `ml-*`) כברירת מחדל

### Supabase
- תמיד `.maybeSingle()` — לא `.single()`
- כל INSERT כולל `user_id: session.user.id`
- RLS פעיל — כל query מסונן אוטומטית למשתמש הנוכחי
- טפל תמיד ב-`error` מ-Supabase לפני שימוש ב-`data`

### Auth
- Middleware ב-`src/middleware.ts` מגן על כל route חוץ מ-`/auth` ו-`/api`
- Callback ב-`/auth/callback/route.ts` — אל תשנה בלי לבדוק cookies
- לאחר login → redirect לדשבורד `/`

### Service Worker
- `public/sw.js` — אל תוסיף intercepting ל-`/auth` או `/api`
- Push notifications דרך VAPID — public key ב-`/api/push/vapid-public`

### TypeScript
- כל הטיפוסים ב-`src/types/index.ts` — הוסף שם, לא בקומפוננטה
- אסור `any` — השתמש בטיפוסים מוגדרים

### Component structure
```
src/app/           — דפים (page.tsx לכל route)
src/components/    — קומפוננטות משותפות
src/lib/           — לוגיקה עסקית
src/types/         — טיפוסי TypeScript
public/            — קבצים סטטיים + SW + manifest
```

---

## מה נשאר לבנות (לפי עדיפות)

### עדיפות גבוהה
1. **Google Calendar Integration** (`/api/calendar/route.ts`)
   - הצגת אימונים מהיומן בדשבורד
   - סימון אימון כהושלם → מסנכרן ליומן
   - דורש: הפעלת Calendar API ב-Google Cloud + הוספת scope

2. **Profile auto-create** — טריגר ב-Supabase ליצירת `profile` במשתמש חדש

3. **Workout history detail** — לחיצה על אימון בהיסטוריה → פירוט הסטים

### עדיפות בינונית
4. **Google Drive Import** (`/api/drive/route.ts`) — ייבוא היסטוריה מגיליון
5. **Weekly summary auto-gen** — חישוב אוטומטי של `weekly_summaries`
6. **Stats page filters** — בחירת טווח תאריכים

### עדיפות נמוכה
7. **Notes/journal** — הערות חופשיות יומיות
8. **Red rules complete** — חוקים לדופק/לחץ דם (כרגע רק אזהרת חלבון)

---

## בעיות ידועות שתוקנו — אל תחזור עליהן

| בעיה | פתרון |
|------|-------|
| Auth loop ב-Vercel | cookies על response — תוקן |
| SW מתערב ב-/auth | bypass ב-sw.js — תוקן |
| Middleware חוסם cron | bypass לכל /api — תוקן |
| `.single()` שגיאות | הוחלף ל-`.maybeSingle()` |
| שכפול סטי אימון | תוקן |
| user_id חסר | default auth.uid() ב-DB |

---

## הקשר אישי — לשימוש ה-AI בתוך האפליקציה

כאשר מתממש מאמן AI בתוך OrFit, ה-system prompt שלו צריך לכלול:

```
אתה מאמן כושר אישי קפדן ומקצועי של אור (26 שנה, 96.8 ק"ג, 180 ס"מ).
יתר לחץ דם מטופל — דופק מקסימלי 145 פ/ד.
יעד: 87 ק"ג עד 31/07/2026.
אימונים: Push/Pull/Legs/Upper בפירמידה יורדת.
תזונה: 2,092 קק"ל | 190 גרם חלבון | 180 פחמימות | 68 שומן.
תגיב תמיד בעברית. היה ישיר וקפדן — לא חבר, מאמן.
```

---

## משתני סביבה נדרשים

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CRON_SECRET=
GOOGLE_CLIENT_ID=        # מפרויקט orfit-496915
GOOGLE_CLIENT_SECRET=
```

---

*עודכן: מאי 2026 | גרסה 1.3*
