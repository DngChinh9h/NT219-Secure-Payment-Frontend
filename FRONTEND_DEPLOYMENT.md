# Frontend Deployment

## Vercel Setup

1. Import `DngChinh9h/NT219-Secure-Payment-Frontend` into Vercel.
2. Use the Vite framework preset.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Configure the environment variables below, then redeploy.

The checked-in `vercel.json` rewrites frontend routes to `/index.html`, so direct navigation and refreshes work for `/login`, `/shop`, `/orders`, `/refund-requests`, `/admin`, `/admin/security`, and `/admin/refunds`.

## Environment Variables

Use the AWS ALB HTTPS API domain:

```text
VITE_API_BASE_URL=https://api.example.com
```

Keep mock data disabled:

```text
VITE_USE_MOCKS=false
```

The frontend loads public payment configuration from:

```text
GET https://api.example.com/api/config/public
```

Only public Stripe configuration belongs in that response. Never add Stripe secret keys, webhook secrets, database URLs, JWT private keys, or backend-only credentials to frontend environment variables.

## Backend CORS

The backend running behind the ALB must allow the deployed Vercel origin:

```text
CORS_ORIGINS=https://<vercel-frontend-domain>
```

Do not use `*` in production when auth credentials are involved.

## Validation

Install dependencies and verify the production bundle:

```powershell
npm install
npm run build
```

Run local UI E2E against the AWS API:

```powershell
$env:VITE_API_BASE_URL='https://api.example.com'
$env:E2E_ADMIN_EMAIL='operator@your-domain.example'
$env:E2E_ADMIN_PASSWORD='replace-with-admin-password'
npm run e2e:ui
```

Run UI E2E against the deployed Vercel frontend:

```powershell
$env:E2E_FRONTEND_URL='https://your-vercel-domain.vercel.app'
$env:VITE_API_BASE_URL='https://api.example.com'
$env:E2E_ADMIN_EMAIL='operator@your-domain.example'
$env:E2E_ADMIN_PASSWORD='replace-with-admin-password'
npm run e2e:ui:prod
```

## Deployment Checklist

- `VITE_API_BASE_URL` points to the AWS ALB API domain.
- `VITE_USE_MOCKS=false`.
- Vercel build command is `npm run build`.
- Vercel output directory is `dist`.
- Backend `CORS_ORIGINS` contains the exact Vercel HTTPS origin.
- Direct route refreshes return the SPA entrypoint.
- `npm run build` passes.
