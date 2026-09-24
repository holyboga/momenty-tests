import { defineConfig, devices } from "@playwright/test";
import { links } from "./src/links";

// baseURL берём из .auth/links.json (его пишет scripts/bootstrap.mjs), до бутстрапа — из env.
const BASE_URL = links(false)?.baseURL ?? process.env.BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // API-тесты — без браузера, только APIRequestContext.
    { name: "api", testMatch: /tests\/api\/.*\.spec\.ts/ },
    // UI — мобильный viewport: «Моменты» делались под телефон (референс Locket).
    { name: "mobile-chromium", testMatch: /tests\/ui\/.*\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node scripts/start-app.mjs",
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
