/**
 * Playwright E2E tests for TradingView tools that require a live frontend.
 *
 * Prerequisite: both the e2e backend and frontend must be running (or playwright
 * starts them via the webServer config in playwright.config.ts).
 *
 * Run:
 *   cd D:/WorkingSpace/v1-web
 *   npx playwright test e2e/tradingview-tools.spec.ts
 */

import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

const API = "http://127.0.0.1:8000";
const SYMBOL = "BTC-USD";

// ─── helpers ───────────────────────────────────────────────────────────────────

/** Wait for TradingView chart to finish loading (skeleton disappears from DOM). */
async function waitForChartReady(page: Page): Promise<void> {
  // Skeleton is rendered while !isChartReady; wait for it to appear first so we
  // don't race against the initial React render, then wait for it to vanish.
  try {
    await page.waitForSelector(".skeletonChart", {
      state: "attached",
      timeout: 15_000,
    });
  } catch {
    // Skeleton may have already gone if chart loaded instantly (unlikely but OK).
  }
  await page.waitForSelector(".skeletonChart", {
    state: "detached",
    timeout: 90_000,
  });
}

/**
 * Poll the backend until it has received chart-state data for the given symbol/timeframe.
 * The frontend connector hook (useTradingViewConnector) posts to this endpoint.
 */
async function waitForIndicators(
  request: APIRequestContext,
  symbol = SYMBOL,
  timeframe = "1D",
  timeoutMs = 30_000,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  let lastErr = "";
  while (Date.now() < deadline) {
    try {
      const resp = await request.get(`${API}/api/connectors/tradingview/indicators`, {
        params: { symbol, timeframe },
      });
      if (resp.ok()) {
        const body = (await resp.json()) as Record<string, unknown>;
        if (body?.symbol) return body;
      }
    } catch (e) {
      lastErr = String(e);
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(
    `Timeout: backend never received chart state for ${symbol}/${timeframe}. Last error: ${lastErr}`,
  );
}

/** POST to an e2e tool endpoint and return the parsed JSON body. */
async function e2ePost(
  request: APIRequestContext,
  path: string,
  body: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const resp = await request.post(`${API}${path}`, { data: body });
  const json = (await resp.json()) as Record<string, unknown>;
  return { status: resp.status(), body: json };
}

// ─── tests ─────────────────────────────────────────────────────────────────────

test.describe("TradingView Tools (frontend required)", () => {
  // Per-test timeout: TradingView can take 30–60 s to load + command round-trip.
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/trade");
    await waitForChartReady(page);
  });

  // ── 1. Backend receives chart state ────────────────────────────────────────

  test("backend receives chart state after chart ready", async ({ request }) => {
    const data = await waitForIndicators(request);
    expect(typeof data.symbol).toBe("string");
    expect(typeof data.timeframe).toBe("string");
  });

  // ── 2. get_active_indicators ───────────────────────────────────────────────

  test("get_active_indicators — returns list", async ({ request }) => {
    const data = await waitForIndicators(request);
    expect(data).toHaveProperty("active_indicators");
    expect(Array.isArray(data.active_indicators)).toBe(true);
  });

  // ── 3. set_timeframe ───────────────────────────────────────────────────────

  test("set_timeframe to 4H", async ({ page, request }) => {
    await waitForIndicators(request);

    const { status, body } = await e2ePost(request, "/api/e2e/tools/tradingview/set_timeframe", {
      symbol: SYMBOL,
      timeframe: "240", // TradingView 4H = "240"
    });
    expect(status).toBe(200);
    expect(body).toBeDefined();

    // Give the frontend time to receive, execute, and report back the command.
    await page.waitForTimeout(4_000);

    // Backend should now have state for the new timeframe.
    const updated = await waitForIndicators(request, SYMBOL, "240", 20_000);
    expect(updated.symbol).toMatch(/BTC/i);
  });

  // ── 4. add_indicator ───────────────────────────────────────────────────────

  test("add_indicator RSI — queues command", async ({ request }) => {
    await waitForIndicators(request);

    const { status, body } = await e2ePost(
      request,
      "/api/e2e/tools/tradingview/add_indicator",
      { symbol: SYMBOL, name: "RSI" },
    );
    expect(status).toBe(200);
    // The tool returns a queued/completed envelope; no error field expected.
    expect(body).not.toHaveProperty("error");
  });

  // ── 5. verify_indicator_present ───────────────────────────────────────────

  test("verify_indicator_present RSI after add", async ({ page, request }) => {
    await waitForIndicators(request);

    // Add RSI first.
    await e2ePost(request, "/api/e2e/tools/tradingview/add_indicator", {
      symbol: SYMBOL,
      name: "RSI",
    });
    // Allow frontend to execute the command.
    await page.waitForTimeout(5_000);

    const { status, body } = await e2ePost(
      request,
      "/api/e2e/tools/tradingview/verify_indicator_present",
      { symbol: SYMBOL, name: "RSI", timeframe: "1D", timeout_sec: 10.0 },
    );
    expect(status).toBe(200);
    // Response should indicate presence (exact key varies by impl).
    const present = body.present ?? body.found ?? body.verified ?? !body.error;
    expect(present).toBeTruthy();
  });

  // ── 6. remove_indicator ───────────────────────────────────────────────────

  test("remove_indicator RSI", async ({ page, request }) => {
    await waitForIndicators(request);

    // Ensure RSI is there before removing.
    await e2ePost(request, "/api/e2e/tools/tradingview/add_indicator", {
      symbol: SYMBOL,
      name: "RSI",
    });
    await page.waitForTimeout(4_000);

    const { status, body } = await e2ePost(
      request,
      "/api/e2e/tools/tradingview/remove_indicator",
      { symbol: SYMBOL, name: "RSI" },
    );
    expect(status).toBe(200);
    expect(body).not.toHaveProperty("error");
  });

  // ── 7. clear_indicators ───────────────────────────────────────────────────

  test("clear_indicators", async ({ page, request }) => {
    await waitForIndicators(request);

    // Add something to clear.
    await e2ePost(request, "/api/e2e/tools/tradingview/add_indicator", {
      symbol: SYMBOL,
      name: "MACD",
    });
    await page.waitForTimeout(4_000);

    const { status, body } = await e2ePost(
      request,
      "/api/e2e/tools/tradingview/clear_indicators",
      { symbol: SYMBOL },
    );
    expect(status).toBe(200);
    expect(body).not.toHaveProperty("error");
  });

  // ── 8. set_symbol to ETH ──────────────────────────────────────────────────

  test("set_symbol to ETH-USD", async ({ page, request }) => {
    await waitForIndicators(request);

    const { status, body } = await e2ePost(
      request,
      "/api/e2e/tools/tradingview/set_symbol",
      { symbol: SYMBOL, target_symbol: "ETH-USD" },
    );
    expect(status).toBe(200);
    expect(body).not.toHaveProperty("error");

    // Wait for frontend to switch symbol and push new state.
    await page.waitForTimeout(5_000);

    const updated = await waitForIndicators(request, "ETH-USD", "1D", 20_000);
    expect(String(updated.symbol)).toMatch(/ETH/i);
  });

  // ── 9. setup_trade ────────────────────────────────────────────────────────

  test("setup_trade BTC long", async ({ page, request }) => {
    await waitForIndicators(request);

    const { status, body } = await e2ePost(
      request,
      "/api/e2e/tools/tradingview/setup_trade",
      {
        symbol: SYMBOL,
        side: "long",
        entry: 95_000,
        sl: 93_000,
        tp: 100_000,
      },
    );
    expect(status).toBe(200);
    expect(body).not.toHaveProperty("error");
    // Allow frontend to render the trade setup overlay.
    await page.waitForTimeout(3_000);
  });

  // ── 10. indicator_aliases & draw_tools (no frontend interaction needed) ───

  test("indicator_aliases endpoint returns map", async ({ request }) => {
    const resp = await request.get(`${API}/api/e2e/tools/tradingview/indicator_aliases`);
    expect(resp.ok()).toBe(true);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(typeof body).toBe("object");
  });

  test("draw_tools endpoint returns map", async ({ request }) => {
    const resp = await request.get(`${API}/api/e2e/tools/tradingview/draw_tools`);
    expect(resp.ok()).toBe(true);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(typeof body).toBe("object");
  });
});
