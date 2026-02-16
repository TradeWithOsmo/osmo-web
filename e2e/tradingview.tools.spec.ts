import { expect, test } from '@playwright/test';

const BACKEND = 'http://127.0.0.1:8000';

async function waitForChartReady(page: any) {
  // In this layout there can be multiple skeleton nodes; rely on chart iframe readiness instead.
  await page.goto('/trade', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#tv_chart_container').first()).toBeVisible();
  await expect(page.locator('#tv_chart_container iframe').first()).toBeVisible({ timeout: 180_000 });
}

test.describe('TradingView Tools E2E', () => {
  test.setTimeout(240_000);
  test('write tools + polymorphism smoke', async ({ page, request }) => {
    await waitForChartReady(page);

    const now = Math.floor(Date.now() / 1000);
    const symbol = 'BTC/USDT';

    // 1) timeframe
    const tf = await request.post(`${BACKEND}/api/e2e/tools/tradingview/set_timeframe`, {
      data: { symbol, timeframe: '1H' },
    });
    expect(tf.ok()).toBeTruthy();
    const tfBody = await tf.json();
    expect(tfBody.error).toBeFalsy();
    expect(tfBody.state_verified).toBeTruthy();

    // 2) indicator add/remove (alias mapping in backend tool)
    const add = await request.post(`${BACKEND}/api/e2e/tools/tradingview/add_indicator`, {
      data: { symbol, name: 'RSI', inputs: {}, force_overlay: true },
    });
    expect(add.ok()).toBeTruthy();
    const addBody = await add.json();
    expect(addBody.error).toBeFalsy();
    expect(addBody.state_verified).toBeTruthy();

    const rem = await request.post(`${BACKEND}/api/e2e/tools/tradingview/remove_indicator`, {
      data: { symbol, name: 'RSI' },
    });
    expect(rem.ok()).toBeTruthy();
    const remBody = await rem.json();
    expect(remBody.error).toBeFalsy();
    expect(remBody.state_verified).toBeTruthy();

    // 3) draw polymorphism: hline + aliases + update + clear
    const draw1 = await request.post(`${BACKEND}/api/e2e/tools/tradingview/draw`, {
      data: {
        symbol,
        tool: 'hline',
        id: 'e2e_support',
        points: [{ time: now, price: 100_000 }],
        style: { color: '#00FF00', linewidth: 2 },
        text: 'support',
      },
    });
    expect(draw1.ok()).toBeTruthy();
    const draw1Body = await draw1.json();
    expect(draw1Body.error).toBeFalsy();
    expect(draw1Body.state_verified).toBeTruthy();

    const upd = await request.post(`${BACKEND}/api/e2e/tools/tradingview/update_drawing`, {
      data: {
        symbol,
        id: 'e2e_support',
        points: [{ time: now, price: 99_500 }],
        style: { color: '#00FF00', linewidth: 1 },
        text: 'support-updated',
      },
    });
    expect(upd.ok()).toBeTruthy();
    const updBody = await upd.json();
    expect(updBody.error).toBeFalsy();
    expect(updBody.state_verified).toBeTruthy();

    const draw2 = await request.post(`${BACKEND}/api/e2e/tools/tradingview/draw`, {
      data: {
        symbol,
        tool: 'rect',
        id: 'e2e_zone',
        points: [
          { time: now - 3600, price: 102_000 },
          { time: now, price: 98_000 },
        ],
        style: { fillColor: 'rgba(255, 0, 0, 0.1)' },
        text: 'zone',
      },
    });
    expect(draw2.ok()).toBeTruthy();
    const draw2Body = await draw2.json();
    expect(draw2Body.error).toBeFalsy();
    expect(draw2Body.state_verified).toBeTruthy();

    const cleared = await request.post(`${BACKEND}/api/e2e/tools/tradingview/clear_drawings`, {
      data: { symbol },
    });
    expect(cleared.ok()).toBeTruthy();
    const clearedBody = await cleared.json();
    expect(clearedBody.error).toBeFalsy();
    expect(clearedBody.state_verified).toBeTruthy();

    // 4) setup_trade polymorphism: gp/gl and validation/invalidation
    const st1 = await request.post(`${BACKEND}/api/e2e/tools/tradingview/setup_trade`, {
      data: {
        symbol,
        side: 'long',
        entry: 100_000,
        sl: 98_000,
        tp: 104_000,
        gp: 102_000,
        gl: 99_000,
        validation_note: 'GP',
        invalidation_note: 'GL',
      },
    });
    expect(st1.ok()).toBeTruthy();
    const st1Body = await st1.json();
    expect(st1Body.error).toBeFalsy();
    expect(st1Body.state_verified).toBeTruthy();

    const st2 = await request.post(`${BACKEND}/api/e2e/tools/tradingview/setup_trade`, {
      data: {
        symbol,
        side: 'short',
        entry: 100_000,
        sl: 102_000,
        tp: 96_000,
        validation: 99_000,
        invalidation: 101_000,
        validation_note: 'validation',
        invalidation_note: 'invalidation',
      },
    });
    expect(st2.ok()).toBeTruthy();
    const st2Body = await st2.json();
    expect(st2Body.error).toBeFalsy();
    expect(st2Body.state_verified).toBeTruthy();

    // 5) price alert + session mark (both are draw_shape wrappers with strict drawing_id verification)
    const alert = await request.post(`${BACKEND}/api/e2e/tools/tradingview/add_price_alert`, {
      data: { symbol, price: 101_234, message: 'e2e' },
    });
    expect(alert.ok()).toBeTruthy();
    const alertBody = await alert.json();
    expect(alertBody.error).toBeFalsy();
    expect(alertBody.state_verified).toBeTruthy();

    const sess = await request.post(`${BACKEND}/api/e2e/tools/tradingview/mark_session`, {
      data: { symbol, session: 'LONDON' },
    });
    expect(sess.ok()).toBeTruthy();
    const sessBody = await sess.json();
    expect(sessBody.error).toBeFalsy();
    expect(sessBody.state_verified).toBeTruthy();
  });
});
