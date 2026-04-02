# 🚨 CRITICAL FIX - Cannot Find demo-restaurant (Use desi-spice-kitchen Instead)

## What's Happening RIGHT NOW

**Your screenshot shows:**
```
URL: /demo-restaurant
Error: Restaurant "demo-restaurant" not found
Console: data = null, error = none
```

**Why:**
1. Your database has `desi-spice-kitchen` (not demo-restaurant)
2. RLS policies are missing (causing `null` response with no error)
3. App is defaulting to wrong slug OR using cached slug

## Immediate Fix (Choose One)

### Option A: Clear Cache & Force Correct Slug (2 minutes)

1. **Open DevTools** (F12)
2. **Application tab** → **Local Storage**
3. **Find & delete:** `restaurantSlug` key
4. **Hard refresh:** `Ctrl+Shift+R` or `Cmd+Shift+R`
5. **Wait:** App should redirect to `/desi-spice-kitchen`

✅ If this works, your problem is solved!

### Option B: Navigate Directly to Correct URL (30 seconds)

Instead of `/demo-restaurant`, go to:
```
https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen
```

**But this won't work until RLS policies are added.**

## The Core Issue: RLS Policies Missing

**This is why queries return `null` with no error:**

When you query Supabase without RLS policies, one of two things happens:
1. ✅ Policy exists → Returns data or error
2. ❌ Policy missing → Returns `null` silently (confusing!)

**Your logs show option 2 is happening:**
```
[MENU] result: data = null
[MENU] result: error = none    ← No error = RLS policy missing!
```

## The Real Solution: Run the Migration NOW

**This is CRITICAL and must be done:**

1. Open Supabase Dashboard
2. SQL Editor → New Query
3. **Copy this exact SQL** (this is the minimal required fix):

```sql
-- Enable RLS and add public read policies
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read restaurants" ON public.restaurants;
CREATE POLICY "public read restaurants" ON public.restaurants
    FOR SELECT USING (true);

-- Verify it worked
SELECT COUNT(*) as policy_count FROM pg_policies 
WHERE tablename = 'restaurants' AND schemaname = 'public';
```

4. Click **Run**
5. Should see: `policy_count = 1`

6. **Then run the full migration:**
   Copy: `supabase/migrations/001_init_schema.sql`
   Paste in new SQL Editor query
   Click Run

## Why This Fixes It

**Before Migration:**
```
Query: SELECT * FROM restaurants WHERE slug = 'desi-spice-kitchen'
Result: null (RLS blocks all access when no policy exists)
App Error: "Restaurant not found"
```

**After Migration:**
```
Query: SELECT * FROM restaurants WHERE slug = 'desi-spice-kitchen'
Result: {id: ..., name: "Desi Spice Kitchen", slug: "desi-spice-kitchen", ...}
App: Loads successfully!
```

## Step-by-Step: The ONLY Things You Need to Do

### Step 1: Clear Cache (1 minute)
```
1. F12 → Application → Local Storage
2. Delete "restaurantSlug" key
3. Hard refresh (Ctrl+Shift+R)
```

### Step 2: Run RLS Policy Query (2 minutes)
```
1. Supabase SQL Editor
2. Copy the SQL above (from "Enable RLS..." section)
3. Run it
4. Verify result shows policy_count = 1
```

### Step 3: Run Full Migration (2 minutes)
```
1. New SQL query
2. Copy supabase/migrations/001_init_schema.sql
3. Run it
```

### Step 4: Hard Refresh Browser (30 seconds)
```
Ctrl+Shift+R or Cmd+Shift+R
Verify console shows [MENU] success
```

**Total time: ~5 minutes**

## What You Should See After This

### In Console:
```
✅ [MENU] query: slug = desi-spice-kitchen
✅ [MENU] result: data = found
✅ [MENU] result: error = none
✅ [MENU] success
```

### On Page:
```
✅ Menu page loads
✅ "Desi Spice Kitchen" header visible
✅ Categories and items display (if you added them)
✅ No error message
```

### URL:
```
✅ https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen
```

## Why Demo-Restaurant Keep Showing?

The app defaults to `demo-restaurant` because:
1. Either `.env` isn't loaded (app uses hardcoded fallback)
2. Or `restaurantSlug` is stored in localStorage from before

**Both are fixed by:**
- Step 1: Clear localStorage cache
- Step 2-3: Run migrations (enables RLS)
- Step 4: Hard refresh

## Verify This Will Work

Before running migrations, verify your restaurant exists:

```sql
SELECT id, name, slug FROM public.restaurants 
WHERE slug = 'desi-spice-kitchen';
```

Should return:
```
f9324acc-ea1e-47ae-9ebc-9a66c61cd53b | Desi Spice Kitchen | desi-spice-kitchen
```

If this returns 0 rows: Your restaurant data is missing and needs to be added manually.

## Critical RLS Policy SQL

If you just want the minimum fix without full migration, run **this exact query first:**

```sql
-- CREATE RESTAURANT POLICY (MINIMUM REQUIRED)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read restaurants" ON public.restaurants;
CREATE POLICY "public read restaurants" ON public.restaurants
    FOR SELECT USING (true);

-- CREATE CATEGORIES POLICY
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read categories" ON public.categories;
CREATE POLICY "public read categories" ON public.categories
    FOR SELECT USING (true);

-- CREATE MENU ITEMS POLICY
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read menu_items" ON public.menu_items;
CREATE POLICY "public read menu_items" ON public.menu_items
    FOR SELECT USING (true);

-- CREATE FEATURED ITEMS POLICY
ALTER TABLE public.featured_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read featured_items" ON public.featured_items;
CREATE POLICY "public read featured_items" ON public.featured_items
    FOR SELECT USING (true);

-- VERIFY
SELECT COUNT(*) as total_policies FROM pg_policies 
WHERE schemaname = 'public';
```

Should return: `total_policies = 4`

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| `data = null, error = none` | RLS policies missing | Run RLS policy SQL |
| App shows `/demo-restaurant` | Wrong default or cached | Clear localStorage |
| Can't find restaurant | Correct restaurant is `desi-spice-kitchen` | Change URL to correct slug |

**Next step:** Follow the 4 steps above in order.

---

## If Still Stuck After This

1. **Verify restaurant exists:**
   ```sql
   SELECT COUNT(*) FROM public.restaurants 
   WHERE slug = 'desi-spice-kitchen';
   ```
   Should return: `1`

2. **Verify RLS policies exist:**
   ```sql
   SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public';
   ```
   Should return: `4` (one for each table)

3. **Test raw query:**
   ```sql
   SELECT * FROM public.restaurants 
   WHERE slug = 'desi-spice-kitchen' LIMIT 1;
   ```
   Should return your restaurant

4. **Check console:**
   Open DevTools → Console
   Look for actual error message in `[MENU]` logs
   Copy/paste it for diagnosis

If all 3 queries return data but app still fails: Network issue, clear cache harder or try incognito mode.