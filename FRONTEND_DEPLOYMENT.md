# Frontend Deployment

## Vercel Setup

1. Import the `DngChinh9h/NT219-Secure-Payment-Frontend` repository into Vercel.
2. Use the Vite framework preset.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Deploy after configuring the environment variables below.

The checked-in `vercel.json` rewrites frontend routes to `/index.html`, so direct navigation and browser refreshes work for routes such as `/login`, `/shop`, `/orders`, `/refund-requests`, `/admin`, `/admin/security`, and `/admin/refunds`.

## Environment Variables

Configure this Vercel environment variable:

```text
VITE_API_BASE_URL=https://nt219-secure-payment.onrender.com
```

Keep mock data disabled:

```text
VITE_USE_MOCKS=false
```

The frontend loads public payment configuration from:

```text
GET /api/config/public
```

Only public Stripe configuration belongs in that response. Never add a Stripe secret key, webhook secret, database URL, or backend-only credential to frontend environment variables.

## Backend CORS

The Render backend must allow the deployed Vercel origin, including any production custom domain. Add the exact HTTPS frontend origin to the backend CORS allowlist before running production UI tests.

## Validation

Install dependencies and verify the production bundle:

```powershell
npm install
npm run build
npx playwright install
```

Run local UI E2E against the Render backend:

```powershell
$env:VITE_API_BASE_URL='https://nt219-secure-payment.onrender.com'
$env:E2E_ADMIN_EMAIL='operator@your-domain.example'
$env:E2E_ADMIN_PASSWORD='replace-with-admin-password'
npm run e2e:ui
```

Run UI E2E against the deployed Vercel frontend:

```powershell
$env:E2E_FRONTEND_URL='https://your-vercel-domain.vercel.app'
$env:VITE_API_BASE_URL='https://nt219-secure-payment.onrender.com'
$env:E2E_ADMIN_EMAIL='operator@your-domain.example'
$env:E2E_ADMIN_PASSWORD='replace-with-admin-password'
npm run e2e:ui:prod
```

## Deployment Checklist

- `VITE_API_BASE_URL` points to the Render backend.
- `VITE_USE_MOCKS=false`.
- Vercel build command is `npm run build`.
- Vercel output directory is `dist`.
- The backend CORS allowlist contains the Vercel HTTPS origin.
- Direct route refreshes return the SPA entrypoint.
- `npm run build` passes.
- `npm run e2e:ui:prod` passes against the deployed frontend.
