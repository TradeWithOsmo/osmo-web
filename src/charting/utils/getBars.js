
export const getBars = async (
  symbolInfo,
  resolution,
  periodParams,
  onHistoryCallback,
  onErrorCallback
) => {
  try {
    const requiredBars = periodParams.countBack || 100;
    const toTime = periodParams.to * 1000; // milliseconds
    const bars = [];

    // Generate dummy data (BTC-like price)
    let currentPrice = 45000;
    let currentTime = toTime;

    // Resolution to ms
    const resolutionToMs = (res) => {
      if (res === '1D') return 24 * 60 * 60 * 1000;
      if (res === '240') return 4 * 60 * 60 * 1000;
      if (res === '60') return 60 * 60 * 1000;
      return 15 * 60 * 1000; // default 15m
    }

    const timeStep = resolutionToMs(resolution);

    for (let i = 0; i < requiredBars + 50; i++) {
      // Random walk
      const volatility = currentPrice * 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility;

      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;

      bars.unshift({
        time: currentTime,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: Math.random() * 1000 * (i % 3 === 0 ? 5 : 1) // occasional spike
      });

      currentPrice = open - (Math.random() - 0.5) * volatility; // Walk backwards roughly
      currentTime -= timeStep;
    }

    // Since we walked backwards, let's just make sure they are sorted (unshift does this, but logic is time descending during gen)
    // Actually, simple generator:
    // Generate forward from (to - requiredBars * step)

    // Let's do a cleaner generation to ensure continuity
    const cleanBars = [];
    const step = resolutionToMs(resolution);
    const startTime = periodParams.to * 1000 - (requiredBars * step);

    let price = 42000; // Start price

    for (let i = 0; i < requiredBars; i++) {
      const time = startTime + (i * step);
      if (time > periodParams.to * 1000) break;

      const vol = price * 0.015;
      const change = (Math.random() - 0.5) * vol;
      const close = price + change;
      const high = Math.max(price, close) + Math.random() * vol * 0.3;
      const low = Math.min(price, close) - Math.random() * vol * 0.3;

      cleanBars.push({
        time: time,
        open: price,
        high: high,
        low: low,
        close: close,
        volume: 500 + Math.random() * 1000
      });

      price = close;
    }

    if (cleanBars.length === 0) {
      onHistoryCallback([], { noData: true });
    } else {
      onHistoryCallback(cleanBars, { noData: false });
    }
  } catch (err) {
    console.error(err);
    onErrorCallback(err);
  }
};

// Store active subscriptions
const activeSubscriptions = new Map();

// Generate a random bar based on the last bar
const getLastBar = () => ({
  time: Date.now(),
  open: 42000,
  high: 42100,
  low: 41900,
  close: 42050,
  volume: 100
}); // Placeholder

let lastBar = getLastBar();

export const subscribeBars = (
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback
) => {
  console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);

  if (activeSubscriptions.has(subscriberUID)) {
    clearInterval(activeSubscriptions.get(subscriberUID));
  }

  const interval = setInterval(() => {
    // Simulate tick
    const now = Date.now();
    const vol = lastBar.close * 0.002;
    const change = (Math.random() - 0.5) * vol;

    const newPrice = lastBar.close + change;

    const bar = {
      time: now,
      open: lastBar.close,
      high: Math.max(lastBar.close, newPrice) + 5,
      low: Math.min(lastBar.close, newPrice) - 5,
      close: newPrice,
      volume: Math.random() * 100
    };

    lastBar = bar;
    onRealtimeCallback(bar);
  }, 1000);

  activeSubscriptions.set(subscriberUID, interval);
};

export const unsubscribeBars = (subscriberUID) => {
  console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);

  if (activeSubscriptions.has(subscriberUID)) {
    clearInterval(activeSubscriptions.get(subscriberUID));
    activeSubscriptions.delete(subscriberUID);
  }
};