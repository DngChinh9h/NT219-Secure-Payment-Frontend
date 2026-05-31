Design and generate a professional frontend for a secure e-commerce and payment platform named:

SecurePay Gateway

This is a near-production fintech/e-commerce web application, not a simple demo page.

The product has two main experiences:

1. Customer experience:
   A simple online shopping experience similar to Shopee, Lazada, Tiki, or a modern e-commerce checkout flow.

2. Admin / Operations experience:
   A professional payment operations and security monitoring dashboard similar to Stripe Dashboard, Shopify Admin, or Adyen Customer Area.

The customer side must feel simple, friendly, and familiar.
The admin side can be more technical, operational, and security-focused.

Do not overload the customer UI with security terms.
Do not show implementation technologies like JWT, AES, HMAC, RS256, nonce, webhook, hash chain, or audit chain on customer pages.
Those details belong in the admin/security operations area only.

Overall visual direction:

* Modern e-commerce + fintech style
* Clean, professional, premium
* Trustworthy but not overly technical
* Desktop-first, responsive for tablet and mobile
* Light theme by default
* Use subtle navy/indigo/blue accents
* Clear cards, tables, status badges, checkout panels, modals, and toast notifications
* Avoid toy/demo appearance
* Avoid showing raw JSON on normal customer screens
* Make the product feel like a real online shopping and payment platform

Recommended frontend architecture:

Generate a componentized React/Vite style project, not a single index.html file.

Suggested structure:

src/
components/
pages/
services/
hooks/
utils/
styles/
App.jsx
main.jsx

Suggested services:

* authService
* productService
* cartService
* orderService
* paymentService
* transactionService
* receiptService
* adminService
* configService

Important integration rules:

* Do not hardcode Stripe publishable key.
* Frontend should load public config from backend:
  GET /api/config/public
* Do not store secrets in frontend.
* Do not show private keys, secret keys, webhook secrets, HMAC secrets, or KMS material.
* Use one API base URL config, for example VITE_API_BASE_URL.
* Frontend may store JWT token for this lab project, but token handling must be centralized.
* Do not send raw card numbers to backend.
* Card input area should be designed for Stripe Elements or hosted card input.
* Backend owns payment confirmation, payment status, receipt creation, refund, and audit.
* Frontend should display results and call APIs, not pretend to process money itself.

==================================================
CUSTOMER SIDE
=============

Customer goal:
Allow users to shop, create orders, pay securely, track orders, view receipts, and request refunds.

The customer UI should feel like a normal online shopping platform.

Customer navigation:

* Home / Shop
* Cart
* My Orders
* Transactions
* Receipts
* Account

Do not show admin/security operations items in customer navigation.

---

1. Customer Auth

---

Create a polished login/register experience.

Login page:

Fields:

* Email
* Password

Actions:

* Login
* Link to register

Register page:

Fields:

* Email
* Password
* Full name
* Address
* Citizen ID / Identity number

UI behavior:

* Form validation states
* Password rule hints
* Success and error toasts
* After register, user should be logged in or redirected to login

Copy style:
Use natural product wording, not technical wording.

Example:
“Create your SecurePay account”
“Your personal information is protected and used only for order and payment verification.”

Avoid:
“Your data is encrypted with AES-GCM”
“JWT will be generated”

---

2. Customer Home / Shop

---

Design it like a small e-commerce storefront.

Sections:

* Hero banner
* Search bar
* Product categories
* Product grid
* Product cards

Product cards should include:

* Product image placeholder
* Product name
* Short description
* Price in VND
* Add to cart button
* View details button

Example products:

* Secure Payment Starter Kit
* Hardware Security Token
* Encrypted Data Package
* Gateway Integration Package
* Online Security Course

The product data can be mock UI data for design, but structure it so it can later be connected to API data.

---

3. Product Detail Page

---

Include:

* Product image
* Product name
* Description
* Price
* Quantity selector
* Add to cart
* Buy now

Keep it simple and familiar like Shopee/Lazada/Tiki.

---

4. Cart Page

---

Show:

* List of selected products
* Quantity controls
* Unit price
* Subtotal
* Remove item button
* Shipping address input
* Order summary card
* Create order button

Important:
The UI can display estimated total, but it should not imply that the client decides the final amount.
Use wording like:
“Final amount will be confirmed by the server when the order is created.”

---

5. Checkout / Payment Page

---

After order creation, show a clean checkout page.

Sections:

A. Order Summary

* Order ID
* Items
* Shipping address
* Amount
* Status badge

B. Payment Method
Allow user to choose:

* Card payment
* Sandbox bank provider

For Card payment:

* Reserve a clean container for Stripe Elements
* Label it “Secure card input”
* Mention naturally:
  “Card details are handled by the payment provider.”

Do not show raw card number inputs designed manually.

For Sandbox bank provider:

* Show it as “Sandbox Bank”
* It can have options:

  * Approve payment
  * Decline payment
  * Keep payment pending

Make it clear this provider is for sandbox/testing mode, but do not make the whole app feel fake.

C. Payment Result
Show:

* Payment status
* Provider reference
* Order status
* Next action

Possible states:

* Awaiting payment
* Processing
* Payment completed
* Payment failed
* Refunded

---

6. My Orders Page

---

Table/list view:

Columns:

* Order ID
* Created date
* Amount
* Status
* Payment provider
* Last updated
* Actions

Filters:

* All
* Pending
* Processing
* Paid
* Failed
* Refunded

Order detail drawer/modal:

* Items
* Shipping address
* Payment timeline
* Linked transaction
* Receipt status

Order status timeline:

* Created
* Awaiting payment
* Processing
* Paid
* Refunded

This should look like an e-commerce order tracking page.

---

7. Transactions Page

---

Customer can see their own transactions.

Table columns:

* Transaction ID
* Order ID
* Provider
* Amount
* Status
* Created date
* Refund status
* Actions

Actions:

* View details
* View receipt
* Verify receipt
* Request refund, only for eligible successful transactions

Transaction detail:

* Transaction summary
* Payment provider
* Provider reference
* Related order
* Receipt preview
* Refund information if refunded

---

8. Receipts Page

---

Customer can view and verify receipts.

Receipt list:

* Receipt ID / Transaction ID
* Order ID
* Amount
* Issued date
* Status

Receipt detail:

* Transaction ID
* Order ID
* Amount
* Currency
* Issued time
* Status

Receipt verification:

* Button: Verify receipt
* Result:

  * Authentic
  * Invalid or modified
  * Unable to verify

Do not show raw JWS by default.
Put raw receipt in an expandable “Technical details” section.

---

9. Refund Request Page

---

Customer can request refund for eligible transactions.

Fields:

* Select transaction
* Refund reason
* Confirm refund button

Refund states:

* Eligible
* Not eligible
* Refund processed
* Already refunded

Use confirmation modal:
“Refunding this transaction will update the order and transaction status. Continue?”

Show refund result:

* Refund ID
* Refunded time
* Updated transaction status
* Updated order status

==================================================
ADMIN / OPERATIONS SIDE
=======================

Admin goal:
Allow internal operators to monitor payments, investigate payment states, process valid refunds, verify receipts, inspect provider events, and validate system security evidence.

Admin should not directly manipulate money or force payments.
Admin should not have buttons like “mark as paid manually”.
Payment status must come from provider confirmation, webhook, or controlled sync.

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

---

1. Admin Overview

---

Dashboard cards:

* Total payments today
* Successful payments
* Failed payments
* Refunds
* Pending provider events
* Security checks status

Charts/summaries:

* Payment status distribution
* Provider breakdown
* Refund trend
* Failed payment trend

Recent activity feed:

* Payment completed
* Payment failed
* Refund processed
* Provider callback received
* Receipt verified
* Audit check completed

This page should feel like Stripe Dashboard or Shopify Admin, not a test page.

---

2. Admin Orders Page

---

Admin can:

* Search orders
* Filter by status
* View order details
* View related transaction
* View payment provider reference
* Sync payment status where allowed

Table:

* Order ID
* Customer
* Amount
* Status
* Provider
* Created date
* Updated date
* Actions

Order detail drawer:

* Customer info summary
* Items
* Shipping address
* Order status timeline
* Linked payment
* Linked transaction
* Receipt status
* Refund status

Do not include a “force paid” action.

---

3. Admin Transactions Page

---

Table:

* Transaction ID
* Order ID
* Customer
* Provider
* Amount
* Status
* Refund status
* Created date
* Actions

Actions:

* View details
* Verify receipt
* Sync related payment
* Process refund, only when eligible

Transaction detail:

* Provider reference
* Status history
* Receipt
* Refund info
* Related provider events
* Related audit logs

---

4. Admin Payments Page

---

Purpose:
Monitor local payment state versus provider state.

Table:

* Payment reference
* Order ID
* Provider
* Provider status
* Local order status
* Last synced
* Actions

Actions:

* Sync with provider
* View related order
* View related transaction
* View provider events

Sync result panel:

* Provider status
* Local status before sync
* Local status after sync
* Whether transaction was created or reused
* Whether duplicate creation was prevented

---

5. Admin Refunds Page

---

Purpose:
Manage valid refunds and review refund history.

Table:

* Refund ID
* Transaction ID
* Order ID
* Customer
* Amount
* Reason
* Status
* Refunded at
* Provider

Refund action:

* Select eligible transaction
* Choose reason
* Confirm refund

Important:
Admin can request a valid refund, but cannot directly edit transaction amount, private keys, card data, or force provider result.

---

6. Provider Events Page

---

This page replaces the need to inspect webhook logs manually.

Show provider callback/webhook events.

Table columns:

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

Event detail drawer:

* Event summary
* Related payment
* Related order
* Related transaction
* Processing result
* Error message if any
* Raw payload hidden in expandable technical details

---

7. Security Operations Page

---

This is the most important admin evidence page.

It should be designed as a real security and payment operations control center.

Purpose:
Allow admin to monitor and safely test important security/payment guarantees through the UI, instead of using Postman manually.

Do not make this page a decorative list of technologies.
Make it a practical control center.

Sections:

A. Security Health Overview

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
* Action button if applicable

Good wording:

* “Receipts can be verified for authenticity.”
* “Audit records are linked and have not been modified.”
* “Provider callbacks are being processed successfully.”
* “Duplicate payment attempts are being rejected.”
* “Refunds are restricted to eligible transactions.”

Avoid main-card titles like:

* JWT
* AES
* HMAC
* RS256
* nonce
* hash chain

Technical details may exist inside expandable sections only.

B. Run Security Checks

Provide safe, controlled admin checks:

* Verify audit trail
* Verify a receipt
* Check duplicate payment protection using a selected paid order
* Check provider sync for a selected payment
* Check failed provider events
* Check refund protection

Each check result should show:

* Check name
* PASS / FAIL
* Expected result
* Actual result
* Timestamp
* Related order/transaction if applicable

Example:
Check: Duplicate payment protection
Expected: second payment attempt should be rejected
Actual: rejected with conflict status
Result: PASS

C. Audit Trail Integrity

Show:

* Current integrity status
* Number of records checked
* Last verification time
* Button: Verify audit trail

Result:

* “Audit trail verified successfully.”
* “Audit trail verification failed at record …”

D. Receipt Authenticity

Admin can:

* Paste receipt
* Verify receipt
* See readable receipt data
* See invalid result if tampered

E. Duplicate Payment Protection

Admin can:

* Select a paid order
* Run controlled duplicate payment check
* Show expected result:
  “A second payment attempt should be rejected.”

Do not show this as a normal customer action.
This is an admin security validation tool.

F. Provider Callback Monitoring

Show:

* Recent provider events
* Failed callbacks
* Duplicate callbacks
* Processing status

G. Access Control Evidence

Show recent access-control relevant events:

* Cross-user order access blocked
* Admin action performed
* Refund permission check
* Receipt verification event

If backend endpoint is not available yet, design the UI and service function placeholders clearly.

---

8. Audit Trail Page

---

Show audit logs.

Table:

* Time
* Actor
* Event
* Entity
* Result
* Integrity status

Filters:

* Payment events
* Refund events
* Receipt verification
* Admin actions
* Failed events

Audit detail drawer:

* Event summary
* Actor
* Payload summary
* Integrity status
* Related entity

Raw payload should be hidden in expandable technical details.

---

9. Settings Page

---

Only show safe public/admin configuration.

Can show:

* Environment label
* API base URL
* Frontend version
* Active payment providers
* Public Stripe publishable key status: configured / missing

Do not show:

* Stripe secret key
* Webhook secret
* Private keys
* HMAC secret
* KMS master key
* Raw environment secrets

==================================================
UX RULES
========

Customer UI:

* Simple
* Familiar
* Shopping-focused
* No security jargon
* No raw technical payloads by default

Admin UI:

* Operational
* Clear
* Evidence-based
* Shows system status, events, refunds, and security checks
* Allows safe testing of security guarantees
* Does not allow unsafe manual tampering

Tone:
Use product-like wording.

Good:

* Payment completed
* Receipt verified
* Refund processed
* Provider callback processed
* Audit trail healthy
* Payment requires attention
* Sync with provider

Avoid:

* “Teacher demo”
* “Click this to test my project”
* “Fake payment”
* “Here is HMAC/JWT/AES”
* “Blockchain-like hash chain” as main UI wording

==================================================
DELIVERABLE
===========

Create a polished React/Vite frontend that can be connected to an existing backend API.

The frontend should look like a real e-commerce + payment operations platform.

Customer side should feel like a normal online shopping website.

Admin side should feel like a serious payment operations and security monitoring dashboard.

Do not implement final backend logic inside the frontend.
Use clean service functions and placeholder API calls where needed.

Make the design and code easy to connect to backend APIs later.
