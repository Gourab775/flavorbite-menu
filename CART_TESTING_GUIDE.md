# Cart Page - Complete Testing Guide

## Cart System Overview

The cart system is fully functional with the following features:

### Core Features Implemented:
1. ✅ Add items to cart from menu
2. ✅ Increase/decrease quantity with stepper buttons
3. ✅ Remove items from cart
4. ✅ Clear entire cart
5. ✅ Persistent cart storage (localStorage)
6. ✅ Order notes/special instructions
7. ✅ Real-time bill calculation (Subtotal, GST 5%, Total)
8. ✅ Checkout flow (with table ID support)
9. ✅ Cart bar showing items count and total
10. ✅ Two payment options: Pay at Counter, Pay Online

## Recent Fixes Applied:
- ✅ Fixed navigation to include slug and tableId correctly
- ✅ Cart now properly handles with/without table ID scenarios
- ✅ Environment variable support for restaurant selection

## Step-by-Step Testing Guide

### Test 1: Add Items to Cart
1. Navigate to `http://localhost:5173/desi-spice-kitchen`
2. Browse the menu (should show 13 categories, 69 items)
3. Click "Add" button on any menu item
4. Should see toast: "Added to cart"
5. Cart bar should appear at bottom showing `1 item` and price

### Test 2: Quantity Management
1. On the same menu item, click + button to increase quantity
2. Quantity should increase in the stepper
3. Cart bar should update total price
4. Click - button to decrease
5. When quantity reaches 0, item should be removed from cart

### Test 3: Navigate to Cart Page
1. Click the cart bar at bottom (shows total items and price)
2. Should navigate to `/desi-spice-kitchen/cart`
3. Page should show:
   - "My Cart" header with back button
   - All items with images, names, prices
   - Clear button in top right
   - Item cards showing:
     - Item image
     - Veg/Non-veg indicator
     - Item name
     - Remove button
     - Quantity stepper
     - Line total (price × qty)
   - Bill Summary section showing:
     - Subtotal
     - GST & Tax (5%)
     - Total
   - "Add note for your order..." textarea
   - "Proceed to Checkout" button at bottom

### Test 4: Cart Item Management
1. On cart page, click + to increase item quantity
2. Line total and Bill Summary should update immediately
3. Click - to decrease
4. Click "Remove" button - item should be removed
5. Bill Summary should update
6. Click "Clear" button - all items should be removed
7. Should see empty cart screen: "Your cart is empty"

### Test 5: Order Notes
1. Add items to cart again
2. In the textarea, type a note: "Extra spicy, no onions"
3. Notes should persist when you leave and return to cart page
4. Notes should be cleared when cart is cleared

### Test 6: Checkout Flow (Counter Payment)
1. On cart page with items, click "Proceed to Checkout"
2. Should navigate to `/desi-spice-kitchen/checkout`
3. Page should show:
   - Back button (goes to cart)
   - All items with quantities and totals
   - Bill summary
   - Two payment buttons:
     - "Pay at Counter" (💳)
     - "Pay Online" (📱)
4. Click "Pay at Counter"
5. Should show loading spinner
6. Should navigate to waiting page: `/desi-spice-kitchen/waiting/{orderId}`

### Test 7: Checkout Flow (Online Payment)
1. Go back to menu (may need to reload)
2. Add different items to cart
3. Go to checkout
4. Click "Pay Online"
5. Should navigate to payment page: `/desi-spice-kitchen/payment/{orderId}`
6. Page should have payment UI/integration

### Test 8: Cart with Table ID
1. If testing with QR table link: `/desi-spice-kitchen/t/{tableId}`
2. Add items to cart
3. Cart should work the same way
4. All navigation should include the tableId
5. When checking out, cart should send tableId with order

### Test 9: Cart Persistence
1. Add items to cart
2. Refresh the page (F5)
3. Cart should still have the same items
4. Quantities should be preserved
5. Navigate to menu and back
6. Cart should be intact
7. Close browser tab and reopen site
8. Cart should persist (localStorage)

### Test 10: Multiple Items
1. Add 3-4 different items to cart
2. Increase some quantities to 2-3 each
3. Cart should show all items correctly
4. Bill should calculate properly:
   - Subtotal = sum of (price × qty) for all items
   - Tax = Subtotal × 0.05
   - Grand Total = Subtotal + Tax
5. Remove one item
6. Bill should recalculate immediately

## Expected Calculations Example:
```
Item 1: ₹100 × 2 = ₹200
Item 2: ₹150 × 1 = ₹150
Item 3: ₹200 × 3 = ₹600
─────────────────────────
Subtotal: ₹950
GST (5%): ₹47.50 → rounds to ₹48
─────────────────────────
Total: ₹998
```

## Known Issues / Edge Cases to Handle:
- Empty cart shows appropriate message ✅
- Cart persists across page reloads ✅
- Veg/non-veg indicators display correctly ✅
- Images load with skeleton placeholders ✅
- Sold out items show tag and disable add button ✅
- Toast notifications for add/remove/clear ✅

## Browser Console Checks:
When testing, open DevTools (F12) and check:
1. No JavaScript errors
2. Console should show "[MENU] success" when loading restaurant
3. Network requests to Supabase should succeed (check Network tab)
4. localStorage should contain:
   - `qr_menu_cart`: cart data
   - `restaurantSlug`: current slug
   - `tableId`: table ID if applicable
5. sessionStorage should contain:
   - `cart_order_note`: order notes
   - `tableId`: table ID for current session

## Testing Tips:
- Clear localStorage between tests if you want a fresh cart
- Use different restaurants if available (slug in URL)
- Test with and without table ID
- Test on mobile viewport (DevTools device mode)
- Test image loading with slow network (DevTools throttling)

## Success Criteria:
✅ All items add to cart correctly
✅ Cart calculations are accurate
✅ Navigation works with correct slugs and table IDs
✅ Cart persists across page reloads
✅ Checkout creates orders in Supabase
✅ No console errors
✅ All UI updates happen in real-time
✅ Toast notifications appear and disappear
✅ Empty cart state displays correctly
