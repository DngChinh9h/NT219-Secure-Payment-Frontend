Refine the customer-side navigation and order experience.

Current issue:
The customer UI currently has separate pages for:
- My Orders
- Transactions
- Receipts

This is too much for a normal customer shopping experience. A customer does not need to think in terms of separate technical transaction and receipt pages. They only need to manage their orders and see payment/receipt/refund information inside each order.

Goal:
Make the customer side feel more like a real online shopping platform such as Shopee, Lazada, Tiki, or Shopify customer order history.

Do not redesign the entire app from scratch.
Keep the current visual style.
Focus on simplifying customer navigation and merging Transactions/Receipts into My Orders.

==================================================
CUSTOMER NAVIGATION CHANGE
==================================================

Update customer navigation to:

- Home
- Cart
- My Orders
- Account

Remove these from the main customer navigation:
- Transactions
- Receipts

Important:
Transactions and receipts should still exist as information, but they should be shown inside the order detail view, not as separate top-level customer pages.

Admin navigation should NOT be simplified this way.
Admin can still have:
- Orders
- Transactions
- Payments
- Refunds
- Provider Events
- Security Operations
- Audit Trail
- Settings

==================================================
MY ORDERS PAGE REFINEMENT
==================================================

The My Orders page should become the central place for customers to manage everything after purchase.

Main My Orders table/list should show:

- Order ID
- Created date
- Amount
- Status
- Payment provider
- Last updated
- Actions

Filters:
- All
- Awaiting Payment
- Processing
- Paid
- Failed
- Refunded

Actions per order:
- View details
- Pay now, only if order is awaiting payment / pending
- View receipt, only if receipt exists
- Request refund, only if eligible

==================================================
ORDER DETAIL DRAWER / MODAL
==================================================

When the customer clicks “View”, open a right-side drawer or modal with full order details.

Use tabs or clearly separated sections:

1. Order Summary

Show:
- Order ID
- Created date
- Current status
- Items/products
- Quantity
- Unit price
- Total amount
- Shipping address

2. Payment

Show:
- Transaction ID, if available
- Payment provider
- Payment amount
- Payment status
- Provider reference
- Created date
- Refund status

This replaces the old separate Transactions page for customers.

3. Receipt

Show:
- Receipt status: Available / Not available
- Receipt issued date
- Button: View receipt
- Button: Verify receipt
- Verification result:
  - Authentic
  - Invalid or modified
  - Unable to verify

Do not show raw JWS receipt by default.
Raw receipt should be inside an expandable section called “Technical details”.

This replaces the old separate Receipts page for customers.

4. Refund

Show:
- Refund eligibility
- Refund reason dropdown/input
- Request refund button
- Refund result if already refunded:
  - Refund ID
  - Refunded at
  - Refund reason
  - Updated transaction status
  - Updated order status

If refund is not allowed, show a clear reason:
- “Only successful paid transactions can be refunded.”
- “This transaction has already been refunded.”
- “Receipt is not available yet.”
- “Payment is still processing.”

==================================================
CUSTOMER UX RULES
==================================================

Customer should not see:
- raw provider events
- webhook logs
- audit trail
- security checks
- raw JSON
- technical payment internals

Customer should see simple language:
- Awaiting payment
- Payment completed
- Payment failed
- Receipt available
- Refund processed
- Refund not available

Avoid:
- “JWS”
- “Webhook”
- “HMAC”
- “Audit hash chain”
- “Provider event payload”
on customer-facing screens.

Technical receipt details can be hidden in expandable “Technical details”.

==================================================
ROUTING EXPECTATION
==================================================

Remove top-level customer routes from the navigation:
- /transactions
- /receipts

Options:
1. Keep the route files internally if needed, but do not show them in customer navigation.
2. Prefer moving their UI into My Orders detail drawer.
3. If user directly opens /transactions or /receipts, redirect to /orders or show a simple message:
   “Transactions and receipts are now available inside each order.”

==================================================
ADMIN SIDE
==================================================

Do not remove admin Transactions or admin Provider Events.

Admin still needs separate pages for:
- Transactions
- Payments
- Refunds
- Provider Events
- Security Operations
- Audit Trail

This simplification is only for customer-facing UI.

==================================================
FINAL RESULT
==================================================

After this change, the customer experience should be:

Shop → Cart → Checkout → My Orders → View Order Details

Inside each order detail, the customer can:
- see payment transaction
- view receipt
- verify receipt
- request refund if eligible

The app should feel less like a technical payment dashboard for customers and more like a real online shopping platform.