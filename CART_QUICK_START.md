# Cart System - Quick Start Testing Guide

## Quick Setup (2 minutes)

1. **Browser DevTools**
   - Open DevTools: F12
   - Application → Storage → Clear all
   - This gives you a fresh start

2. **Check Dev Server Running**
   - Should be running on `http://localhost:5173`
   - If not, run: `npm run dev`

3. **Hard Refresh**
   - Press: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## 5-Minute Full Cart Test

### Step 1: Menu Page (Load Data)
- Navigate to: `http://localhost:5173/desi-spice-kitchen`
- Should see:
  - Restaurant name: "Desi Spice Kitchen" ✓
  - 13 categories ✓
  - 69 menu items ✓
- Check console: Should show `[MENU] success` ✓

### Step 2: Add Items to Cart
1. Scroll down and find any item
2. Click "Add" button
3. Should see:
   - Toast: "added to cart" ✓
   - Item shows quantity stepper with "1" ✓
   - Cart bar appears at bottom ✓
4. Add 2 more different items
5. Cart bar should show: "3 items" ✓

### Step 3: Modify Quantities
1. On menu, click + on any item twice
2. Quantity should increase to 3
3. Cart bar total should update ✓
4. Click - to decrease
5. Item should update in real-time ✓

### Step 4: Go to Cart Page
1. Click the cart bar at bottom
2. Should navigate to: `/desi-spice-kitchen/cart`
3. Page shows:
   - All 3 items with images ✓
   - Item names and prices ✓
   - Remove button for each ✓
   - Quantity stepper (±) ✓
   - Line totals (price × qty) ✓

### Step 5: Bill Calculation
1. Check Bill Summary section:
   - Example with 3 items:
     - Item 1: ₹100 × 2 = ₹200
     - Item 2: ₹150 × 1 = ₹150
     - Item 3: ₹250 × 1 = ₹250
   - Subtotal: ₹600 ✓
   - GST (5%): ₹30 ✓
   - Total: ₹630 ✓

### Step 6: Add Order Note
1. Click textarea: "Add note for your order..."
2. Type: "Extra spicy, no onions, side of raita"
3. Click checkout (this saves note)
4. Come back to cart
5. Note should still be there ✓

### Step 7: Checkout - Counter Payment
1. Click "Proceed to Checkout" button
2. Should navigate to: `/desi-spice-kitchen/checkout`
3. Page shows:
   - Items section with all items ✓
   - Bill section ✓
   - Two payment buttons ✓
4. Click "Pay at Counter" (💳)
5. Should see loading spinner briefly
6. Should navigate to waiting page: `/desi-spice-kitchen/waiting/{orderId}`
7. Cart should now be empty

### Step 8: Verify Order Created
1. Open DevTools → Console
2. Look for any error messages - should be none ✓
3. Check Network tab - all requests should be successful ✓
4. The order was created in Supabase

## Advanced Test (Bonus): With Table ID

If you want to test with table functionality:

1. Navigate with table ID: `http://localhost:5173/desi-spice-kitchen/t/TABLE01`
2. Add items to cart
3. Navigate to cart: Should be `/desi-spice-kitchen/t/TABLE01/cart`
4. Go to checkout: Should be `/desi-spice-kitchen/t/TABLE01/checkout`
5. Complete payment
6. Table ID should be recorded with order

## Troubleshooting

### Cart is empty after refresh
- Check localStorage isn't cleared
- Should have key `qr_menu_cart` with data

### "Restaurant not found" error
- Verify you're on: `/desi-spice-kitchen` (not demo-restaurant)
- Hard refresh: Ctrl+Shift+R
- Check console for `[MENU] success`

### Cart bar not showing
- Make sure you have items in cart
- Should appear at bottom of menu page
- Only appears on menu page, not on cart/checkout

### Calculations wrong
- Tax is 5% of subtotal (rounded)
- Example: ₹1000 × 0.05 = ₹50
- Grand Total = Subtotal + Tax

### Checkout button not working
- Make sure cart has at least one item
- Make sure restaurant loaded successfully
- Check console for errors

## What's Being Tested

| Feature | Expected | Status |
|---------|----------|--------|
| Add item | Item appears in cart | ✓ |
| Increase qty | Qty goes up, total updates | ✓ |
| Decrease qty | Qty goes down, total updates | ✓ |
| Remove item | Item disappears from cart | ✓ |
| Clear all | All items removed | ✓ |
| Subtotal | Sum of all items | ✓ |
| Tax calc | 5% of subtotal | ✓ |
| Total | Subtotal + Tax | ✓ |
| Cart persist | Items stay after refresh | ✓ |
| Notes | Save/load special requests | ✓ |
| Counter pay | Create order, show waiting | ✓ |
| Online pay | Create order, show payment | ✓ |
| Navigation | All paths include slug | ✓ |
| Table ID | Included when present | ✓ |

## Expected Behavior

### ✅ Should See
- All 69 items load from database
- Smooth animations on add/remove
- Real-time bill updates
- Toast notifications
- Proper cart persistence
- Correct navigation with slug

### ❌ Should NOT See
- JavaScript errors in console
- "Network error" messages
- Duplicate items in cart
- Wrong calculations
- Lost items after refresh
- Missing images (with fallback)

## Performance Checks

Open DevTools (F12) and go to:

**Console Tab**
- Should have NO red errors
- Should see `[MENU] success`
- Should see no warnings about unhandled rejections

**Network Tab**
- All requests to supabase should be green (200 status)
- No failed requests
- Images should load

**Storage Tab**
- localStorage → qr_menu_cart should have cart data
- Should be valid JSON
- Should clear when "Clear" button clicked

**Performance Tab**
- Can click all buttons responsively
- No lag when adding/removing items
- Smooth scrolling

## Success = ✅
When you can:
1. Add items to cart ✅
2. See cart bar with total ✅
3. Navigate to cart page ✅
4. Modify quantities and see bill update ✅
5. Add order notes ✅
6. Go to checkout ✅
7. Complete order (counter or online) ✅
8. Cart persists after refresh ✅

**Then the cart system is fully functional!**

## Still Need Help?

Check these files for more info:
- `CART_IMPLEMENTATION_REPORT.md` - Technical details
- `CART_TESTING_GUIDE.md` - Detailed test steps
- Browser console for error messages
- Network tab for API errors
