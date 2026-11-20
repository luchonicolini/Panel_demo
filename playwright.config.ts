import { defineConfig, devices } from "@playwright/test";
import {
  BASE_URL,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_SECRET,
  E2E_PORT,
} from "./e2e/credentials";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /mobile\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${E2E_PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DEMO_MODE: "true",
      DEMO_DATA_DIR: ".data/e2e",
      DEMO_UPLOADS_NAMESPACE: "e2e",
      DEMO_ADMIN_EMAIL: DEMO_EMAIL,
      DEMO_ADMIN_PASSWORD: DEMO_PASSWORD,
      DEMO_AUTH_SECRET: DEMO_SECRET,
      NEXT_PUBLIC_SITE_URL: BASE_URL,
    },
  },
});
