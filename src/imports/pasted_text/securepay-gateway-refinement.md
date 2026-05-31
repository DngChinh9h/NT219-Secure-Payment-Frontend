Refine the existing SecurePay Gateway frontend.

The current UI already has customer pages and admin pages. Do not redesign everything from scratch unless necessary. Keep the current product direction, but make the frontend feel more like a real near-production e-commerce + payment operations platform.

Main goal:
Customer side should feel like a normal online shopping platform.
Admin side should feel like a serious payment operations and security monitoring dashboard.

Do not make the customer UI look like a test/demo tool.
Move test/sandbox/security controls away from customer pages and into admin/security operations pages.

==================================================
GLOBAL REFINEMENT GOALS
=======================

Improve:

* visual polish
* spacing
* typography
* component consistency
* status badges
* table readability
* loading/error/empty states
* role separation
* customer/admin navigation clarity
* real product feel

Avoid:

* exposing technical/security implementation details on customer pages
* showing raw JSON by default
* showing test controls to normal customers
* showing “Approve payment / Decline payment / Keep pending” as normal customer choices
* making the app look like a classroom demo

Use product-like language:

* Payment completed
* Payment failed
* Refund processed
* Receipt verified
* Sync completed
* Action required
* Provider callback processed
* Audit trail healthy

Avoid demo-like language:

* Test this
* Fake payment
* Teacher demo
* Click here to prove security
* JWT/AES/HMAC/nonce as main UI labels

==================================================
CUSTOMER SIDE REFINEMENT
========================

Customer pages should feel similar to Shopee/Lazada/Tiki/modern checkout.

Customer navigation:

* Home
* Shop
* Cart
* My Orders
* Transactions
* Receipts
* Account

Do not show admin/security operations links to customer users.

1. Shop page

Make it feel more like a real storefront:

* better product cards
* product image placeholders
* product name
* short description
* price in VND
* add to cart
* view details
* search/filter area

Avoid making all products feel like technical test items. Use a balanced product catalog.

2. Cart page

Improve:

* quantity controls
* remove item
* subtotal
* shipping address
* create order button
* empty cart state

Add clear empty state:
“Your cart is empty. Start shopping to add products.”

3. Checkout page

This page needs important refinement.

For normal customer view:
Payment methods should look like real methods:

* Card payment
* Bank transfer / Sandbox bank only if environment is clearly sandbox

Do not show “Approve payment”, “Decline payment”, “Keep pending” as normal customer choices.

Better behavior:

* For customer, show “Sandbox Bank” as a payment method only if sandbox mode is enabled.
* If sandbox mode is shown, place approve/decline/pending inside a small developer/sandbox panel, not as the main customer payment experience.
* Use a visual environment badge: “Sandbox environment”.

Card section:

* Show a clean secure card input area for Stripe Elements.
* Do not design raw card number fields that imply our backend collects card data.
* Use wording:
  “Card details are handled securely by the payment provider.”

Order summary:

* show items
* amount
* shipping address
* order ID
* status badge
* payment provider

Order timeline:

* Created
* Awaiting payment
* Processing
* Paid
* Refunded

4. My Orders page

Improve table/list readability.

Order card/table should show:

* Order ID
* Date
* Amount
* Status
* Payment provider
* Actions

Actions:

* View details
* Continue payment if pending
* View receipt if paid
* Request refund if eligible

Add order detail drawer/modal:

* items
* shipping address
* payment timeline
* linked transaction
* receipt status
* refund status

5. Transactions page

Make it customer-friendly.

Show:

* transaction ID
* order ID
* amount
* status
* provider
* created date
* refund status

Actions:

* View receipt
* Verify receipt
* Request refund if eligible

Do not show provider raw payload or internal webhook data here.

6. Receipts page

Customer should not see raw JWS by default.

Show readable receipt:

* receipt status
* transaction ID
* order ID
* amount
* currency
* issued date

Raw receipt should be hidden in:
“Technical details”

Receipt verification result:

* Authentic
* Invalid or modified
* Unable to verify

==================================================
ADMIN SIDE REFINEMENT
=====================

Admin side should be more operational and less decorative.

Admin navigation:

* Overview
* Orders
* Transactions
* Payments
* Refunds
* Provider Events
* Security Operations
* Audit Trail
* Settings

Admin should not have unsafe manual actions:

* no “force paid”
* no “edit transaction amount”
* no “show secret key”
* no “show private key”
* no direct manipulation of security secrets

Admin can:

* view orders
* view transactions
* sync payment status with provider
* process eligible refunds
* verify receipts
* inspect provider events
* verify audit trail
* run controlled security checks

1. Admin Overview

Improve dashboard cards:

* Total payments
* Successful payments
* Failed payments
* Refunds
* Pending provider events
* Security health status

Add:

* recent operations feed
* payment status distribution
* provider breakdown

2. Admin Orders

Add better filters:

* all
* pending
* processing
* paid
* failed
* refunded

Add detail drawer:

* order summary
* customer
* items
* transaction
* provider reference
* timeline

Admin actions:

* View details
* Sync payment if needed
* View transaction

No manual “mark as paid”.

3. Admin Transactions

Improve table:

* transaction ID
* order ID
* customer
* provider
* amount
* status
* refund status
* created date

Actions:

* View details
* Verify receipt
* Sync related payment
* Refund if eligible

Use modal/drawer for transaction details.

4. Admin Refunds

Make refund page look operational.

Show:

* eligible transaction selector
* reason dropdown
* confirmation modal
* refund result
* refund history table

Refund history:

* refund ID
* transaction ID
* amount
* reason
* status
* processed at
* provider

5. Provider Events

This page should replace checking webhook logs manually.

Show provider events in a table:

* Event ID
* Provider
* Event type
* Payment reference
* Processing status
* Received at
* Processed at
* Error

Statuses:

* Received
* Processed
* Failed
* Duplicate

Filters:

* All
* Processed
* Failed
* Duplicate
* Stripe
* Mock provider

Add event detail drawer:

* event summary
* related order
* related transaction
* processing result
* error message
* raw payload hidden in expandable technical details

==================================================
SECURITY OPERATIONS / ADMIN EVIDENCE
====================================

This is the most important admin page.

Rename or present it as:
“Security Operations”

Purpose:
Allow admin to monitor and safely test important payment/security guarantees through the UI, instead of using Postman manually.

This page should be practical, not decorative.

Do not make the main UI a list of technologies.
Do not use cards titled JWT, AES, HMAC, RS256, Nonce, Hash Chain.
Those can appear only in expandable technical details.

Main sections:

1. Security Health Overview

Cards:

* Receipt authenticity
* Audit trail integrity
* Provider callback processing
* Duplicate payment protection
* Refund protection
* Access control checks

Each card:

* Status: Healthy / Warning / Failed / Not checked
* Last checked time
* Short business explanation
* Action button if useful

Example copy:

* “Receipts can be verified for authenticity.”
* “Audit records have not been modified.”
* “Provider callbacks are being processed successfully.”
* “Duplicate payment attempts are rejected.”
* “Refunds are restricted to eligible transactions.”

2. Run Security Checks

Create a panel with controlled checks:

* Verify audit trail
* Verify receipt
* Check duplicate payment protection
* Check provider sync
* Check failed provider events
* Check refund protection
* Check access control evidence

Each check result should show:

* Check name
* PASS / FAIL
* Expected result
* Actual result
* Timestamp
* Related order/transaction if applicable

Example:
Check: Duplicate payment protection
Expected: A second payment attempt should be rejected
Actual: Rejected with conflict status
Result: PASS

3. Audit Trail Integrity

Show:

* current status
* checked records count
* last verification time
* button: Verify audit trail

Result:

* Audit trail verified successfully
* Audit trail verification failed

4. Receipt Authenticity

Admin can:

* paste a receipt
* verify it
* see readable decoded receipt data
* see invalid result if tampered

5. Duplicate Payment Protection

Admin can:

* select a paid order
* run a controlled duplicate payment check
* see expected result and actual result

Make clear this is an admin security validation tool, not a customer action.

6. Refund Protection

Admin can:

* select refunded transaction
* check that second refund is rejected
* see PASS / FAIL result

7. Access Control Evidence

Show recent access control events if available:

* cross-user access blocked
* admin action performed
* refund permission checked
* receipt verification performed

If backend endpoint is not available yet, prepare the UI and service placeholders.

==================================================
STATE HANDLING
==============

Add polished states for:

* loading
* empty list
* API error
* token expired
* unauthorized
* forbidden
* payment failed
* webhook pending
* receipt invalid
* refund not eligible
* action succeeded
* action failed

Use toast notifications consistently.

==================================================
ROLE SEPARATION
===============

Customer should not see admin sidebar/pages.

Admin may access admin dashboard.

If a customer tries to access admin route:

* show forbidden page
* redirect to customer dashboard

If user is not logged in:

* redirect to login

==================================================
CONFIG AND API INTEGRATION RULES
================================

* Do not hardcode Stripe publishable key.
* Load public config from backend through configService.
* Use one API base URL from environment variable.
* Do not scatter API URLs across components.
* Keep API calls inside service files.
* Do not store secrets in frontend.
* Do not show secret environment variables.
* Do not send raw card data to backend.
* Keep token handling centralized.

Expected service layer:

* authService
* productService
* cartService
* orderService
* paymentService
* transactionService
* receiptService
* adminService
* configService

==================================================
FINAL RESULT
============

The refined frontend should feel like:

Customer side:
A clean online shopping platform with secure checkout.

Admin side:
A professional payment operations and security monitoring dashboard.

The app should no longer feel like a test/demo page.
It should feel like a real product that happens to have a strong security operations backend.
