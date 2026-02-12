const BACKEND_URL = 'http://localhost:8000';

const toMillis = (ts) => {
  const n = Number(ts || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n < 1_000_000_000_000 ? n * 1000 : n;
};

export const getBars = async (
  symbolInfo,
  resolution,
  periodParams,
  onHistoryCallback,
  onErrorCallback
) => {

  try {
    const fromMs = toMillis(periodParams?.from || 0);
    const toMs = toMillis(periodParams?.to || 0);
    const symbol = symbolInfo.name.replace('/', '-');
    const limit = periodParams.countBack || 300;
    const url = `${BACKEND_URL}/api/candles/${symbol}?limit=${limit}&resolution=${encodeURIComponent(resolution)}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[Hyperliquid] ❌ HTTP ${response.status} for ${symbol}`);
      onHistoryCallback([], { noData: true });
      return;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[Hyperliquid] ⚠️ No data for ${symbol}`);
      onHistoryCallback([], { noData: true });
      return;
    }

    // Format for TradingView
    // Backend returns [{timestamp, open, high, low, close, volume}, ...] (Hyperliquid)
    // or [{t, o, h, l, c, i}, ...] (Ostium)
    // TradingView expects [{time, open, high, low, close, volume}, ...]
    const bars = data.map(b => {
      return {
        // TradingView Charting Library expects epoch in milliseconds.
        time: toMillis(b.time || b.timestamp || b.t),
        open: parseFloat(b.open || b.o),
        high: parseFloat(b.high || b.h),
        low: parseFloat(b.low || b.l),
        close: parseFloat(b.close || b.c),
        volume: parseFloat(b.volume || b.v || 0)
      };
    })
      .filter((bar) => {
        if (!fromMs && !toMs) return true;
        if (fromMs && bar.time < fromMs) return false;
        if (toMs && bar.time > toMs) return false;
        return true;
      })
      .sort((a, b) => a.time - b.time);

    console.log(`[getBars]: Returning ${bars.length} bars, time range: ${bars[0]?.time} - ${bars[bars.length - 1]?.time}`);
    onHistoryCallback(bars, { noData: false });
  } catch (err) {
    console.error('[Hyperliquid] ❌ Error:', err.message);
    onErrorCallback(err);
  }
};

// Store active subscriptions and their cleanup functions
const activeSubscriptions = new Map();

export const subscribeBars = (
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback
) => {
  console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);

  const symbol = symbolInfo.name.replace('/', '-');
  const wsUrl = `ws://localhost:8000/ws/hyperliquid/${symbol}`;
  const ws = new WebSocket(wsUrl);

  let lastBar = {
    time: 0,
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'price_update' && message.data) {
        const data = message.data;
        const price = parseFloat(data.price);
        const now = Date.now();

        // TradingView expect updates for the CURRENT bar interval
        // For simplicity, we create/update a 1m bar (or matching resolution)
        // TradingView handles merging multiple ticks into the same bar if timing matches

        const bar = {
          time: now,
          open: lastBar.close || price,
          high: Math.max(lastBar.high || price, price),
          low: Math.min(lastBar.low || price, price),
          close: price,
          volume: data.volume_24h || 0
        };

        lastBar = bar;
        onRealtimeCallback(bar);
      }
    } catch (e) {
      console.error('[subscribeBars]: WS error', e);
    }
  };

  ws.onclose = () => console.log('[subscribeBars]: WS closed');

  activeSubscriptions.set(subscriberUID, {
    ws: ws,
    close: () => ws.close()
  });
};

export const unsubscribeBars = (subscriberUID) => {
  console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);

  const subscription = activeSubscriptions.get(subscriberUID);
  if (subscription) {
    subscription.close();
    activeSubscriptions.delete(subscriberUID);
  }
};
