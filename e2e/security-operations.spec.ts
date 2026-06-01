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
  const keyStatusResponse = apiResponse(page, "GET", "/api/admin/security/keys/status");
  await page.goto("/admin/security");
  await expect(page.getByRole("heading", { name: "Security operations" })).toBeVisible();
  await expect((await evidenceResponse).ok()).toBeTruthy();
  await expect((await keyStatusResponse).ok()).toBeTruthy();
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

test.describe.serial("Phase 5 security operations UI", () => {
  test("admin login loads the operations dashboard and admin navigation", async ({ page }) => {
    await stubBackgroundApis(page);
    await loginAdmin(page);
    await captureAdminSession(page);
  });

  test("security operations renders live evidence and key status API data", async ({ page }) => {
    await stubBackgroundApis(page);
    await restoreAdminSession(page);
    await openSecurityOperations(page);

    await expect(page.getByText("Receipt signing enabled").locator("..")).toContainText("Enabled");
    await expect(page.getByTestId("active-key-version")).toHaveText(/^\d+$/);
    await expect(page.getByText("Available key versions").locator("..")).toContainText(/\d+/);
    await expect(page.getByText("Key rotation enabled").locator("..")).toContainText("Enabled");
    await expect(page.getByText("Receipt signature verification").first()).toBeVisible();
    await expect(page.getByText("Audit hash chain")).toBeVisible();
  });

  test("rotates a signing key and closes the confirmation overlay", async ({ page }) => {
    await stubBackgroundApis(page);
    await restoreAdminSession(page);
    await openSecurityOperations(page);
    const previousVersion = await page.getByTestId("active-key-version").innerText();

    await page.getByRole("button", { name: "Rotate key" }).click();
    await expect(page.getByRole("heading", { name: "Rotate receipt signing key?" })).toBeVisible();

    const rotateResponse = apiResponse(page, "POST", "/api/admin/security/keys/rotate");
    const refreshedEvidence = apiResponse(page, "GET", "/api/admin/security/evidence");
    const refreshedKeyStatus = apiResponse(page, "GET", "/api/admin/security/keys/status");
    await page.getByRole("button", { name: "Confirm rotation" }).click();

    await expect((await rotateResponse).ok()).toBeTruthy();
    await expect((await refreshedEvidence).ok()).toBeTruthy();
    await expect((await refreshedKeyStatus).ok()).toBeTruthy();
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
    await page.goto("/admin/security");

    await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
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

    await page.goto("/admin/security");
    await expect(page.getByRole("button", { name: "Refreshing..." })).toBeVisible();
    await expect(page.getByText("Security evidence is not connected: Synthetic evidence outage")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security operations" })).toBeVisible();
    await expect(page.locator('[data-slot="alert-dialog-overlay"]')).toHaveCount(0);
  });
});
