const toMillis = (ts) => {
    const n = Number(ts || 0);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n < 1_000_000_000_000 ? n * 1000 : n;
};

const fetchWithTimeout = async (url, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

export const getBars = async (
    symbolInfo,
    resolution,
    periodParams,
    onHistoryCallback,
    onErrorCallback
) => {
    const { from, to } = periodParams || {};
    const fromMs = toMillis(from || 0);
    const toMs = toMillis(to || 0);

    try {
        const API_ORIGIN = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '');
        const symbol = String(symbolInfo?.name || '').replace('/', '-');
        if (!symbol) {
            onHistoryCallback([], { noData: true });
            return;
        }
        const limit = periodParams?.countBack || 500;
        const url = `${API_ORIGIN}/api/candles/${encodeURIComponent(symbol)}?exchange=aevo&limit=${limit}&resolution=${encodeURIComponent(resolution)}`;
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
            onHistoryCallback([], { noData: true });
            return;
        }

        const data = await response.json();
        const sourceBars = Array.isArray(data) ? data : (Array.isArray(data?.candles) ? data.candles : []);
        if (sourceBars.length === 0) {
            onHistoryCallback([], { noData: true });
            return;
        }

        const bars = sourceBars
            .map((b) => ({
                time: toMillis(b.timestamp || b.time || b.t),
                open: parseFloat(b.open || b.o),
                high: parseFloat(b.high || b.h),
                low: parseFloat(b.low || b.l),
                close: parseFloat(b.close || b.c),
                volume: parseFloat(b.volume || b.v || 0),
            }))
            .filter((bar) => {
                if (!Number.isFinite(bar.time) || bar.time <= 0) return false;
                if (!Number.isFinite(bar.open) || !Number.isFinite(bar.high) || !Number.isFinite(bar.low) || !Number.isFinite(bar.close)) return false;
                if (fromMs && bar.time < fromMs) return false;
                if (toMs && bar.time > toMs) return false;
                return true;
            })
            .sort((a, b) => a.time - b.time);

        onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (err) {
        console.error('[Aevo getBars]: Error:', err);
        onHistoryCallback([], { noData: true });
        onErrorCallback?.(err);
    }
};

const activeSubscriptions = new Map();

export const subscribeBars = (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
) => {
    const API_ORIGIN = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '');
    const WS_ORIGIN = API_ORIGIN.replace(/^https?:/i, (m) => (m.toLowerCase() === 'https:' ? 'wss:' : 'ws:'));
    const symbol = String(symbolInfo?.name || '').replace('/', '-');
    const wsUrl = `${WS_ORIGIN}/ws/aevo/${encodeURIComponent(symbol)}`;
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
                    volume: parseFloat(message.data.volume_24h || 0),
                };

                lastBar = bar;
                onRealtimeCallback(bar);
            }
        } catch (e) {
            console.error('[Aevo subscribeBars]: WS error', e);
        }
    };

    activeSubscriptions.set(subscriberUID, {
        ws,
        close: () => ws.close(),
    });
};

export const unsubscribeBars = (subscriberUID) => {
    const sub = activeSubscriptions.get(subscriberUID);
    if (sub) {
        sub.close();
        activeSubscriptions.delete(subscriberUID);
    }
};
