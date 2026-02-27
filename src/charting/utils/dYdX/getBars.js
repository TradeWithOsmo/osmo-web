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
    const { from, to, firstDataRequest } = periodParams;
    const fromMs = toMillis(from || 0);
    const toMs = toMillis(to || 0);

    try {
        const API_ORIGIN = 'http://82.153.226.91:8000';
        const symbol = symbolInfo.name.replace('/', '-');
        const limit = periodParams.countBack || 500;

        // Specifically route to ASTER source
        const url = `${API_ORIGIN}/api/candles/${encodeURIComponent(symbol)}?exchange=dydx&limit=${limit}&resolution=${encodeURIComponent(resolution)}`;

        console.log(`[dYdX getBars]: Fetching ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            onHistoryCallback([], { noData: true });
            return;
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            onHistoryCallback([], { noData: true });
            return;
        }

        const bars = data.map(b => ({
            time: toMillis(b.timestamp || b.time || b.t),
            open: parseFloat(b.open || b.o),
            high: parseFloat(b.high || b.h),
            low: parseFloat(b.low || b.l),
            close: parseFloat(b.close || b.c),
            volume: parseFloat(b.volume || b.v || 0)
        })).filter(bar => {
            if (!fromMs && !toMs) return true;
            if (fromMs && bar.time < fromMs) return false;
            if (toMs && bar.time > toMs) return false;
            return true;
        }).sort((a, b) => a.time - b.time);

        onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (err) {
        console.error('[dYdX getBars]: ❌ Error:', err.message);
        onErrorCallback(err);
    }
};

const activeSubscriptions = new Map();

export const subscribeBars = (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
) => {
    const API_ORIGIN = 'http://82.153.226.91:8000';
    const WS_ORIGIN = API_ORIGIN.replace(/^http/, 'ws');
    const symbol = symbolInfo.name.replace('/', '-');

    // Connect to dYdX-specific trade/price stream
    const wsUrl = `${WS_ORIGIN}/ws/dydx/${encodeURIComponent(symbol)}`;
    const ws = new WebSocket(wsUrl);

    let lastBar = null;

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'price_update' && message.data) {
                const price = parseFloat(message.data.price);
                const now = Date.now();

                const bar = {
                    time: now,
                    open: lastBar ? lastBar.close : price,
                    high: lastBar ? Math.max(lastBar.high, price) : price,
                    low: lastBar ? Math.min(lastBar.low, price) : price,
                    close: price,
                    volume: parseFloat(message.data.volume_24h || 0)
                };

                lastBar = bar;
                onRealtimeCallback(bar);
            }
        } catch (e) {
            console.error('[dYdX subscribeBars]: WS error', e);
        }
    };

    activeSubscriptions.set(subscriberUID, {
        ws,
        close: () => ws.close()
    });
};

export const unsubscribeBars = (subscriberUID) => {
    const sub = activeSubscriptions.get(subscriberUID);
    if (sub) {
        sub.close();
        activeSubscriptions.delete(subscriberUID);
    }
};
