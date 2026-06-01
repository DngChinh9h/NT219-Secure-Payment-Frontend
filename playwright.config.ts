import { defineConfig, devices } from "@playwright/test";

const localFrontendUrl = "http://127.0.0.1:4173";
const deployedFrontendUrl = process.env.E2E_FRONTEND_URL?.replace(/\/+$/, "");
const apiBaseUrl = process.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

if (!deployedFrontendUrl && !apiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required when running UI E2E against the local frontend.");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: deployedFrontendUrl ?? localFrontendUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: deployedFrontendUrl
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 4173",
        env: {
          ...process.env,
          VITE_API_BASE_URL: localFrontendUrl,
          VITE_DEV_PROXY_TARGET: apiBaseUrl!,
        },
        url: localFrontendUrl,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
