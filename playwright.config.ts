import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "..\\backend\\.venv\\Scripts\\python.exe -m uvicorn websocket.tests.e2e_main:app --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/healthz",
      reuseExistingServer: true,
      timeout: 180_000,
      cwd: "..\\backend",
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      // Use root URL for readiness checks; this app uses pushState routing,
      // and some dev servers may not serve deep links like /trade for "wait until 200 OK".
      url: "http://127.0.0.1:5173/",
      reuseExistingServer: true,
      timeout: 180_000,
      // Point the frontend at the local e2e backend (not VPS) when playwright starts it.
      // If you have `npm run dev` already running, it must also use VITE_API_URL=http://127.0.0.1:8000.
      env: { VITE_API_URL: "http://127.0.0.1:8000" },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
