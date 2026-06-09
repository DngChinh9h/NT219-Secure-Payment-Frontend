# Vercel Environment

Production frontend stays on Vercel.

Set this variable:

```text
VITE_API_BASE_URL=https://api.example.com
```

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
