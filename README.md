# OrFit - מאמן כושר אישי

PWA אישי למעקב כושר, תזונה ומשקל. בנוי עם Next.js 14, Supabase ו-Tailwind CSS.

## הקמה

### דרישות מקדימות

- Node.js 18+
- חשבון Supabase
- חשבון Vercel (לפריסה)
- פרויקט Google Cloud עם Calendar API מופעל

### התקנה מקומית

```bash
npm install

# הגדר משתני סביבה
# ערוך את .env.local עם הערכים שלך

npm run dev
```

### הגדרת Supabase

1. צור פרויקט חדש ב-[Supabase](https://supabase.com)
2. בדשבורד של Supabase, עבור ל-**SQL Editor**
3. הרץ את `supabase/migrations/001_initial.sql`
4. עבור ל-**Authentication > Providers** והפעל **Google**
5. הכנס את `GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET`
6. העתק את URL הפרויקט ומפתח ה-anon ל-.env.local

### הגדרת Google Cloud

1. עבור ל-[Google Cloud Console](https://console.cloud.google.com)
2. הפעל **Google Calendar API** ו-**Google Drive API**
3. צור **OAuth 2.0 Client ID** מסוג Web Application
4. הוסף Redirect URI: `https://your-supabase-url.supabase.co/auth/v1/callback`
5. הוסף גם: `http://localhost:3000/auth/callback` (לפיתוח)

### יצירת VAPID Keys להתראות

```bash
npx web-push generate-vapid-keys
```

הכנס את המפתחות ל-.env.local.

## משתני סביבה (.env.local)

| שם | תיאור |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL של פרויקט Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | מפתח anon של Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | מפתח service role (לשרת בלבד) |
| `NEXT_PUBLIC_APP_URL` | URL של האפליקציה |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key לפוש |
| `VAPID_PRIVATE_KEY` | VAPID private key |
| `VAPID_EMAIL` | אימייל לפוש |

## פריסה ל-Vercel

חבר GitHub repo ל-Vercel, הגדר את כל משתני הסביבה ב-Vercel Dashboard.

## מבנה הפרויקט

```
src/
├── app/           # דפים (Next.js App Router)
├── components/    # רכיבי UI
├── lib/           # עזרים ולוגיקה
└── types/         # TypeScript types
supabase/
└── migrations/    # סכמת DB
public/
└── icons/         # אייקוני PWA
```

## שלבי פיתוח

- [x] שלב 1: יסודות - Next.js, Tailwind, RTL, TypeScript
- [ ] שלב 2: Supabase + Auth (Google OAuth)
- [ ] שלב 3: דף שקילה + גרף
- [ ] שלב 4: דף אימונים + סטים
- [ ] שלב 5: דף תזונה
- [ ] שלב 6: דף בית - Dashboard
- [ ] שלב 7: סטטיסטיקות
- [ ] שלב 8: PWA + Service Worker
- [ ] שלב 9: Web Push Notifications
- [ ] שלב 10: גוגל קלנדר
- [ ] שלב 11: ייבוא מגוגל דרייב
- [ ] שלב 12: דף הגדרות
- [ ] שלב 13: פריסה ל-Vercel

## פרופיל המשתמש

ראה [profile.md](./profile.md) לפרטים מלאים על המשתמש, יעדים ותרגילים.
