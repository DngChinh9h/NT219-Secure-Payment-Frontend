import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type Page,
  type TestInfo,
} from "@playwright/test";

const RUN_PRODUCTION_REGRESSION = Boolean(process.env.E2E_FRONTEND_URL);
const API_BASE_URL = (process.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
const CUSTOMER_PASSWORD = "CustomerPassword123!";
const ORDER_TOTAL = 50_000;

const FORBIDDEN_TEXT = [
  "API is not connected yet",
  "Stripe Elements integration is required before production card payments can be enabled",
  "Route not found",
];

interface Session {
  token: string;
  user: {
    id: string;
    email: string;
    role: "admin" | "customer";
    fullName: string;
  };
}

interface ApiResult<T = Record<string, any>> {
  status: number;
  url: string;
  body: T;
  rawBody: string;
}

interface ResponseDiagnostic {
  method: string;
  url: string;
  status: number | "REQUEST_FAILED";
  body?: string;
}

let api: APIRequestContext;
let admin: Session;
let customer: Session;
let serverTimestamp = Date.now();
const pageDiagnostics = new WeakMap<Page, ResponseDiagnostic[]>();

function redact(value: string): string {
  return value
    .replace(/("(?:token|password|authorization)"\s*:\s*")[^"]+(")/gi, "$1[REDACTED]$2")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9._-]+\b/g, "[REDACTED_JWT]")
    .replace(/\bsk_(?:test|live)_[A-Za-z0-9]+\b/g, "[REDACTED]")
    .replace(/\bwhsec_[A-Za-z0-9]+\b/g, "[REDACTED]");
}

function stringify(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

async function requestApi<T = Record<string, any>>(
  method: string,
  path: string,
  options: {
    token?: string;
    body?: unknown;
    expectedStatus?: number | number[];
  } = {},
): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL}${path}`;
  const expected = Array.isArray(options.expectedStatus)
    ? options.expectedStatus
    : [options.expectedStatus ?? 200];
  let response;
  try {
    response = await api.fetch(url, {
      method,
      headers: options.token ? { Authorization: `Bearer ${options.token}` } : undefined,
      data: options.body,
    });
  } catch (error) {
    throw new Error(`Request failed\nURL: ${url}\nError: ${error instanceof Error ? error.message : String(error)}`);
  }
  const rawBody = await response.text();
  let body: T;
  try {
    body = (rawBody ? JSON.parse(rawBody) : {}) as T;
  } catch {
    body = rawBody as T;
  }
  if (!expected.includes(response.status()) || /Route not found/i.test(rawBody)) {
    throw new Error([
      "Unexpected production API response",
      `Request URL: ${url}`,
      `Status code: ${response.status()}`,
      `Response body: ${redact(rawBody || "<empty>")}`,
      `Expected status: ${expected.join(" or ")}`,
    ].join("\n"));
  }
  return { status: response.status(), url, body, rawBody };
}

async function loginApi(email: string, password: string): Promise<Session> {
  const { body } = await requestApi<{ token: string; user: Session["user"] }>("POST", "/api/auth/login", {
    body: { email, password },
  });
  expect(body.token).toBeTruthy();
  expect(body.user).toBeTruthy();
  return {
    token: body.token,
    user: {
      ...body.user,
      fullName: body.user.fullName ?? email.split("@")[0],
    },
  };
}

async function createOrder(label: string, token = customer.token) {
  const { body } = await requestApi<{ order: Record<string, any> }>("POST", "/api/orders", {
    token,
    body: {
      items: [{
        productId: "550e8400-e29b-41d4-a716-446655440000",
        productName: `Production regression ${label}`,
        quantity: 1,
        unitPrice: ORDER_TOTAL,
      }],
      shippingAddress: "Production Regression Address",
      totalAmount: ORDER_TOTAL,
    },
    expectedStatus: 201,
  });
  expect(body.order?.id).toBeTruthy();
  return body.order;
}

async function payOrder(orderId: string, provider: "mock_bank" | "stripe", paymentToken: string) {
  return requestApi("POST", "/api/payments/create-intent", {
    token: customer.token,
    body: {
      orderId,
      provider,
      paymentToken,
      amount: ORDER_TOTAL,
      nonce: randomUUID(),
      timestamp: serverTimestamp,
    },
  });
}

async function createMockPaidOrder(label: string) {
  const order = await createOrder(label);
  const payment = await payOrder(order.id, "mock_bank", "mock_success");
  expect(payment.body.status).toBe("succeeded");
  return order;
}

async function createStripePaidOrder(label: string) {
  const order = await createOrder(label);
  const payment = await payOrder(order.id, "stripe", "pm_card_visa");
  expect(payment.body.paymentIntentId).toMatch(/^pi_/);
  const sync = await requestApi("POST", `/api/payments/sync/${encodeURIComponent(payment.body.paymentIntentId)}`, {
    token: customer.token,
  });
  expect(sync.body.providerStatus).toBe("succeeded");
  return order;
}

async function transactionForOrder(orderId: string) {
  const { body } = await requestApi<{ transactions: Record<string, any>[] }>("GET", "/api/transactions/mine", {
    token: customer.token,
  });
  const transaction = body.transactions.find((candidate) => candidate.order_id === orderId);
  expect(transaction, `Transaction missing for order ${orderId}`).toBeTruthy();
  return transaction;
}

async function createRefundRequest(orderId: string, expectedStatus: number | number[] = 201) {
  return requestApi("POST", "/api/refund-requests", {
    token: customer.token,
    body: {
      orderId,
      reason: "requested_by_customer",
      details: "Production regression refund request",
    },
    expectedStatus,
  });
}

async function restoreSession(page: Page, session: Session) {
  await page.addInitScript((storedSession) => {
    localStorage.setItem("securepay.token", storedSession.token);
    localStorage.setItem("securepay.user", JSON.stringify(storedSession.user));
  }, session);
}

async function assertHealthyPage(page: Page) {
  const body = page.locator("body");
  await expect(body).not.toHaveText(/^\s*$/);
  for (const text of FORBIDDEN_TEXT) {
    await expect(body, `Forbidden production text rendered on ${page.url()}: ${text}`).not.toContainText(text);
  }
  await expect(body, `Hardcoded PASS rendered without API evidence on ${page.url()}`).not.toContainText(/\bPASS\b/);
}

async function inspectBrowserApiResponse(
  responsePromise: ReturnType<Page["waitForResponse"]>,
  expectedPath: string,
  testInfo: TestInfo,
) {
  const response = await responsePromise;
  const rawBody = await response.text();
  if (!response.ok() || /Route not found/i.test(rawBody)) {
    await testInfo.attach("failed-api-response.json", {
      body: JSON.stringify({
        requestUrl: response.url(),
        statusCode: response.status(),
        responseBody: redact(rawBody || "<empty>"),
      }, null, 2),
      contentType: "application/json",
    });
  }
  expect(response.url()).toContain(expectedPath);
  expect(response.status(), `Request URL: ${response.url()}\nStatus code: ${response.status()}\nResponse body: ${redact(rawBody)}`).toBe(200);
  expect(rawBody).not.toMatch(/Route not found/i);
  return response;
}

async function openAdminApiPage(
  page: Page,
  testInfo: TestInfo,
  pagePath: string,
  apiPath: string,
  tableTestId: string,
) {
  await restoreSession(page, admin);
  const response = page.waitForResponse((candidate) =>
    candidate.request().method() === "GET" && candidate.url().endsWith(apiPath),
  );
  await page.goto(pagePath);
  await inspectBrowserApiResponse(response, apiPath, testInfo);
  await expect(page.getByTestId(tableTestId)).toBeVisible();
  await assertHealthyPage(page);
}

function tamperReceipt(receipt: string): string {
  const parts = receipt.split(".");
  expect(parts).toHaveLength(3);
  const payload = parts[1];
  const last = payload.length - 1;
  parts[1] = `${payload.slice(0, last)}${payload[last] === "A" ? "B" : "A"}`;
  return parts.join(".");
}

test.describe("SecurePay Gateway production regression", () => {
  test.skip(!RUN_PRODUCTION_REGRESSION, "Set E2E_FRONTEND_URL to run production regression tests.");

  test.beforeAll(async () => {
    if (!API_BASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("VITE_API_BASE_URL, E2E_ADMIN_EMAIL, and E2E_ADMIN_PASSWORD are required.");
    }
    api = await playwrightRequest.newContext();
    const health = await requestApi("GET", "/health");
    serverTimestamp = health.body.time ? Date.parse(health.body.time) : Date.now();
    admin = await loginApi(ADMIN_EMAIL, ADMIN_PASSWORD);
    expect(admin.user.role).toBe("admin");

    const email = `e2e_prod_${Date.now()}_${randomUUID().slice(0, 8)}@example.com`;
    const registration = await requestApi<{ token: string; user: Session["user"] }>("POST", "/api/auth/register", {
      body: {
        email,
        password: CUSTOMER_PASSWORD,
        fullName: "Production Regression Customer",
        address: "Production Regression Address",
        cccdNumber: `${Date.now()}`.slice(-12).padStart(12, "0"),
      },
      expectedStatus: 201,
    });
    customer = {
      token: registration.body.token,
      user: {
        ...registration.body.user,
        fullName: "Production Regression Customer",
      },
    };
    expect(customer.user.role).toBe("customer");
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test.beforeEach(async ({ page }) => {
    const diagnostics: ResponseDiagnostic[] = [];
    pageDiagnostics.set(page, diagnostics);
    page.on("response", (response) => {
      if (!response.url().includes("/api/")) return;
      const entry: ResponseDiagnostic = {
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
      };
      diagnostics.push(entry);
      void response.text()
        .then((body) => { entry.body = redact(body).slice(0, 4_000); })
        .catch(() => {});
    });
    page.on("requestfailed", (request) => {
      diagnostics.push({
        method: request.method(),
        url: request.url(),
        status: "REQUEST_FAILED",
        body: request.failure()?.errorText,
      });
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    const screenshotPath = testInfo.outputPath("failure-page.png");
    const diagnosticsPath = testInfo.outputPath("failure-diagnostics.json");
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    await testInfo.attach("failure-page.png", { path: screenshotPath, contentType: "image/png" }).catch(() => {});
    await writeFile(diagnosticsPath, JSON.stringify({
      failingPage: page.url(),
      responses: pageDiagnostics.get(page) ?? [],
    }, null, 2));
    await testInfo.attach("failure-diagnostics.json", { path: diagnosticsPath, contentType: "application/json" });
  });

  test("public config loads from the Render backend", async ({ page }, testInfo) => {
    const response = page.waitForResponse((candidate) => candidate.url().endsWith("/api/config/public"));
    await page.goto("/login");
    await inspectBrowserApiResponse(response, "/api/config/public", testInfo);
    await assertHealthyPage(page);
  });

  test("customer can register and login through the deployed frontend", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(customer.user.email);
    await page.getByLabel("Password").fill(CUSTOMER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await assertHealthyPage(page);
  });

  test("admin can login through the deployed frontend", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText("Payment Operations", { exact: true })).toBeVisible();
    await assertHealthyPage(page);
  });

  test("customer cannot access admin pages", async ({ page }) => {
    await restoreSession(page, customer);
    await page.goto("/admin/security");
    await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Rotate key" })).toHaveCount(0);
    await assertHealthyPage(page);
  });

  test("customer can create a cart order through the deployed frontend", async ({ page }, testInfo) => {
    await restoreSession(page, customer);
    await page.goto("/shop");
    await page.getByRole("button", { name: "Add" }).first().click();
    await page.getByRole("button", { name: "Cart" }).click();
    await page.getByPlaceholder("Street, ward, district, city").fill("Production Regression Address");
    const response = page.waitForResponse((candidate) =>
      candidate.request().method() === "POST" && candidate.url().endsWith("/api/orders"),
    );
    await page.getByRole("button", { name: "Create order" }).click();
    const created = await response;
    const rawBody = await created.text();
    expect(created.status(), `Request URL: ${created.url()}\nStatus code: ${created.status()}\nResponse body: ${rawBody}`).toBe(201);
    await expect(page).toHaveURL(/\/checkout\//);
    await testInfo.attach("created-order-response.json", { body: rawBody, contentType: "application/json" });
  });

  test("Sandbox Bank exposes succeeded, failed, and pending outcomes", async () => {
    for (const [label, token, status] of [
      ["success", "mock_success", "succeeded"],
      ["failed", "mock_failed", "failed"],
      ["pending", "mock_pending", "processing"],
    ] as const) {
      const order = await createOrder(`mock-${label}`);
      const result = await payOrder(order.id, "mock_bank", token);
      expect(result.body.status).toBe(status);
    }
  });

  test("Stripe checkout renders real Stripe Elements instead of a placeholder", async ({ page }, testInfo) => {
    const order = await createOrder("stripe-elements");
    await restoreSession(page, customer);
    await page.goto(`/checkout/${order.id}`);
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await assertHealthyPage(page);
    const stripeFrames = page.locator('iframe[src*="js.stripe.com"], iframe[name^="__privateStripeFrame"]');
    expect(await stripeFrames.count(), "Real Stripe Elements iframe is missing from deployed checkout.").toBeGreaterThan(0);
    const cardFrame = page.frameLocator('iframe[title="Secure card payment input frame"]');
    await cardFrame.locator('input[name="cardnumber"]').fill("4242424242424242");
    await cardFrame.locator('input[name="exp-date"]').fill("1230");
    await cardFrame.locator('input[name="cvc"]').fill("123");
    const payButton = page.getByRole("button", { name: `Pay ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(ORDER_TOTAL)} securely` });
    await expect(payButton).toBeEnabled();
    const intentResponse = page.waitForResponse((candidate) =>
      candidate.request().method() === "POST" && candidate.url().endsWith("/api/payments/create-intent"),
    );
    const syncResponse = page.waitForResponse((candidate) =>
      candidate.request().method() === "POST" && candidate.url().includes("/api/payments/sync/"),
    );
    await payButton.click();
    await inspectBrowserApiResponse(intentResponse, "/api/payments/create-intent", testInfo);
    await inspectBrowserApiResponse(syncResponse, "/api/payments/sync/", testInfo);
    await expect(page.getByText("Payment completed", { exact: true }).first()).toBeVisible();
    const transaction = await transactionForOrder(order.id);
    const receipt = await requestApi<{ receipt: string }>("GET", `/api/transactions/${transaction.id}/receipt`, {
      token: customer.token,
    });
    expect(receipt.body.receipt).toBeTruthy();
  });

  test("Stripe payment creates a paid order and receipt", async () => {
    const order = await createStripePaidOrder("stripe-paid-receipt");
    const transaction = await transactionForOrder(order.id);
    expect(transaction.status).toBe("success");
    const receipt = await requestApi<{ receipt: string }>("GET", `/api/transactions/${transaction.id}/receipt`, {
      token: customer.token,
    });
    expect(receipt.body.receipt).toBeTruthy();
  });

  test("valid receipt verifies true and tampered receipt verifies false", async () => {
    const order = await createMockPaidOrder("receipt-verification");
    const transaction = await transactionForOrder(order.id);
    const { body } = await requestApi<{ receipt: string }>("GET", `/api/transactions/${transaction.id}/receipt`, {
      token: customer.token,
    });
    const valid = await requestApi("POST", "/api/transactions/receipt/verify", { body: { receipt: body.receipt } });
    expect(valid.body.valid).toBe(true);
    const tampered = await requestApi("POST", "/api/transactions/receipt/verify", {
      body: { receipt: tamperReceipt(body.receipt) },
    });
    expect(tampered.body.valid).toBe(false);
  });

  test("customer refund request is accepted for a paid order", async () => {
    const order = await createMockPaidOrder("customer-refund-request");
    const refund = await createRefundRequest(order.id);
    expect(refund.body.refundRequest?.status).toBe("pending_review");
  });

  test("admin refund rejection requires a reason", async () => {
    const order = await createMockPaidOrder("admin-reject-reason");
    const refund = await createRefundRequest(order.id);
    await requestApi("POST", `/api/admin/refund-requests/${refund.body.refundRequest.id}/reject`, {
      token: admin.token,
      body: {},
      expectedStatus: 400,
    });
  });

  test("admin Stripe refund approval returns re_ id and blocks duplicate approval", async () => {
    const order = await createStripePaidOrder("stripe-refund");
    const refund = await createRefundRequest(order.id);
    const requestId = refund.body.refundRequest.id;
    const approval = await requestApi("POST", `/api/admin/refund-requests/${requestId}/approve`, {
      token: admin.token,
    });
    expect(approval.body.refundRequest.provider_refund_id).toMatch(/^re_/);
    await requestApi("POST", `/api/admin/refund-requests/${requestId}/approve`, {
      token: admin.token,
      expectedStatus: [400, 409],
    });
  });

  test("duplicate refund request is blocked", async () => {
    const order = await createMockPaidOrder("duplicate-refund");
    await createRefundRequest(order.id);
    await createRefundRequest(order.id, [400, 409]);
  });

  test("admin Orders page uses its real API", async ({ page }, testInfo) => {
    await openAdminApiPage(page, testInfo, "/admin/orders", "/api/admin/orders", "admin-orders-table");
  });

  test("admin Transactions page uses its real API", async ({ page }, testInfo) => {
    await openAdminApiPage(page, testInfo, "/admin/transactions", "/api/admin/transactions", "admin-transactions-table");
  });

  test("Provider Events page uses its real API", async ({ page }, testInfo) => {
    await openAdminApiPage(page, testInfo, "/admin/events", "/api/admin/provider-events", "admin-provider-events-table");
  });

  test("Security Operations loads real evidence endpoints", async ({ page }, testInfo) => {
    await restoreSession(page, admin);
    const expectedPaths = [
      "/api/admin/security/evidence",
      "/api/admin/security/hardening",
      "/api/admin/security/keys/status",
      "/api/admin/security/reconciliation",
      "/api/admin/security/risk-evidence",
    ];
    const responses = expectedPaths.map((path) =>
      page.waitForResponse((candidate) => candidate.request().method() === "GET" && candidate.url().endsWith(path)),
    );
    await page.goto("/admin/security");
    for (let index = 0; index < expectedPaths.length; index += 1) {
      await inspectBrowserApiResponse(responses[index], expectedPaths[index], testInfo);
    }
    await requestApi("GET", "/api/admin/security/audit-chain/verify", { token: admin.token });
    await expect(page.getByRole("heading", { name: "Security operations" })).toBeVisible();
    await assertHealthyPage(page);
  });

  test("receipt signing key rotation closes its overlay", async ({ page }, testInfo) => {
    await restoreSession(page, admin);
    await page.goto("/admin/security");
    await page.getByRole("button", { name: "Rotate key" }).click();
    await expect(page.getByRole("heading", { name: "Rotate receipt signing key?" })).toBeVisible();
    const response = page.waitForResponse((candidate) =>
      candidate.request().method() === "POST" && candidate.url().endsWith("/api/admin/security/keys/rotate"),
    );
    await page.getByRole("button", { name: "Confirm rotation" }).click();
    await inspectBrowserApiResponse(response, "/api/admin/security/keys/rotate", testInfo);
    await expect(page.getByRole("heading", { name: "Rotate receipt signing key?" })).toBeHidden();
    await expect(page.locator('[data-slot="alert-dialog-overlay"]')).toHaveCount(0);
    await assertHealthyPage(page);
  });

  test("Audit Trail loads real audit logs and chain verification", async ({ page }, testInfo) => {
    await restoreSession(page, admin);
    const logs = page.waitForResponse((candidate) => candidate.url().endsWith("/api/transactions/audit-logs"));
    const chain = page.waitForResponse((candidate) => candidate.url().endsWith("/api/admin/security/audit-chain/verify"));
    await page.goto("/admin/audit");
    await inspectBrowserApiResponse(logs, "/api/transactions/audit-logs", testInfo);
    await inspectBrowserApiResponse(chain, "/api/admin/security/audit-chain/verify", testInfo);
    await expect(page.getByRole("heading", { name: "Audit trail" })).toBeVisible();
    await expect(page.getByText("Audit hash chain verification")).toBeVisible();
    await assertHealthyPage(page);
  });

  test("API outage shows a clean error instead of a blank screen", async ({ page }) => {
    await page.route("**/api/config/public", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ environment: "production", providers: { stripe: false, mock_bank: false } }),
    }));
    await page.route("**/api/auth/login", (route) => route.abort("failed"));
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Unable to reach the SecurePay API.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in to SecurePay" })).toBeVisible();
    await assertHealthyPage(page);
  });
});
