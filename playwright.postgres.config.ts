import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const E2E_PORT = 3007;

// Cargar estrictamente .env.test.local
const envPath = path.resolve(__dirname, ".env.test.local");
if (!fs.existsSync(envPath)) {
  throw new Error("No se encontró .env.test.local para la suite Playwright PostgreSQL");
}

const envContent = fs.readFileSync(envPath, "utf-8");
const parsedEnv: Record<string, string> = {};
for (const rawLine of envContent.split("\n")) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1) continue;
  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  parsedEnv[key] = val;
}

if (!parsedEnv.DATABASE_URL || !parsedEnv.DATABASE_URL.includes("emmanuel_test")) {
  throw new Error("DATABASE_URL no apunta a emmanuel_test en .env.test.local. Abortando.");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/postgres-navegacion.spec.ts",
  timeout: 90000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  workers: 1, // Secuencial para asegurar consistencia transaccional
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-postgres", open: "never" }],
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
    command: `npx next start -p ${E2E_PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${E2E_PORT}`,
    reuseExistingServer: false,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...parsedEnv,
      STORAGE_PROVIDER: "postgres",
      E2E_TEST: "true",
      DATA_DIR: path.resolve(__dirname, "e2e-temp-data"),
      PORT: String(E2E_PORT),
    },
  },
});
