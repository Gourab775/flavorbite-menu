# Cart System - Visual Flow Diagrams

## User Journey Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QR MENU - CART SYSTEM FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

START: User Scans QR Code
  │
  ├─→ /desi-spice-kitchen
  │   ├─→ Loads restaurant "Desi Spice Kitchen"
  │   ├─→ Shows 13 categories
  │   └─→ Shows 69 menu items
  │
  ├─→ Browse Menu
  │   ├─→ View item details
  │   └─→ See item image, price, description
  │
  ├─→ Add Items
  │   ├─→ Click "Add" button
  │   ├─→ Item qty stepper shows (+ -)
  │   ├─→ Cart bar appears at bottom
  │   └─→ Toast: "Item added"
  │
  ├─→ Modify Quantities
  │   ├─→ Click + to increase
  │   ├─→ Click - to decrease
  │   ├─→ Bill updates in real-time
  │   └─→ Cart bar updates total
  │
  ├─→ View Cart
  │   ├─→ Click cart bar or "View Cart"
  │   ├─→ Navigate to: /desi-spice-kitchen/cart
  │   ├─→ See all items with images
  │   ├─→ See line totals
  │   └─→ See bill summary
  │
  ├─→ Add Order Notes
  │   ├─→ Type special instructions
  │   ├─→ Example: "Extra spicy, no onions"
  │   └─→ Notes persist until checkout
  │
  ├─→ Review Bill
  │   ├─→ Subtotal (sum of items)
  │   ├─→ GST & Tax (5% of subtotal)
  │   ├─→ Grand Total
  │   └─→ Sticky button shows total
  │
  ├─→ Proceed to Checkout
  │   ├─→ Click "Proceed to Checkout"
  │   ├─→ Navigate to: /desi-spice-kitchen/checkout
  │   ├─→ Review items and bill again
  │   └─→ Choose payment method
  │
  ├─→ ┌─────────────────────────────────┐
  │   │   CHOOSE PAYMENT METHOD         │
  │   └─────────────────────────────────┘
  │
  ├─→ Payment Option 1: Counter (💳)
  │   ├─→ Click "Pay at Counter"
  │   ├─→ Order created in database
  │   ├─→ Status: "pending"
  │   ├─→ Payment mode: "counter"
  │   ├─→ Order code generated: "ORD-XXXX"
  │   ├─→ Navigate to: /desi-spice-kitchen/waiting/{orderId}
  │   ├─→ Show waiting screen with order details
  │   ├─→ Kitchen receives order immediately
  │   ├─→ Pay cash or card at counter when ready
  │   └─→ Customer walks up when called
  │
  └─→ Payment Option 2: Online (📱)
      ├─→ Click "Pay Online"
      ├─→ Order created in database
      ├─→ Status: "pending"
      ├─→ Payment mode: "online"
      ├─→ Order code generated: "ORD-XXXX"
      ├─→ Navigate to: /desi-spice-kitchen/payment/{orderId}
      ├─→ Show payment UI (UPI)
      ├─→ Customer completes payment
      ├─→ Order confirmed after payment
      ├─→ Kitchen receives confirmed order
      └─→ Customer waits for pickup (online-waiting screen)
```

---

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    CART STATE MANAGEMENT                     │
└──────────────────────────────────────────────────────────────┘

REACT CONTEXT (useCart)
    │
    ├─→ cart: Item[]
    │   ├─→ Stores all items with quantities
    │   ├─→ Updated by: addToCart, increaseQty, decreaseQty, removeFromCart, clearCart
    │   └─→ Synced to: localStorage (automatic)
    │
    ├─→ totalItems: number
    │   ├─→ Calculated from: sum of all quantities
    │   └─→ Displayed in: cart bar, checkout
    │
    ├─→ subtotal: number
    │   ├─→ Calculated from: sum(price × qty)
    │   └─→ Used to calculate: tax and total
    │
    ├─→ tax: number
    │   ├─→ Calculated from: subtotal × 0.05
    │   └─→ Displayed in: bill summary
    │
    ├─→ grandTotal: number
    │   ├─→ Calculated from: subtotal + tax
    │   └─→ Displayed in: checkout, cart bar
    │
    ├─→ vegMode: boolean
    │   ├─→ Toggle veg-only items
    │   └─→ Used by: menu filter
    │
    └─→ searchQuery: string
        ├─→ Search text entered
        └─→ Used by: menu search

LOCAL STORAGE
    │
    ├─→ qr_menu_cart
    │   ├─→ Stores: { items: Item[] }
    │   ├─→ Updated: automatically when cart changes
    │   ├─→ Loaded: on app startup
    │   └─→ Persists: across browser sessions
    │
    └─→ restaurantSlug
        ├─→ Stores: current restaurant slug
        └─→ Persists: current context

SESSION STORAGE
    │
    ├─→ tableId
    │   ├─→ Stores: current table ID
    │   └─→ Cleared: when session ends
    │
    └─→ cart_order_note
        ├─→ Stores: special instructions
        └─→ Cleared: when cart cleared
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                      LIVE ORDERS TABLE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  id (UUID)                - Unique order ID                │
│  restaurant_id (UUID)     - Which restaurant               │
│  items (JSON)             - Array of ordered items         │
│  table (TEXT)             - Table number if dine-in        │
│  status (TEXT)            - pending/ready/completed        │
│  payment_mode (TEXT)      - counter/online                 │
│  order_code (TEXT)        - ORD-XXXX code for display      │
│  total_price (DECIMAL)    - Grand total amount             │
│  note (TEXT)              - Special instructions           │
│  created_at (TIMESTAMP)   - When order was placed          │
│  updated_at (TIMESTAMP)   - When order was updated         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Items Structure in JSON:
┌──────────────────────────────────────────────┐
│ [                                            │
│   {                                          │
│     "id": "item-uuid",                      │
│     "name": "Samosa",                       │
│     "price": 50,                            │
│     "quantity": 2,                          │
│     "is_veg": true                          │
│   },                                         │
│   {                                          │
│     "id": "item-uuid",                      │
│     "name": "Chicken Tikka",               │
│     "price": 200,                           │
│     "quantity": 1,                          │
│     "is_veg": false                         │
│   }                                          │
│ ]                                            │
└──────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App (Root)
  │
  ├─→ CartProvider (provides useCart context)
  │   │
  │   ├─→ MenuProvider (provides useMenu context)
  │   │   │
  │   │   ├─→ MenuPage
  │   │   │   ├─→ Header
  │   │   │   ├─→ SearchBar
  │   │   │   ├─→ CategorySlider
  │   │   │   ├─→ MenuItemCard (repeats for each item)
  │   │   │   │   └─→ Add button / Qty stepper
  │   │   │   └─→ CartBar (sticky, bottom)
  │   │   │
  │   │   ├─→ CartPage
  │   │   │   ├─→ Header (back, clear buttons)
  │   │   │   ├─→ CartItemCard (repeats for each item)
  │   │   │   │   ├─→ Item image
  │   │   │   │   ├─→ Remove button
  │   │   │   │   └─→ Qty stepper
  │   │   │   ├─→ Order notes textarea
  │   │   │   ├─→ Bill summary
  │   │   │   └─→ Checkout button (sticky)
  │   │   │
  │   │   ├─→ CheckoutPage
  │   │   │   ├─→ Items review
  │   │   │   ├─→ Bill summary
  │   │   │   ├─→ Counter payment button
  │   │   │   └─→ Online payment button
  │   │   │
  │   │   └─→ PaymentPage / WaitingPage
  │   │       └─→ Order confirmation
  │   │
  │   └─→ Toast (notifications)
  │
  └─→ [Other Providers & Pages]
```

---

## Data Flow Diagram

```
USER ACTION                 STATE UPDATE           STORAGE           UI UPDATE
┌──────────────────┐       ┌──────────────────┐  ┌─────────────┐   ┌─────────────┐
│ Click "Add" btn  │───→   │ addToCart(item)  │  │ localStorage│   │ Cart bar    │
│                  │       │                  │  │ updated     │   │ shows item  │
└──────────────────┘       └──────────────────┘  └─────────────┘   └─────────────┘

┌──────────────────┐       ┌──────────────────┐  ┌─────────────┐   ┌─────────────┐
│ Click "+" qty    │───→   │ increaseQty()    │  │ localStorage│   │ Qty updates │
│                  │       │ recalculate:     │  │ updated     │   │ Bill updates│
│                  │       │ - subtotal       │  │             │   │             │
└──────────────────┘       │ - tax            │  └─────────────┘   └─────────────┘
                           │ - grandTotal     │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐  ┌─────────────┐   ┌─────────────┐
│ Click "Remove"   │───→   │ removeFromCart() │  │ localStorage│   │ Item removed│
│                  │       │ recalculate bill │  │ updated     │   │ Bill updates│
└──────────────────┘       └──────────────────┘  └─────────────┘   └─────────────┘

┌──────────────────┐       ┌──────────────────┐  ┌─────────────┐   ┌─────────────┐
│ Type order note  │───→   │ setOrderNote()   │  │ sessionStor.│   │ Text shown  │
│                  │       │ (sessionStorage) │  │ updated     │   │             │
└──────────────────┘       └──────────────────┘  └─────────────┘   └─────────────┘

┌──────────────────┐       ┌──────────────────┐  ┌─────────────┐   ┌─────────────┐
│ Click "Checkout" │───→   │ POST order to    │  │ Supabase DB │   │ Redirect to │
│                  │       │ Supabase         │  │ order saved │   │ waiting page│
└──────────────────┘       │ clearCart()      │  │ cart cleared│   │             │
                           └──────────────────┘  └─────────────┘   └─────────────┘
```

---

## Navigation Paths

```
Without Table ID:
├─→ /desi-spice-kitchen               (Menu page)
├─→ /desi-spice-kitchen/cart          (Cart page)
├─→ /desi-spice-kitchen/checkout      (Checkout)
├─→ /desi-spice-kitchen/payment/{id}  (Payment page)
└─→ /desi-spice-kitchen/waiting/{id}  (Waiting page)

With Table ID (QR):
├─→ /desi-spice-kitchen/t/TABLE01               (Menu + table)
├─→ /desi-spice-kitchen/t/TABLE01/cart          (Cart with table)
├─→ /desi-spice-kitchen/t/TABLE01/checkout      (Checkout with table)
├─→ /desi-spice-kitchen/t/TABLE01/payment/{id}  (Payment with table)
└─→ /desi-spice-kitchen/t/TABLE01/waiting/{id}  (Waiting with table)
```

---

## Bill Calculation Example

```
Order: 3 items
┌──────────────────────────────────────┐
│ Item 1: Samosa                       │
│ Price: ₹50 × Qty: 2 = ₹100          │
├──────────────────────────────────────┤
│ Item 2: Butter Chicken               │
│ Price: ₹250 × Qty: 1 = ₹250         │
├──────────────────────────────────────┤
│ Item 3: Naan                         │
│ Price: ₹40 × Qty: 3 = ₹120          │
└──────────────────────────────────────┘

CALCULATION:
Subtotal    = ₹100 + ₹250 + ₹120 = ₹470
Tax (5%)    = ₹470 × 0.05 = ₹23.50 → rounds to ₹24
──────────────────────────────────────
Grand Total = ₹470 + ₹24 = ₹494

STORED IN DATABASE:
{
  "total_price": 494,
  "items": [
    {"name": "Samosa", "price": 50, "quantity": 2},
    {"name": "Butter Chicken", "price": 250, "quantity": 1},
    {"name": "Naan", "price": 40, "quantity": 3}
  ]
}
```

---

## Error Handling Flow

```
USER ACTION
    │
    ├─→ Cart operation
    │   ├─→ Success → Update state → Update UI ✓
    │   └─→ Error → Show error message → Keep previous state
    │
    ├─→ Checkout operation
    │   ├─→ Validation
    │   │   ├─→ Cart not empty? ✓
    │   │   ├─→ Restaurant loaded? ✓
    │   │   └─→ All items valid? ✓
    │   │
    │   ├─→ Database insert
    │   │   ├─→ Success → Order created ✓
    │   │   └─→ Fail → Show error, keep cart
    │   │
    │   └─→ Navigate
    │       ├─→ Success → Show waiting/payment page ✓
    │       └─→ Fail → Show error toast
    │
    └─→ Network error
        ├─→ Catch & display message
        └─→ Keep cart data (won't lose order)
```

---

These diagrams show how the entire cart system works from the user's perspective through to database storage.
