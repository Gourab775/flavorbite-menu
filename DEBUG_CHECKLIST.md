# Quick Debug Checklist

Use this checklist when troubleshooting the "Network issue" error.

## Console Logs to Check

Open DevTools Console and look for:

```
✅ SUCCESS SIGNS:
[MENU] query: slug = demo-restaurant
[MENU] result: data = found
[MENU] result: error = none
[MENU] success

❌ FAILURE SIGNS & FIXES:

1. [MENU] result: data = null, error = none
   → Restaurant record doesn't exist in database
   → FIX: Run migration file 001_init_schema.sql in Supabase

2. [MENU] result: error = <some error message>
   → Could be RLS blocking or connection issue
   → FIX: Check RLS policies and Supabase credentials

3. [MENU] Network error: <message>
   → Network connectivity problem
   → FIX: Check internet connection and Supabase status
```

## Database Verification Queries

Copy & paste these in Supabase SQL Editor:

### 1. Check if restaurants table exists and has demo-restaurant
```sql
SELECT id, name, slug, logo FROM public.restaurants 
WHERE slug = 'demo-restaurant' LIMIT 1;
```

Expected: 1 row with demo-restaurant

### 2. Check RLS policies on restaurants
```sql
SELECT policyname, cmd, using_expr 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'restaurants';
```

Expected: "public read restaurants" policy with `USING (true)`

### 3. Test direct query (as anonymous user)
```sql
SELECT id, name, slug FROM public.restaurants 
WHERE slug = 'demo-restaurant' LIMIT 1;
```

Expected: 1 row (same as step 1)

### 4. Check all required tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('restaurants', 'categories', 'menu_items', 'featured_items')
ORDER BY table_name;
```

Expected: All 4 tables listed

### 5. Count records in each table
```sql
SELECT 
  (SELECT COUNT(*) FROM restaurants) as restaurants,
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM menu_items) as menu_items,
  (SELECT COUNT(*) FROM featured_items) as featured_items;
```

Expected: restaurants ≥ 1, categories ≥ 1, menu_items ≥ 1

## Frontend Verification

### 1. Check Supabase Client Initialization
In browser console, run:
```javascript
// Check if Supabase is configured
console.log("Checking Supabase setup...");
fetch("https://yskezogjwmkmgvpstnmd.supabase.co/rest/v1/restaurants?limit=1", {
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Your anon key
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Same key
  }
})
.then(r => r.json())
.then(d => console.log("Response:", d));
```

### 2. Check .env Variables
```javascript
console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log("VITE_RESTAURANT_SLUG:", import.meta.env.VITE_RESTAURANT_SLUG);
```

All three should be defined.

## Step-by-Step Fix

1. [ ] Run migration: `supabase/migrations/001_init_schema.sql`
2. [ ] Verify restaurants exist: SELECT query from section "Database Verification Queries" #1
3. [ ] Verify RLS policies exist: SELECT query from section #2
4. [ ] Verify .env has all required variables
5. [ ] Clear browser cache (DevTools → Application → Clear storage)
6. [ ] Hard refresh page (Ctrl+Shift+R)
7. [ ] Check console logs for [MENU] success messages
8. [ ] If still failing, run diagnostic queries #3, #4, #5

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `data = null, error = none` | Table/row missing | Run migration 001_init_schema.sql |
| `error: RLS violation` | RLS policy blocking | Check RLS policy has `USING (true)` |
| `error: connection refused` | Wrong Supabase URL | Verify VITE_SUPABASE_URL in .env |
| `error: invalid JWT` | Wrong anon key | Verify VITE_SUPABASE_ANON_KEY in .env |
| `No categories found` | Data not seeded | Migration creates categories automatically |
| `Empty menu items list` | Category IDs mismatch | Run migration to create with correct IDs |

## Still Stuck?

1. Check browser DevTools → Application → Local Storage for stored slug
2. Verify URL is exactly: `https://qr-menu-app-gamma.vercel.app/demo-restaurant`
3. Try different browser or incognito mode (rules out cache issues)
4. Check Supabase Dashboard for any status alerts
5. Review Supabase logs: Dashboard → Logs → Database logs
