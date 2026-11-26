import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const E2E_PORT = 3005;
const E2E_DATA_DIR = path.resolve(__dirname, "e2e-temp-data");

export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  workers: 1, // Ejecución secuencial para simular jornada comercial determinista
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${E2E_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next dev -p ${E2E_PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${E2E_PORT}`,
    reuseExistingServer: false,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      DATA_DIR: E2E_DATA_DIR,
      E2E_TEST: "true",
      PORT: String(E2E_PORT),
    },
  },
});
