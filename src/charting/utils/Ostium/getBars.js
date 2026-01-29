const BACKEND_URL = 'http://localhost:8000';

export const getBars = async (
    symbolInfo,
    resolution,
    periodParams,
    onHistoryCallback,
    onErrorCallback
) => {
    const { from, to, firstDataRequest } = periodParams;

    try {
        const symbol = symbolInfo.name.replace('/', '-');
        const limit = periodParams.countBack || 500;
        const url = `${BACKEND_URL}/api/candles/${symbol}?exchange=ostium&limit=${limit}`;

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

        const bars = data.map(b => {
            let timestamp = b.t || b.time || b.timestamp;
            if (timestamp > 10000000000) {
                timestamp = Math.floor(timestamp / 1000);
            }

            return {
                time: timestamp,
                open: parseFloat(b.o || b.open),
                high: parseFloat(b.h || b.high),
                low: parseFloat(b.l || b.low),
                close: parseFloat(b.c || b.close),
                volume: 0
            };
        }).filter(bar => bar.time >= from && bar.time <= to)
            .sort((a, b) => a.time - b.time);

        if (bars.length === 0 && !firstDataRequest) {
            onHistoryCallback([], { noData: true });
            return;
        }

        console.log(`[Ostium] ✅ ${symbol}: ${bars.length} bars matched for range`);
        onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (err) {
        console.error('[Ostium] ❌ Error:', err.message);
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
    console.log('[Ostium subscribeBars]: Method call with subscriberUID:', subscriberUID);

    const symbol = symbolInfo.name.replace('/', '-');
    const wsUrl = `ws://localhost:8000/ws/ostium/${symbol}`;
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

                // TradingView expects updates for the CURRENT bar interval
                // For Ostium, we create/update 1m bars
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
            console.error('[Ostium subscribeBars]: WS error', e);
        }
    };

    ws.onopen = () => console.log('[Ostium subscribeBars]: WS connected');
    ws.onclose = () => console.log('[Ostium subscribeBars]: WS closed');
    ws.onerror = (err) => console.error('[Ostium subscribeBars]: WS error', err);

    activeSubscriptions.set(subscriberUID, {
        ws: ws,
        close: () => ws.close()
    });
};

export const unsubscribeBars = (subscriberUID) => {
    console.log('[Ostium unsubscribeBars]: Method call with subscriberUID:', subscriberUID);

    const subscription = activeSubscriptions.get(subscriberUID);
    if (subscription) {
        subscription.close();
        activeSubscriptions.delete(subscriberUID);
    }
};
