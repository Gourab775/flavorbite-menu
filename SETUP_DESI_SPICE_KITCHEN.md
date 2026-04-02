# ✅ Setup for Desi Spice Kitchen (Your Real Restaurant Data)

## Current Status

You have a real restaurant in Supabase:
- **Name:** Desi Spice Kitchen
- **Slug:** `desi-spice-kitchen`
- **ID:** `f9324acc-ea1e-47ae-9ebc-9a66c61cd53b`
- **Payment ID:** `70033785556@ybl`

Your app's `.env` is already configured to use this restaurant.

---

## What Was Just Updated

### 1. ✅ Updated Migration File
**File:** `supabase/migrations/001_init_schema.sql`

**Changes:**
- Now **preserves** your existing restaurant data
- Only creates missing tables and indexes
- Only adds missing columns to restaurants table
- Sets up RLS policies (critical for access)
- No longer inserts demo data (respects your real data)

### 2. ✅ Updated .env Configuration
**File:** `.env`

**Added:**
```
VITE_RESTAURANT_SLUG=desi-spice-kitchen
```

Your app now defaults to loading Desi Spice Kitchen instead of demo-restaurant.

---

## Next Steps (Follow This Order)

### Step 1: Run the Updated Migration (5 minutes)

⚠️ **IMPORTANT:** You MUST run this migration to set up RLS policies. Without RLS policies, the app cannot access your restaurant data.

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `supabase/migrations/001_init_schema.sql`
4. Click **Run**

**What it does:**
- ✅ Ensures all tables exist (won't delete your data)
- ✅ Adds missing indexes
- ✅ Creates RLS policies (this is the critical part)
- ✅ Displays your current restaurants

**Expected output:**
```
Current restaurants in database:
id | name | slug | payment_id
f9324acc-ea1e-47ae-9ebc-9a66c61cd53b | Desi Spice Kitchen | desi-spice-kitchen | 70033785556@ybl
```

### Step 2: Verify RLS Policies Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

You should see:
```
categories        | public read categories
featured_items    | public read featured_items
menu_items        | public read menu_items
restaurants       | public read restaurants
```

If you don't see these, **the migration didn't work** - contact support.

### Step 3: Verify Your Restaurant Data Exists

Run this in Supabase SQL Editor:

```sql
-- Check your restaurant exists
SELECT id, name, slug FROM public.restaurants 
WHERE slug = 'desi-spice-kitchen';

-- Check categories linked to your restaurant
SELECT id, name FROM public.categories 
WHERE restaurant_id = 'f9324acc-ea1e-47ae-9ebc-9a66c61cd53b'
ORDER BY sort_order;

-- Check menu items linked to your restaurant
SELECT id, name, price FROM public.menu_items 
WHERE restaurant_id = 'f9324acc-ea1e-47ae-9ebc-9a66c61cd53b'
LIMIT 5;
```

All three queries should return results. If any return empty, you need to add categories and menu items for your restaurant.

### Step 4: Clear Browser Cache & Test

1. Open your app
2. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to hard refresh
3. You should be redirected to `/desi-spice-kitchen`
4. Open DevTools Console (F12)
5. Look for:
   ```
   [MENU] query: slug = desi-spice-kitchen
   [MENU] result: data = found
   [MENU] result: error = none
   [MENU] success
   ```

### Step 5: Verify Menu Loads

The menu page should display:
- ✅ Your restaurant name (Desi Spice Kitchen)
- ✅ Categories from your database
- ✅ Menu items with names and prices
- ✅ No error messages

---

## Critical: What If Menu Items Aren't Showing?

If the restaurant loads but you see an empty menu, it means your categories and/or menu items are missing. Check with these queries:

**Check how many categories you have:**
```sql
SELECT COUNT(*) as category_count FROM public.categories 
WHERE restaurant_id = 'f9324acc-ea1e-47ae-9ebc-9a66c61cd53b';
```

**Check how many menu items you have:**
```sql
SELECT COUNT(*) as item_count FROM public.menu_items 
WHERE restaurant_id = 'f9324acc-ea1e-47ae-9ebc-9a66c61cd53b';
```

**If both return 0:**
You need to create categories and menu items. See the section "Adding Your Menu Data" below.

---

## Adding Your Menu Data

### If You Have Categories But No Menu Items

First, get your category IDs:
```sql
SELECT id, name FROM public.categories 
WHERE restaurant_id = 'f9324acc-ea1e-47ae-9ebc-9a66c61cd53b';
```

Then insert menu items:
```sql
INSERT INTO public.menu_items (
  restaurant_id, 
  category_id, 
  name, 
  price, 
  description, 
  is_veg, 
  is_available
)
VALUES (
  'f9324acc-ea1e-47ae-9ebc-9a66c61cd53b',
  '<category_id_here>',  -- Replace with actual category ID
  'Butter Chicken',
  350,
  'Chicken in creamy tomato sauce',
  false,
  true
);
```

### If You Have No Categories

Create categories first:
```sql
INSERT INTO public.categories (restaurant_id, name, sort_order)
VALUES
  ('f9324acc-ea1e-47ae-9ebc-9a66c61cd53b', 'Starters', 1),
  ('f9324acc-ea1e-47ae-9ebc-9a66c61cd53b', 'Mains', 2),
  ('f9324acc-ea1e-47ae-9ebc-9a66c61cd53b', 'Desserts', 3),
  ('f9324acc-ea1e-47ae-9ebc-9a66c61cd53b', 'Beverages', 4)
ON CONFLICT DO NOTHING;
```

Then get the new category IDs and insert menu items.

---

## URL Routing Guide

After the fix, use these URLs:

| URL | What Happens |
|-----|--------------|
| `/` | Redirects to `/desi-spice-kitchen` (default from .env) |
| `/desi-spice-kitchen` | Loads Desi Spice Kitchen menu |
| `/desi-spice-kitchen/t/table5` | Loads Desi Spice Kitchen with table 5 |
| `/desi-spice-kitchen/cart` | Shows cart |
| Any other slug | Shows "Restaurant not found" with helpful error |

---

## Troubleshooting

### "Unable to load menu" error appears

**Check console for specific error message:**
```
[MENU] result: error = Database error: ...
```

**Common causes & fixes:**

1. **"RLS violation"**
   - RLS policies weren't created
   - Fix: Run the migration again

2. **"Restaurant desi-spice-kitchen not found"**
   - Restaurant data exists but query can't access it
   - Fix: Check RLS policies exist (see Step 2 above)

3. **"Invalid JWT" or "401 Unauthorized"**
   - Supabase anon key is wrong
   - Fix: Verify VITE_SUPABASE_ANON_KEY in .env matches Supabase

### Menu loads but no items shown

**Root cause:** Categories exist but menu items don't

**Fix:** Add menu items (see "Adding Your Menu Data" section above)

### Still seeing demo-restaurant URL

**Root cause:** Browser cache has old redirect

**Fix:** 
1. Press `Ctrl+Shift+R` or `Cmd+Shift+R` to hard refresh
2. Clear Application storage in DevTools
3. Close and reopen browser

---

## Summary of Changes Made

| File | Change | Status |
|------|--------|--------|
| `supabase/migrations/001_init_schema.sql` | Now preserves existing data | ✅ |
| `.env` | Added `VITE_RESTAURANT_SLUG=desi-spice-kitchen` | ✅ |
| `src/store/menuStore.jsx` | Better error handling | ✅ (from before) |
| `src/pages/MenuPage.jsx` | Better error UI | ✅ (from before) |
| `src/App.jsx` | Uses env variable for default slug | ✅ (from before) |

---

## One-Minute Quick Start

1. **Supabase SQL Editor:** Run `supabase/migrations/001_init_schema.sql`
2. **Browser:** Hard refresh (Ctrl+Shift+R)
3. **DevTools Console:** Check for `[MENU] success`
4. **URL:** You'll be at `/desi-spice-kitchen`

✅ Done!

---

## Need Help?

**Step 1:** Check console logs - they now show specific errors instead of generic "Network issue"

**Step 2:** Run the verification queries in Supabase SQL Editor (from Step 1-3 above)

**Step 3:** Check `DEBUG_CHECKLIST.md` for detailed troubleshooting

**Step 4:** Ensure RLS policies exist (most common issue)