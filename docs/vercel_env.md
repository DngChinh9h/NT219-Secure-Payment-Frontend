# Vercel Environment

Production frontend stays on Vercel.

Set this variable:

```text
VITE_API_BASE_URL=https://api.example.com
```

Use the backend origin only (without `/api`). The deployed API must implement the server-priced order, idempotent payment, and idempotent admin-refund contract; no product prices, order totals, or payment amounts are configured in Vercel.

Keep:

```text
VITE_USE_MOCKS=false
```

Redeploy the Vercel project after changing environment variables.

Backend CORS must allow the exact Vercel origin:

```text
CORS_ORIGINS=https://<vercel-frontend-domain>
```

Do not place Stripe secret keys, webhook secrets, database URLs, JWT private keys, HMAC secrets, or KMS keys in Vercel.
