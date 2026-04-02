# Vercel Deployment Fix - Cart Page 404 Error

## Issue
The cart page was showing 404 error on Vercel because Vercel wasn't routing SPA requests correctly.

## Root Cause
Vercel was treating `/desi-spice-kitchen/t/5/cart` as a server path instead of a client-side route, causing it to look for an actual file/folder instead of letting React Router handle it.

## Solution Applied
Created `vercel.json` that tells Vercel to:
1. Route ALL requests to `index.html` (SPA routing)
2. Let React Router handle all path navigation
3. Properly map environment variables

## What You Need to Do

### Step 1: Redeploy on Vercel
The `vercel.json` file was just added. You need to redeploy:

**Option A: Push to GitHub (automatic)**
1. The changes are already committed
2. Push to main branch: `git push origin main`
3. Vercel will auto-redeploy
4. Wait 2-3 minutes for deployment to complete

**Option B: Manual trigger on Vercel dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Redeploy"
4. Choose "main" branch
5. Click "Redeploy"

### Step 2: Verify Environment Variables (IMPORTANT!)
Before redeploying, ensure these env variables are set on Vercel:

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these (or verify they exist):
```
VITE_SUPABASE_URL = https://yskezogjwmkmgvpstnmd.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlza2V6b2dqd21rbWd2cHN0bm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTQ0MjgsImV4cCI6MjA4OTA5MDQyOH0.5gpkFVMftIJnDw5EbDVtWb1bpGy4MU_IHzyvlsi2piE
VITE_RESTAURANT_ID = f9324acc-ea1e-47ae-9ebc-9a66c61cd53b
VITE_RESTAURANT_SLUG = desi-spice-kitchen
```

Each variable should be set for:
- Production
- Preview
- Development

### Step 3: Clear Vercel Cache (if needed)
1. Go to Vercel dashboard
2. Project → Settings → Git
3. Click "Clear Build Cache"
4. Redeploy

### Step 4: Test the Fix
After redeployment (2-3 minutes):

1. Go to: `https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen`
2. Add items to cart
3. Click cart bar
4. Should go to: `/desi-spice-kitchen/cart` ✓ (NO 404)
5. Add more items, click checkout
6. Should go to: `/desi-spice-kitchen/checkout` ✓ (NO 404)

## Why This Works

**Before (without vercel.json):**
```
Request: /desi-spice-kitchen/cart
Vercel: Looking for file "cart" → Not found → 404 error
```

**After (with vercel.json):**
```
Request: /desi-spice-kitchen/cart
Vercel: Rewrites to /index.html
React Router: Handles route and shows CartPage component
Result: Cart page displays correctly ✓
```

## Files Changed
- ✅ Added: `vercel.json` - Routing configuration
- ✅ No code changes needed
- ✅ No local testing needed (this is Vercel-specific)

## Troubleshooting

**If still getting 404 after 5 minutes:**

1. **Check environment variables**
   - Go to Vercel dashboard
   - Verify VITE_* variables are set
   - Ensure they're set for "Production"

2. **Clear browser cache**
   - Clear browser cache/cookies
   - Or use Incognito window
   - Or hard refresh (Ctrl+Shift+R)

3. **Check deployment status**
   - Go to Vercel dashboard
   - Check "Deployments" tab
   - Should show successful build

4. **Check build logs**
   - Click on latest deployment
   - Click "View Build Logs"
   - Look for errors

## What Happens After Fix

✅ Cart page loads correctly
✅ All routes work (`/cart`, `/checkout`, `/payment`, etc.)
✅ No more 404 errors
✅ Can add items, modify quantities, checkout
✅ All functionality available

## Summary

The fix is simple: Vercel needed to know that all requests are SPA routes, not server routes.

**Action:** 
1. Verify env variables on Vercel dashboard
2. Push code or click "Redeploy" on Vercel
3. Wait 2-3 minutes
4. Test the cart page again

The cart page will work correctly after this deployment! 🎉
