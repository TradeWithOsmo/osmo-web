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
        const API_ORIGIN = 'http://82.153.226.91:8000';
        const symbol = symbolInfo.name.replace('/', '-');
        const limit = periodParams.countBack || 500;
        const url = `${API_ORIGIN}/api/candles/${encodeURIComponent(symbol)}?exchange=vest&limit=${limit}&resolution=${encodeURIComponent(resolution)}`;

        const response = await fetch(url);
        if (!response.ok) {
            onHistoryCallback([], { noData: true });
            return;
        }

        const data = await response.json();
        const bars = data.map(b => ({
            time: toMillis(b.timestamp || b.time || b.t),
            open: parseFloat(b.open || b.o),
            high: parseFloat(b.high || b.h),
            low: parseFloat(b.low || b.l),
            close: parseFloat(b.close || b.c),
            volume: parseFloat(b.volume || b.v || 0)
        })).sort((a, b) => a.time - b.time);

        onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (err) {
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

    const wsUrl = `${WS_ORIGIN}/ws/vest/${encodeURIComponent(symbol)}`;
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
            console.error('[Vest subscribeBars]: WS error', e);
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
