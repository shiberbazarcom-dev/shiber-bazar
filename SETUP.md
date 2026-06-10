# শিবের বাজার — Setup Guide

## ধাপ ১: Dependencies Install
Terminal/PowerShell-এ চালান:
```bash
cd "D:\shiber bazar\shiber-bazar"
npm install
```

## ধাপ ২: Supabase Database Setup
1. https://supabase.com → আপনার project খুলুন
2. SQL Editor → New Query
3. `supabase_schema.sql` ফাইলের সব কোড paste করুন → Run

## ধাপ ৩: Demo Data Load করুন
1. SQL Editor → New Query
2. `demo_data.sql` ফাইলের সব কোড paste করুন → Run

## ধাপ ৪: Login Fix (গুরুত্বপূর্ণ!)
Email confirmation ছাড়া লগইন করতে:
- Supabase Dashboard → Authentication → Providers → Email
- **"Confirm email"** অপশনটি **বন্ধ** করুন (uncheck)
- Save করুন

## ধাপ ৫: Local server চালু করুন
```bash
npm run dev
```
Browser-এ খুলুন: http://localhost:5173

## ধাপ ৬: Admin access পান
রেজিস্ট্রেশনের পর:
- Supabase → Table Editor → profiles
- আপনার user খুঁজুন → `role` column → `super_admin` করুন
- এরপর /admin পেজ দেখতে পারবেন

## ধাপ ৭: Vercel Deploy
```bash
npm run build
```
- vercel.com-এ `dist` folder আপলোড করুন
- অথবা GitHub repo connect করুন
- Environment Variables যোগ করুন:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
