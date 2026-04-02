# Vercel 404 Error - Comprehensive Debugging Guide

## Current Issue
```
GET https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/t/5/cart 404 (Not Found)
```

This error appears when trying to access the cart page with a table ID.

## Root Cause Analysis

### What We've Fixed So Far
1. ✅ **App.jsx routing** - Routes are correctly ordered (table-specific routes first)
2. ✅ **vercel.json configuration** - SPA rewrite rule is configured correctly
3. ✅ **Code is deployed** - All changes are pushed to GitHub

### What Might Still Be Wrong

The 404 error on Vercel typically means **Vercel isn't rewriting the request to index.html**. This can happen for these reasons:

#### Issue #1: Environment Variables NOT Set on Vercel Dashboard
- **Symptom:** App builds but pages show 404
- **Check:** Go to Vercel Dashboard → Project → Settings → Environment Variables
- **Fix:** Add all 4 variables for Production/Preview/Development

#### Issue #2: Vercel Deployment Not Complete
- **Symptom:** You see an old deployment running
- **Check:** Go to Vercel Dashboard → Deployments → Check if latest is "Ready" (green checkmark)
- **Fix:** Manually trigger a redeploy from the dashboard

#### Issue #3: Browser Cache
- **Symptom:** Old version of site cached in browser
- **Check:** Open in Incognito/Private window
- **Fix:** Hard refresh with Ctrl+Shift+R (or Cmd+Shift+R on Mac)

#### Issue #4: vercel.json Not Deployed Correctly
- **Symptom:** Configuration file exists locally but Vercel ignoring it
- **Check:** Make sure vercel.json is committed to GitHub and pushed
- **Fix:** Already done - file is committed and pushed

## Step-by-Step Verification Checklist

### Step 1: Verify Code Changes are Deployed
```
1. Go to https://github.com/Gourab775/qr-menu-app
2. Check the latest commits - should see:
   - "Fix vercel.json rewrite configuration for proper SPA routing"
   - "Fix critical routing order - table routes must come before non-table routes to prevent 404s"
3. If you don't see these, they haven't pushed successfully
```

### Step 2: Verify Vercel Environment Variables
```
1. Log into Vercel (https://vercel.com/dashboard)
2. Select your project "qr-menu-app"
3. Go to Settings → Environment Variables
4. You MUST see these 4 variables:
   
   Variable Name: VITE_SUPABASE_URL
   Value: https://yskezogjwmkmgvpstnmd.supabase.co
   Applied To: Production, Preview, Development
   
   Variable Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlza2V6b2dqd21rbWd2cHN0bm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTQ0MjgsImV4cCI6MjA4OTA5MDQyOH0.5gpkFVMftIJnDw5EbDVtWb1bpGy4MU_IHzyvlsi2piE
   Applied To: Production, Preview, Development
   
   Variable Name: VITE_RESTAURANT_ID
   Value: f9324acc-ea1e-47ae-9ebc-9a66c61cd53b
   Applied To: Production, Preview, Development
   
   Variable Name: VITE_RESTAURANT_SLUG
   Value: desi-spice-kitchen
   Applied To: Production, Preview, Development

5. If ANY are missing, ADD THEM NOW!
6. Once added, Vercel will automatically redeploy
```

### Step 3: Verify Deployment is Complete
```
1. Go to Vercel Dashboard → Deployments tab
2. Look at the latest deployment
3. It should have a GREEN CHECKMARK and say "Ready"
4. If it says "Building..." or "Failed", wait or click "Redeploy"
5. Wait for green checkmark before testing
```

### Step 4: Clear Browser Cache
```
1. Go to https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/t/5/cart
2. Open DevTools (F12)
3. Right-click the reload button and select "Empty Cache and Hard Reload"
4. Or: Hold Ctrl+Shift+R (or Cmd+Shift+R on Mac)
5. This forces browser to download fresh files from Vercel
```

### Step 5: Test the Routes
```
After all above are done, test these URLs:

Without table ID:
- https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen (should work ✓)
- https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/cart (should work ✓)
- https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/checkout (should work ✓)

With table ID (the problematic one):
- https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/t/5 (should work ✓)
- https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/t/5/cart (should work ✓)
- https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/t/5/checkout (should work ✓)

If any of these 404, report which ones and we'll dig deeper.
```

## What Happens Behind the Scenes (Technical Explanation)

### How SPA Routing Works on Vercel

1. **User loads** `https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/t/5/cart`
2. **Vercel server** checks: "Is there a file at `/desi-spice-kitchen/t/5/cart`?" 
3. **Answer:** No, there's no physical file there
4. **With vercel.json rewrite:** Vercel says "No file found → serve `/index.html` instead"
5. **React loads** with the full URL still showing `/desi-spice-kitchen/t/5/cart`
6. **Wouter routing** kicks in and matches the URL to the correct route
7. **CartPage component** renders for that URL

### Without vercel.json:
- Step 3 says "File not found" and returns 404 to browser
- React never loads, so routing never happens

### What We Fixed:

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This tells Vercel: "For ANY URL path, serve index.html"

**App.jsx routing (fixed order):**
```jsx
<Route path="/:slug/t/:tableId/cart" component={CartPage} />  // Specific - comes first
<Route path="/:slug/cart" component={CartPage} />              // Generic - comes second
<Route path="/:slug/*" component={NotFoundPage} />             // Catch-all - comes last
```

This tells React: "Try matching specific table-based routes before generic routes"

## Common Mistakes

❌ **Mistake #1:** Adding environment variables but not redeploying
- **Fix:** After adding env vars to Vercel dashboard, wait 30 seconds for auto-redeploy, or manually trigger it

❌ **Mistake #2:** Not using exact variable names
- **Fix:** Variable names are CASE-SENSITIVE: `VITE_SUPABASE_URL` not `vite_supabase_url`

❌ **Mistake #3:** Not setting "Applied To" fields
- **Fix:** Each variable must be applied to Production, Preview, AND Development

❌ **Mistake #4:** Using outdated browser cache
- **Fix:** Always hard refresh (Ctrl+Shift+R) after deployment changes

## Next Steps

**Complete these steps IN ORDER:**

1. [ ] Go to Vercel Dashboard
2. [ ] Go to Settings → Environment Variables
3. [ ] Add/verify all 4 VITE_* variables
4. [ ] Go to Deployments tab and wait for green checkmark
5. [ ] Hard refresh browser (Ctrl+Shift+R)
6. [ ] Try accessing `/desi-spice-kitchen/t/5/cart`
7. [ ] Report back if it works or if you see errors

## Debug URLs to Report

When reporting issues, test and tell me the results for:

```
✓ or ✗ https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen
✓ or ✗ https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/cart
✓ or ✗ https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/t/5
✓ or ✗ https://qr-menu-app-gamma.vercel.app/desi-spice-kitchen/t/5/cart
```

## Contact Vercel Support Info

If you want to debug directly with Vercel:
- https://vercel.com/support
- Include your project name: "qr-menu-app"
- Include the failing URL
- Include a screenshot of the error in browser DevTools

---

**Status:** Code changes are complete and deployed. Waiting for your Vercel dashboard configuration.
