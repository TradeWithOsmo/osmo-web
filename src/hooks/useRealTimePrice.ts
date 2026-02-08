import { useEffect, useRef } from 'react';
import { useMarketStore } from '../store/useMarketStore';

export const useRealTimePrice = (symbol: string | undefined) => {
    const { updateMarketData } = useMarketStore();
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!symbol) return;

        // Cleanup previous connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Backend expects /ws/hyperliquid/{symbol}
        // It says: @app.websocket("/ws/hyperliquid/{symbol}")
        // So for "BTC-USD", assuming we send "BTC-USD" or just "BTC"?
        // Looking at backend code from step 403: 
        // @app.websocket("/ws/hyperliquid/{symbol}")
        // async def hyperliquid_websocket(websocket: WebSocket, symbol: str):
        // It uses symbol directly.

        const url = `ws://localhost:8000/ws/hyperliquid/${symbol}`;
        console.log(`🔌 Connecting to WS: ${url}`);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log(`✅ WS Connected: ${symbol}`);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'price_update' && message.data) {
                    const data = message.data;
                    const updatePayload: any = {};

                    if (data.price) updatePayload.price = parseFloat(data.price);

                    // Only update these if they exist in the message to prevent overwriting with 0
                    if (data.change_24h) updatePayload.change24h = parseFloat(data.change_24h);
                    if (data.change_percent_24h) updatePayload.change24hPercent = parseFloat(data.change_percent_24h);
                    if (data.high_24h) updatePayload.high24h = parseFloat(data.high_24h);
                    if (data.low_24h) updatePayload.low24h = parseFloat(data.low_24h);
                    if (data.volume_24h) updatePayload.volume24h = parseFloat(data.volume_24h);

                    updateMarketData(symbol, updatePayload);
                }
            } catch (e) {
                console.error('WS Parse Error:', e);
            }
        };

        ws.onclose = () => {
            console.log(`❌ WS Disconnected: ${symbol}`);
        };

        ws.onerror = (err) => {
            console.error('WS Error:', err);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [symbol, updateMarketData]);
};
