# Fix Summary: Supabase 406 "Restaurant not found" Error

## Issue
The app was displaying "Network issue – Check your connection and try again" on initial load because:
- Console showed: `[MENU] result: data = null` with `error = none`
- This indicates the `restaurants` table was missing or had no data
- RLS policies were either missing or blocking access without returning an error

## Root Cause
The Supabase database was not properly initialized. Previous SQL files only contained fixes for existing tables but didn't define the complete schema from scratch.

## Solution Applied

### 1. Complete Database Schema ✅
**File:** `supabase/migrations/001_init_schema.sql` (NEW)
- Created all necessary tables: restaurants, categories, menu_items, featured_items
- Added proper indexes on slug columns for fast lookups
- Enabled Row Level Security (RLS) on all tables
- Created public read policies: `USING (true)` for public access
- Seeded demo data: demo-restaurant with 4 categories and 6 sample menu items

### 2. Better Error Diagnostics ✅
**File:** `src/store/menuStore.jsx`
- Changed from `.select().eq()` to `.select().eq().maybeSingle()` for safer queries
- Added detailed console logging to distinguish between:
  - RLS blocking (returns error)
  - Network failure (throws exception)
  - Missing data (returns null cleanly)
  - Database errors (returns error object)
- Improved error messages to show actual problem to users

### 3. Enhanced Error UI ✅
**File:** `src/pages/MenuPage.jsx`
- Replaced generic "Network issue" message with actual error text
- Added error icon for visual clarity
- Added "Check console for detailed error logs" hint
- Shows specific diagnostics message

### 4. Environment Variable Support ✅
**File:** `src/App.jsx`
- Changed hardcoded `DEFAULT_SLUG = "demo-restaurant"` to read from `.env`
- Falls back to "demo-restaurant" if VITE_RESTAURANT_SLUG not set

## Files Changed
1. `supabase/migrations/001_init_schema.sql` - NEW FILE
2. `src/store/menuStore.jsx` - Enhanced error handling
3. `src/pages/MenuPage.jsx` - Better error UI
4. `src/App.jsx` - Environment variable support
5. `SUPABASE_FIX.md` - Complete fix guide (NEW)
6. `DEBUG_CHECKLIST.md` - Troubleshooting checklist (NEW)

## Next Steps for User

### Immediate Action Required
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase/migrations/001_init_schema.sql`
3. Paste into SQL editor and click "Run"
4. Expected result: Setup Complete message with table counts

### Verification
Run these queries in Supabase SQL Editor:
```sql
-- Check demo-restaurant exists
SELECT id, slug, name FROM public.restaurants WHERE slug = 'demo-restaurant';

-- Check RLS policy exists
SELECT policyname FROM pg_policies WHERE tablename = 'restaurants';

-- Count total records
SELECT 
  (SELECT COUNT(*) FROM restaurants) as restaurants,
  (SELECT COUNT(*) FROM categories) as categories;
```

### Testing
1. Clear browser cache and hard refresh
2. Check console for `[MENU] success` message
3. Menu should load with demo data (4 categories, 6 items)

## What Was Actually Broken

The issue manifested as:
```
[MENU] query: slug = demo-restaurant
[MENU] result: data = null
[MENU] result: error = none
[MENU] ilike: found = null
```

This pattern means: **The query executed successfully (no error) but returned no rows**

Possible causes:
- ❌ Table doesn't exist → Migration fixes this
- ❌ No rows in table → Migration seeds demo data
- ❌ RLS blocking without error → Migration creates permissive RLS
- ❌ Column names wrong → Migration uses correct schema

## Validation

After applying the fix, you should see:
```
✅ [MENU] query: slug = demo-restaurant
✅ [MENU] result: data = found
✅ [MENU] result: error = none
✅ [MENU] success
✅ Menu displays with categories and items
```

## Technical Details

### Why `maybeSingle()` over `.single()`?
- `.single()` throws error if 0 or >1 rows
- `.maybeSingle()` returns null for 0 rows, only errors for >1
- Safer for development where records might not exist

### Why `USING (true)` in RLS?
- Allows public read access for anonymous users
- Development/testing setting
- Production should use role-based policies
- Example: `USING (auth.role() = 'authenticated')` for authenticated users

### Why slug as unique index?
- Restaurant slugs must be unique (one URL per restaurant)
- Index makes lookups fast O(log n) instead of O(n)
- Prevents duplicate slugs in data

## Troubleshooting

**Still showing "Network issue"?**
1. Check browser console for exact error message
2. Run verification queries from Supabase SQL Editor
3. Verify .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
4. See DEBUG_CHECKLIST.md for step-by-step diagnosis

**Menu items not showing?**
1. Check categories exist: `SELECT COUNT(*) FROM categories;`
2. Check items exist: `SELECT COUNT(*) FROM menu_items;`
3. Check foreign keys match:
   ```sql
   SELECT m.*, c.id FROM menu_items m 
   LEFT JOIN categories c ON m.category_id = c.id 
   WHERE c.id IS NULL;
   ```

## Performance Implications

- Index on `slug` column: ✅ Fast lookups (O(log n))
- RLS enabled: ✅ Secure by default, permissive policy for now
- Query optimization: ✅ Fetches only needed columns
- Caching: ✅ Existing menuCache continues to work

## Security Notes

Current RLS setup with `USING (true)`:
- Allows public read access (suitable for public restaurant menus)
- Production should require authentication
- No write permissions for anon users

Example production setup:
```sql
-- Only authenticated users can read
ALTER POLICY "public read restaurants" ON restaurants
  USING (auth.role() = 'authenticated');
```

## Testing Checklist

After applying the fix:
- [ ] Run migration in Supabase SQL Editor
- [ ] Clear browser cache
- [ ] Visit /demo-restaurant URL
- [ ] Check console shows [MENU] success
- [ ] Menu displays 4 categories
- [ ] Menu displays 6 items
- [ ] "Try again" button works
- [ ] No error messages shown