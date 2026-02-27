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

        const url = `${API_ORIGIN}/api/candles/${encodeURIComponent(symbol)}?exchange=avantis&limit=${limit}&resolution=${encodeURIComponent(resolution)}`;

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
            time: toMillis(b.t || b.time || b.timestamp),
            open: parseFloat(b.o || b.open),
            high: parseFloat(b.h || b.high),
            low: parseFloat(b.l || b.low),
            close: parseFloat(b.c || b.close),
            volume: parseFloat(b.v || b.volume || 0)
        })).filter(bar => {
            if (!fromMs && !toMs) return true;
            if (fromMs && bar.time < fromMs) return false;
            if (toMs && bar.time > toMs) return false;
            return true;
        }).sort((a, b) => a.time - b.time);

        if (bars.length === 0 && !firstDataRequest) {
            onHistoryCallback([], { noData: true });
            return;
        }

        onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (err) {
        console.error('[Avantis getBars] Error:', err);
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
    const wsUrl = `${WS_ORIGIN}/ws/avantis/${encodeURIComponent(symbol)}`;

    const ws = new WebSocket(wsUrl);
    let lastBar = { time: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'price_update' && message.data) {
                const data = message.data;
                const price = parseFloat(data.price);
                const now = Date.now();

                const bar = {
                    time: now,
                    open: lastBar.close || price,
                    high: Math.max(lastBar.high || price, price),
                    low: Math.min(lastBar.low || price, price),
                    close: price,
                    volume: 0
                };

                lastBar = bar;
                onRealtimeCallback(bar);
            }
        } catch (e) {
            console.error('[Avantis subscribeBars WS] Error parsing message:', e);
        }
    };

    activeSubscriptions.set(subscriberUID, { ws, close: () => ws.close() });
};

export const unsubscribeBars = (subscriberUID) => {
    const subscription = activeSubscriptions.get(subscriberUID);
    if (subscription) {
        subscription.close();
        activeSubscriptions.delete(subscriberUID);
    }
};
