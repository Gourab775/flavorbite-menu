# Supabase Data Fetching Fix Guide

## Problem Summary

The app was showing "Network issue – Check your connection and try again" error on initial load, with console logs showing:
- `[MENU] result: data = null`
- `[MENU] result: error = none`
- `[MENU] ilike: found = null`

The queries were returning `null` without any error, indicating one of these issues:
1. **Missing `restaurants` table** in the database
2. **Missing `demo-restaurant` row** in the restaurants table
3. **Missing or restrictive Row Level Security (RLS) policies** blocking access
4. **Incorrect table schema** (missing or misnamed columns)

## Root Cause

The Supabase database was not properly initialized with the required tables and data. The migration files only contained fix scripts for existing tables but didn't define the initial schema.

## Solution Implemented

### 1. Created Complete Database Schema Migration

**File:** `supabase/migrations/001_init_schema.sql`

This migration file includes:
- ✅ Complete `restaurants` table with `slug` as unique index
- ✅ `categories` table linked to restaurants
- ✅ `menu_items` table linked to both restaurants and categories
- ✅ `featured_items` table for promotional content
- ✅ Row Level Security (RLS) **enabled on all tables**
- ✅ **Public read policies** on all tables (allows anonymous access)
- ✅ Seed data for `demo-restaurant` with sample categories and menu items

### 2. Improved Error Handling in MenuStore

**File:** `src/store/menuStore.jsx`

Enhanced logging to distinguish between different failure modes:
- **RLS blocking:** Returns error message
- **Network error:** Returns network-specific error
- **Missing data:** Returns user-friendly message with restaurant slug
- **Database error:** Returns detailed error message

Changed from:
```javascript
// Old: Unclear error messages
dispatch({ type: "SET_ERROR", payload: "Restaurant not found" });
```

To:
```javascript
// New: Specific diagnostic messages
dispatch({ 
  type: "SET_ERROR", 
  payload: `Restaurant "${slug}" not found. Please check the slug and ensure the restaurant exists in the database.` 
});
```

### 3. Enhanced MenuPage Error UI

**File:** `src/pages/MenuPage.jsx`

Improved error state display to show:
- Clear error icon
- Actual error message from the backend
- "Try again" button to retry
- Hint to check console for detailed logs

### 4. Updated Default Restaurant Slug

**File:** `src/App.jsx`

Changed from hardcoded slug to environment variable:
```javascript
// Old
const DEFAULT_SLUG = "demo-restaurant";

// New
const DEFAULT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || "demo-restaurant";
```

## How to Apply the Fix

### Step 1: Run the Database Migration

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/migrations/001_init_schema.sql`
5. Paste it into the SQL editor
6. Click **Run**

Expected result:
```
Setup Complete! | restaurant_count: 2 | category_count: 4 | menu_item_count: 6
```

### Step 2: Verify the Data Was Created

Run this query in the SQL Editor to verify:

```sql
-- Check restaurants
SELECT id, name, slug FROM public.restaurants;

-- Check categories
SELECT id, restaurant_id, name FROM public.categories;

-- Check menu items
SELECT id, name, price FROM public.menu_items LIMIT 10;

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

You should see:
- 2 restaurants (demo-restaurant, desi-spice-kitchen)
- 4 categories (Starters, Mains, Desserts, Beverages)
- 6 menu items
- 4 RLS policies (one for each table)

### Step 3: Verify .env Configuration

Ensure your `.env` file has:

```
VITE_SUPABASE_URL=https://yskezogjwmkmgvpstnmd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_RESTAURANT_SLUG=demo-restaurant
```

### Step 4: Clear Browser Cache & Reload

1. Clear application cache in DevTools (Application → Clear storage)
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Visit the app URL: `https://localhost:5173/demo-restaurant`

### Step 5: Check Console Logs

You should now see success logs like:
```
[MENU] query: slug = demo-restaurant
[MENU] result: data = found
[MENU] result: error = none
[MENU] success
```

## Troubleshooting

### Still seeing "Network issue" error?

1. **Check RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```
   Ensure you see 4 policies with `USING (true)` for public read.

2. **Check Restaurant Slug:**
   ```sql
   SELECT slug FROM public.restaurants WHERE slug = 'demo-restaurant';
   ```
   Ensure it returns exactly one row with lowercase slug.

3. **Check Supabase Credentials:**
   - Verify `VITE_SUPABASE_URL` matches your project
   - Verify `VITE_SUPABASE_ANON_KEY` is correct
   - Use `npx supabase status` to verify connection

4. **Enable Verbose Logging:**
   Add this to check Supabase client initialization:
   ```javascript
   console.log("[DEBUG] Supabase URL:", supabaseUrl);
   console.log("[DEBUG] Supabase Configured:", isSupabaseConfigured);
   ```

### No menu items showing?

This could mean:
- Categories exist but menu items are missing
- Menu items exist but category IDs don't match
- RLS policy on menu_items is too restrictive

Run this diagnostic query:
```sql
SELECT 
  c.name as category,
  COUNT(m.id) as item_count
FROM categories c
LEFT JOIN menu_items m ON m.category_id = c.id
WHERE c.restaurant_id = '00000000-0000-0000-0000-000000000001'
GROUP BY c.name;
```

## What Changed

### Database Layer
- Tables now have proper schema with correct column types and constraints
- All tables have unique indexes for fast lookups
- RLS is enabled but allows public read (permissive)
- Foreign key constraints ensure data integrity

### Frontend Layer
- Better error messages with context about what failed
- Separate handling for RLS errors, network errors, and missing data
- Enhanced UI feedback showing actual error messages instead of generic text
- Better logging for debugging

### Configuration
- Default slug now reads from environment variable
- Supports multiple restaurant slugs without code changes

## Files Modified

1. ✅ `supabase/migrations/001_init_schema.sql` - NEW (complete schema + seed data)
2. ✅ `src/store/menuStore.jsx` - Enhanced error handling and logging
3. ✅ `src/pages/MenuPage.jsx` - Improved error UI
4. ✅ `src/App.jsx` - Use environment variable for default slug

## Next Steps

### Production Deployment
1. Ensure RLS policies are appropriate for your security needs
2. Consider tightening policies from `USING (true)` to role-based checks
3. Set up automated backups in Supabase dashboard
4. Test with production environment variables

### Future Improvements
- Add pagination to menu items query
- Implement caching strategy for better performance
- Add restaurant-level feature flags
- Monitor query performance with slow query logs

## References

- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- Supabase JavaScript Client: https://supabase.com/docs/reference/javascript
- Database Schema Design Best Practices: https://www.postgresql.org/docs/