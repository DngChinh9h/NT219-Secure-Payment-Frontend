import { expect, test, type APIRequestContext, type Page, type Route } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the live UI E2E suite.`);
  return value.replace(/\/+$/, "");
}

const API_BASE_URL = requiredEnv("VITE_API_BASE_URL");
const ADMIN_EMAIL = requiredEnv("E2E_ADMIN_EMAIL");
const ADMIN_PASSWORD = requiredEnv("E2E_ADMIN_PASSWORD");
let adminSession: { token: string; user: string };

function apiResponse(page: Page, method: string, path: string) {
  return page.waitForResponse((response) =>
    response.request().method() === method &&
    response.url().endsWith(path),
  );
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function stubBackgroundApis(page: Page) {
  await page.route("**/api/config/public", (route) =>
    fulfillJson(route, {
      environment: "production",
      providers: { stripe: true, mock_bank: true },
    }),
  );
  await page.route("**/api/orders/mine", (route) => fulfillJson(route, { orders: [] }));
  await page.route("**/api/transactions/mine", (route) => fulfillJson(route, { transactions: [] }));
  await page.route("**/api/admin/refund-requests", (route) => fulfillJson(route, { refundRequests: [] }));
  await page.route("**/api/refund-requests/mine", (route) => fulfillJson(route, { refundRequests: [] }));
  await page.route("**/api/transactions/audit-logs", (route) => fulfillJson(route, { logs: [] }));
}

async function stubSecurityMetadata(page: Page) {
  await page.route("**/api/admin/security/evidence", (route) =>
    fulfillJson(route, {
      receiptSigning: { enabled: true },
      auditChain: { enabled: true },
      duplicatePaymentProtection: { enabled: true },
      replayProtection: { enabled: true },
      refundDoubleSpendProtection: { enabled: true },
      webhookIdempotency: { enabled: true },
      providerRefund: { enabled: true },
    }),
  );
  await page.route("**/api/admin/security/keys/status", (route) =>
    fulfillJson(route, {
      activeKeyVersion: 3,
      availableKeyVersions: [1, 2, 3],
      keyRotationEnabled: true,
    }),
  );
  await page.route("**/api/admin/security/hardening", (route) =>
    fulfillJson(route, {
      rateLimitEnabled: true,
      corsRestricted: true,
      securityHeadersEnabled: true,
      replayProtectionEnabled: true,
      duplicatePaymentProtectionEnabled: true,
      refundDoubleSpendProtectionEnabled: true,
      webhookIdempotencyEnabled: true,
      secretScanRecommended: true,
      attackEvidence: {
        replayDuplicateBlocked: { blocked: true, details: "Duplicate nonce rejected." },
        customerCannotAccessAdminApis: { blocked: true, details: "Customer request rejected with 403." },
      },
    }),
  );
  await stubReconciliationAndRiskMetadata(page);
}

async function stubReconciliationAndRiskMetadata(page: Page) {
  await page.route("**/api/admin/security/reconciliation", (route) =>
    fulfillJson(route, {
      totalOrders: 3,
      paidOrders: 2,
      refundedOrders: 1,
      successfulTransactions: 2,
      refundedTransactions: 1,
      providerLinkedPayments: 3,
      providerLinkedRefunds: 1,
      mismatchCount: 1,
      mismatches: [{
        type: "paid_order_without_successful_transaction",
        orderId: "order-1",
        occurrenceCount: 1,
      }],
      status: "mismatch_detected",
      checkedAt: "2026-06-01T00:00:01.000Z",
    }),
  );
  await page.route("**/api/admin/security/risk-evidence", (route) =>
    fulfillJson(route, {
      status: "clear",
      triggeredRules: 0,
      checkedAt: "2026-06-01T00:00:02.000Z",
      rules: {
        repeatedFailedPayments: { enabled: true, threshold: 3, flaggedUsers: [] },
        manyRefundRequests: { enabled: true, threshold: 3, flaggedUsers: [] },
        duplicatePaymentAttemptsBlocked: { enabled: true, observedCount: 0 },
        duplicateRefundAttemptsBlocked: { enabled: true, observedCount: 0 },
        suspiciousProviderFailures: { enabled: true, observedCount: 0, refundRequests: [] },
        highAmountOrders: { enabled: true, threshold: 10000000, observedCount: 0, orders: [] },
      },
    }),
  );
}

async function stubAdminOperationApis(page: Page) {
  await page.route("**/api/admin/orders", (route) => fulfillJson(route, { items: [] }));
  await page.route("**/api/admin/transactions", (route) => fulfillJson(route, { items: [] }));
  await page.route("**/api/admin/provider-events", (route) =>
    fulfillJson(route, {
      items: [],
      message: "Provider event persistence is not enabled yet",
    }),
  );
}

async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  const loginResponse = apiResponse(page, "POST", "/api/auth/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  const response = await loginResponse;
  await expect(response.status(), await response.text()).toBe(200);
}

async function loginAdmin(page: Page) {
  await login(page);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Payment Operations", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Security Operations" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Audit Trail" })).toBeVisible();
}

async function captureAdminSession(page: Page) {
  adminSession = await page.evaluate(() => ({
    token: localStorage.getItem("securepay.token") ?? "",
    user: localStorage.getItem("securepay.user") ?? "",
  }));
  expect(adminSession.token).not.toBe("");
  expect(adminSession.user).not.toBe("");
}

async function restoreAdminSession(page: Page) {
  expect(adminSession, "The admin login scenario must run first.").toBeTruthy();
  await page.goto("/login");
  await page.evaluate((session) => {
    localStorage.setItem("securepay.token", session.token);
    localStorage.setItem("securepay.user", session.user);
  }, adminSession);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

async function openSecurityOperations(page: Page) {
  const evidenceResponse = apiResponse(page, "GET", "/api/admin/security/evidence");
  const hardeningResponse = apiResponse(page, "GET", "/api/admin/security/hardening");
  const keyStatusResponse = apiResponse(page, "GET", "/api/admin/security/keys/status");
  const reconciliationResponse = apiResponse(page, "GET", "/api/admin/security/reconciliation");
  const riskEvidenceResponse = apiResponse(page, "GET", "/api/admin/security/risk-evidence");
  await page.goto("/admin/security");
  await expect(page.getByRole("heading", { name: "Security operations" })).toBeVisible();
  await expect((await evidenceResponse).ok()).toBeTruthy();
  await expect((await hardeningResponse).ok()).toBeTruthy();
  await expect((await keyStatusResponse).ok()).toBeTruthy();
  await expect((await reconciliationResponse).ok()).toBeTruthy();
  await expect((await riskEvidenceResponse).ok()).toBeTruthy();
  await expect(page.getByRole("button", { name: "Refresh evidence" })).toBeEnabled();
}

async function registerCustomer(request: APIRequestContext) {
  const email = `e2e_ui_customer_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;
  const password = "CustomerPassword123!";
  const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
    data: {
      email,
      password,
      fullName: "Playwright Customer",
      address: "Playwright Test Address",
      cccdNumber: `${Date.now()}`.slice(-12).padStart(12, "0"),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return { email, password };
}

test.describe.serial("Phase 7 deployment readiness UI", () => {
  test("public config loads from the backend and direct SPA routes render", async ({ page }) => {
    const publicConfigResponse = apiResponse(page, "GET", "/api/config/public");
    await page.goto("/login");
    await expect((await publicConfigResponse).ok()).toBeTruthy();

    await page.route("**/api/config/public", (route) =>
      fulfillJson(route, {
        environment: "production",
        providers: { stripe: true, mock_bank: true },
      }),
    );
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "Shop with confidence. Pay with peace of mind." })).toBeVisible();
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in to SecurePay" })).toBeVisible();
  });

  test("admin login loads the operations dashboard and admin navigation", async ({ page }) => {
    await stubBackgroundApis(page);
    await loginAdmin(page);
    await page.goto("/admin/refunds");
    await expect(page.getByRole("heading", { name: "Refunds" })).toBeVisible();
    await captureAdminSession(page);
  });

  test("security operations renders live evidence and key status API data", async ({ page }) => {
    await stubBackgroundApis(page);
    await stubReconciliationAndRiskMetadata(page);
    await restoreAdminSession(page);
    await openSecurityOperations(page);

    await expect(page.getByText("Receipt signing enabled").locator("..")).toContainText("Enabled");
    await expect(page.getByTestId("active-key-version")).toHaveText(/^\d+$/);
    await expect(page.getByText("Available key versions").locator("..")).toContainText(/\d+/);
    await expect(page.getByText("Key rotation enabled").locator("..")).toContainText("Enabled");
    await expect(page.getByText("Receipt signature verification").first()).toBeVisible();
    await expect(page.getByText("Audit hash chain")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security Hardening" })).toBeVisible();
    await expect(page.getByTestId("hardening-rate_limiting")).toContainText("Enabled");
    await expect(page.getByTestId("hardening-cors_restriction")).toContainText("Enabled");
    await expect(page.getByTestId("hardening-security_headers")).toContainText("Enabled");
    await expect(page.getByTestId("hardening-secret_scan_status")).toContainText("Warning");
    await expect(page.getByRole("heading", { name: "Payment Reconciliation" })).toBeVisible();
    await expect(page.getByTestId("reconciliation-mismatch-count")).toHaveText(/^\d+$/);
    await expect(page.getByTestId("reconciliation-mismatches-table")).toBeVisible();
    await expect(page.getByText("Paid order does not have a successful transaction.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fraud / Risk Evidence" })).toBeVisible();
    await expect(page.getByText("No risk flags found")).toBeVisible();
    await expect(page.getByTestId("risk-repeated_failed_payments")).toBeVisible();
    await expect(page.getByTestId("risk-many_refund_requests")).toBeVisible();
    await expect(page.getByTestId("risk-duplicate_payment_attempts_blocked")).toBeVisible();
    await expect(page.getByTestId("risk-duplicate_refund_attempts_blocked")).toBeVisible();
    await expect(page.getByTestId("risk-suspicious_provider_failures")).toBeVisible();
    await expect(page.getByTestId("risk-high_amount_orders")).toBeVisible();
  });

  test("admin operation pages call APIs and render real empty states without placeholders", async ({ page }) => {
    await stubBackgroundApis(page);
    await stubAdminOperationApis(page);
    await restoreAdminSession(page);

    const ordersResponse = apiResponse(page, "GET", "/api/admin/orders");
    await page.goto("/admin/orders");
    await expect((await ordersResponse).ok()).toBeTruthy();
    await expect(page.getByTestId("admin-orders-table")).toBeVisible();
    await expect(page.getByText("No orders returned by the API.")).toBeVisible();

    const transactionsResponse = apiResponse(page, "GET", "/api/admin/transactions");
    await page.goto("/admin/transactions");
    await expect((await transactionsResponse).ok()).toBeTruthy();
    await expect(page.getByTestId("admin-transactions-table")).toBeVisible();
    await expect(page.getByText("No transactions returned by the API.")).toBeVisible();

    const eventsResponse = apiResponse(page, "GET", "/api/admin/provider-events");
    await page.goto("/admin/events");
    await expect((await eventsResponse).ok()).toBeTruthy();
    await expect(page.getByTestId("admin-provider-events-table")).toBeVisible();
    await expect(page.getByText("Provider event persistence is not enabled yet").first()).toBeVisible();

    await expect(page.getByText(/API is not connected yet\./i)).toHaveCount(0);

    await page.goto("/admin/payments");
    await expect(page.getByText("This page is for manual provider sync by payment intent ID.")).toBeVisible();
  });

  test("rotates a signing key and closes the confirmation overlay", async ({ page }) => {
    await stubBackgroundApis(page);
    await stubReconciliationAndRiskMetadata(page);
    await restoreAdminSession(page);
    await openSecurityOperations(page);
    const previousVersion = await page.getByTestId("active-key-version").innerText();

    await page.getByRole("button", { name: "Rotate key" }).click();
    await expect(page.getByRole("heading", { name: "Rotate receipt signing key?" })).toBeVisible();

    const rotateResponse = apiResponse(page, "POST", "/api/admin/security/keys/rotate");
    const refreshedEvidence = apiResponse(page, "GET", "/api/admin/security/evidence");
    const refreshedHardening = apiResponse(page, "GET", "/api/admin/security/hardening");
    const refreshedKeyStatus = apiResponse(page, "GET", "/api/admin/security/keys/status");
    const refreshedReconciliation = apiResponse(page, "GET", "/api/admin/security/reconciliation");
    const refreshedRiskEvidence = apiResponse(page, "GET", "/api/admin/security/risk-evidence");
    await page.getByRole("button", { name: "Confirm rotation" }).click();

    await expect((await rotateResponse).ok()).toBeTruthy();
    await expect((await refreshedEvidence).ok()).toBeTruthy();
    await expect((await refreshedHardening).ok()).toBeTruthy();
    await expect((await refreshedKeyStatus).ok()).toBeTruthy();
    await expect((await refreshedReconciliation).ok()).toBeTruthy();
    await expect((await refreshedRiskEvidence).ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Rotate receipt signing key?" })).toBeHidden();
    await expect(page.locator('[data-slot="alert-dialog-overlay"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Rotate key" })).toBeEnabled();
    await expect(page.getByTestId("active-key-version")).not.toHaveText(previousVersion);
  });

  test("receipt verifier handles empty and invalid receipts without crashing", async ({ page }) => {
    await stubBackgroundApis(page);
    await stubSecurityMetadata(page);
    await restoreAdminSession(page);
    await openSecurityOperations(page);

    const verifyButton = page.getByRole("button", { name: "Verify receipt" });
    await expect(verifyButton).toBeDisabled();
    await page.getByPlaceholder("Paste a JWS receipt to verify...").fill("invalid.receipt.value");

    const verifyResponse = apiResponse(page, "POST", "/api/transactions/receipt/verify");
    await verifyButton.click();
    await expect((await verifyResponse).ok()).toBeTruthy();
    await expect(page.getByText("Receipt signature is invalid.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Attack Evidence" })).toBeVisible();
    await expect(page.getByText("Replay duplicate blocked")).toBeVisible();
    await expect(page.getByText("Customer cannot access admin APIs")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security operations" })).toBeVisible();
  });

  test("customer cannot access security operations or see key rotation", async ({ page, request }) => {
    await stubBackgroundApis(page);
    await restoreAdminSession(page);
    await page.getByRole("button", { name: new RegExp(ADMIN_EMAIL, "i") }).click();
    await page.getByText("Log out").click();
    await expect(page).toHaveURL(/\/login$/);

    const customer = await registerCustomer(request);
    await login(page, customer.email, customer.password);
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("link", { name: "Security Operations" })).toHaveCount(0);
    for (const path of ["/admin/security", "/admin/orders", "/admin/transactions", "/admin/events"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Rotate key" })).toHaveCount(0);
  });

  test("evidence loading and API errors remain visible without a stuck overlay", async ({ page }) => {
    await stubBackgroundApis(page);
    await restoreAdminSession(page);
    await page.route("**/api/admin/security/evidence", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Synthetic evidence outage" }),
      });
    });
    await page.route("**/api/admin/security/keys/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          activeKeyVersion: 3,
          availableKeyVersions: [1, 2, 3],
          keyRotationEnabled: true,
        }),
      });
    });
    await page.route("**/api/admin/security/hardening", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Synthetic hardening outage" }),
      });
    });
    await page.route("**/api/admin/security/reconciliation", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Synthetic reconciliation outage" }),
      });
    });
    await page.route("**/api/admin/security/risk-evidence", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Synthetic risk evidence outage" }),
      });
    });

    await page.goto("/admin/security");
    await expect(page.getByRole("button", { name: "Refreshing..." })).toBeVisible();
    await expect(page.getByText("Security evidence is not connected: Synthetic evidence outage")).toBeVisible();
    await expect(page.getByText("Security hardening evidence is not connected: Synthetic hardening outage")).toBeVisible();
    await expect(page.getByText("Payment reconciliation evidence is not connected: Synthetic reconciliation outage")).toBeVisible();
    await expect(page.getByText("Fraud and risk evidence is not connected: Synthetic risk evidence outage")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security Hardening" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security operations" })).toBeVisible();
    await expect(page.locator('[data-slot="alert-dialog-overlay"]')).toHaveCount(0);
  });

  test("expired token redirects to login", async ({ page }) => {
    await stubBackgroundApis(page);
    await restoreAdminSession(page);
    await page.route("**/api/admin/security/evidence", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Token expired" }),
      }),
    );
    await page.route("**/api/admin/security/hardening", (route) =>
      fulfillJson(route, {}),
    );
    await page.route("**/api/admin/security/keys/status", (route) =>
      fulfillJson(route, {
        activeKeyVersion: 1,
        availableKeyVersions: [1],
        keyRotationEnabled: false,
      }),
    );
    await page.route("**/api/admin/security/reconciliation", (route) =>
      fulfillJson(route, {}),
    );
    await page.route("**/api/admin/security/risk-evidence", (route) =>
      fulfillJson(route, {}),
    );

    await page.goto("/admin/security");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in to SecurePay" })).toBeVisible();
  });

  test("unreachable backend shows a clean login error without a blank screen", async ({ page }) => {
    await page.route("**/api/config/public", (route) =>
      fulfillJson(route, {
        environment: "production",
        providers: { stripe: false, mock_bank: false },
      }),
    );
    await page.route("**/api/auth/login", (route) => route.abort("failed"));

    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Unable to reach the SecurePay API.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in to SecurePay" })).toBeVisible();
  });
});
