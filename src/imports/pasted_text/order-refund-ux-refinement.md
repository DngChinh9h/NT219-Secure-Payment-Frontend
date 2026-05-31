Refine the customer order and refund experience UI/UX.

Current context:
The customer side already has My Orders with statuses like Awaiting Payment, Processing, Paid, Failed, Refunded.

New design direction:
Customer should manage orders like a normal e-commerce platform. Refund should become its own clear customer feature, not hidden awkwardly inside transactions/receipts.

Do not redesign the whole app from scratch.
Keep the current visual style.
Focus on improving order status clarity and adding a proper Refund Requests experience.

==================================================
1. CLARIFY ORDER PAYMENT STATUSES
==================================================

Refine the My Orders page to make payment/order states clearer.

Statuses should be customer-friendly:

- Awaiting Payment
  Meaning: order created, payment has not started or payment needs retry.
  Primary action: Pay now.

- Processing
  Meaning: payment is being confirmed by provider.
  Primary action: View details.
  Secondary text: “Payment confirmation is in progress.”

- Paid
  Meaning: payment completed successfully.
  Actions: View details, View receipt, Request refund if eligible.

- Payment Failed
  Meaning: payment was not completed. Customer was not charged.
  Actions: Retry payment, View details.
  Show helper text in detail view:
  “The payment was not completed, so you were not charged.”

- Refunded
  Meaning: this order has been refunded successfully.
  Actions: View details, View refund.

Avoid showing only “Failed” because it is unclear.
Use “Payment Failed” instead.

==================================================
2. PAYMENT FAILED UX
==================================================

For orders with Payment Failed status, add a clear retry flow.

In My Orders table:
- Show button: Retry payment

In order detail drawer/modal:
Show:
- Payment status: Payment Failed
- Failure reason, if available
- Message:
  “Your payment was not completed. You have not been charged.”
- Button: Retry payment

The UI should make it clear:
Customer is charged only when payment is confirmed successful.

Do not imply that failed payment means money was taken.

==================================================
3. CREATE CUSTOMER REFUND REQUESTS PAGE
==================================================

Add a new customer navigation item:

- Refund Requests

Customer navigation should become:
- Home
- Cart
- My Orders
- Refund Requests
- Account

Refund Requests page purpose:
Allow customers to view eligible orders for refund, submit refund requests, and track refund request status.

This page should feel like an e-commerce refund/return management page, not a technical payment dashboard.

==================================================
4. REFUND REQUESTS PAGE LAYOUT
==================================================

Page title:
Refund Requests

Subtitle:
Request and track refunds for eligible paid orders.

Main sections:

A. Eligible for refund

Show paid orders that can request refund.

Each card/table row:
- Order ID
- Order date
- Amount
- Provider
- Payment status
- Receipt status
- Button: Request refund

If no eligible orders:
Show empty state:
“No orders are currently eligible for refund.”

B. My refund requests

Show refund requests submitted by the customer.

Columns:
- Request ID
- Order ID
- Amount
- Reason
- Status
- Submitted at
- Last updated
- Actions

Actions:
- View details
- Cancel request, only if still pending review

==================================================
5. REFUND REQUEST STATUS DESIGN
==================================================

Refund request statuses should be separate from order statuses.

Use these customer-facing statuses:

1. Pending Review
Meaning:
The request was submitted and is waiting for admin review.

UI:
Yellow/amber badge.
Text:
“Your refund request is waiting for review.”

2. Approved / Processing
Meaning:
Admin approved the request, and the refund is being processed by the payment provider.

UI:
Blue badge.
Text:
“Your refund was approved and is being processed.”

3. Refunded
Meaning:
Refund completed successfully.

UI:
Green badge.
Text:
“Refund completed successfully.”

Show:
- Refund ID
- Refunded at
- Amount refunded

4. Rejected
Meaning:
Admin rejected the request.

UI:
Red badge.
Text:
“Your refund request was rejected.”

Must show:
- Admin rejection reason
- Reviewed at
- Reviewed by, if available

5. Provider Failed
Meaning:
Admin approved the refund, but the payment provider could not complete it.

UI:
Red/orange badge.
Text:
“The refund could not be completed by the payment provider.”

Show:
- System message
- Provider message if available
- Suggested action: “Please contact support.”

6. Cancelled
Meaning:
Customer cancelled the request before review.

UI:
Gray badge.

==================================================
6. REQUEST REFUND MODAL
==================================================

When customer clicks Request refund, open a modal.

Modal title:
Request refund

Show:
- Order ID
- Order amount
- Payment provider
- Payment date
- Receipt status

Fields:
- Refund reason dropdown:
  - Duplicate order
  - Wrong item
  - Changed my mind
  - Payment issue
  - Other
- Additional details textarea

Before submit, show note:
“Submitting this request does not immediately refund the payment. It will be reviewed by our operations team.”

Buttons:
- Cancel
- Submit request

After submit:
Show success toast:
“Refund request submitted.”

Do not show technical provider/refund API details to customer.

==================================================
7. ORDER DETAIL REFUND SECTION
==================================================

In My Orders detail drawer/modal, add a Refund section.

For Paid order:
Show:
- Refund eligibility: Eligible
- Button: Request refund

For Pending/Processing:
Show:
- Refund eligibility: Not available yet
- Reason: “Refund is available only after payment is completed.”

For Payment Failed:
Show:
- Refund eligibility: Not needed
- Reason: “The payment was not completed, so no refund is needed.”

For Refunded:
Show:
- Refund status: Refunded
- Refund ID
- Refunded at
- Refund reason

For existing pending refund request:
Show:
- Refund request status: Pending Review
- Submitted at
- View request

==================================================
8. CUSTOMER COPY RULES
==================================================

Use simple customer-friendly wording.

Good wording:
- Payment completed
- Payment failed
- You were not charged
- Retry payment
- Request refund
- Refund request submitted
- Waiting for review
- Refund approved
- Refund completed
- Request rejected
- Provider could not complete refund

Avoid:
- webhook
- provider payload
- transaction internals
- JWS
- HMAC
- audit hash
- payment intent
- nonce
- raw JSON

Technical details belong to admin pages only.

==================================================
9. ADMIN SIDE REFUND UI ADJUSTMENT
==================================================

Do not remove admin Refunds page.

Refine admin Refunds page to support the customer refund request concept.

Admin Refunds should show:
- Incoming refund requests
- Pending review
- Approved/processing
- Rejected
- Provider failed
- Completed refunds

Admin actions:
- View request
- Approve
- Reject

Reject modal:
- Rejection reason is required
- Optional internal note

Approve modal:
- Confirm approval
- Show order/transaction summary

Do not design admin as creating a brand-new unrelated refund.
Admin should review and process customer-submitted refund requests.

==================================================
10. SECURITY / ABUSE UX NOTES
==================================================

Do not implement backend logic yet, but reflect the UX expectations.

If customer has already submitted a pending refund request for an order:
- Disable Request refund button
- Show:
  “A refund request for this order is already under review.”

If customer submits too many refund requests:
- Show a clean error state:
  “Too many refund requests. Please try again later or contact support.”

If order is not eligible:
- Show reason clearly.

==================================================
11. FINAL EXPECTED CUSTOMER FLOW
==================================================

Customer flow should become:

My Orders
→ View paid order
→ Request refund
→ Submit reason
→ Refund Requests page
→ Track status:
   Pending Review
   Approved / Processing
   Refunded
   Rejected
   Provider Failed

Payment failed flow:

My Orders
→ Payment Failed order
→ View details
→ Message: “You were not charged”
→ Retry payment

==================================================
FINAL RESULT
==================================================

The customer side should feel like a normal e-commerce platform:

- Orders page for tracking purchases
- Refund Requests page for refund management
- Payment failed orders can be retried
- Customers clearly understand whether they were charged or not
- Refund status is separate and easy to understand

Do not overcomplicate the customer UI with admin/payment internals.
Keep the design clean, professional, and customer-friendly.