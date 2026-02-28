import { useEffect, useRef } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { usePortfolioStore } from '../store/usePortfolioStore';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/,$/, '');
const WS_URL = API_URL.replace('http', 'ws') + '/ws/hyperliquid/ALL';
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const MAX_RETRIES = Infinity; // Never give up, keep trying to reconnect
const FALLBACK_MARKETS_REFRESH_MS = 30000;

export const useGlobalMarketStream = () => {
    const { updatePrices, setWsStatus, fetchMarkets } = useMarketStore();
    const { updateMarkPrices } = usePortfolioStore();
    const wsRef = useRef<WebSocket | null>(null);
    const retryCountRef = useRef(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const shouldConnectRef = useRef(true);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRefreshingRef = useRef(false);

    // Use a ref for updatePrices to avoid effect re-runs if it changes reference
    const updatePricesRef = useRef(updatePrices);
    const updateMarkPricesRef = useRef(updateMarkPrices);
    useEffect(() => {
        updatePricesRef.current = updatePrices;
        updateMarkPricesRef.current = updateMarkPrices;
    }, [updatePrices, updateMarkPrices]);

    useEffect(() => {
        shouldConnectRef.current = true;

        const connect = () => {
            if (!shouldConnectRef.current) return;

            // Clear existing connection if any
            if (wsRef.current) {
                wsRef.current.onclose = null; // Prevent reconnect loop during intentional close
                wsRef.current.close();
                wsRef.current = null;
            }

            setWsStatus('connecting');
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log(`✅ Global Market Stream Connected`);
                setWsStatus('connected');
                retryCountRef.current = 0;

                // Clear old heartbeat and start new one (Ping every 30s)
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 30000);
            };

            // Throttle Buffer
            let throttleBuffer: Record<string, any> = {};
            let lastFlush = 0;
            const FLUSH_INTERVAL = 200; // ms

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'price_update' && message.data) {
                        // Merge into buffer
                        Object.assign(throttleBuffer, message.data);

                        const now = Date.now();
                        if (now - lastFlush > FLUSH_INTERVAL) {
                            updatePricesRef.current(throttleBuffer);
                            updateMarkPricesRef.current(throttleBuffer);
                            throttleBuffer = {};
                            lastFlush = now;
                        }
                    }
                } catch (e) {
                    // Silent fail for parsing to reduce noise
                }
            };

            ws.onclose = (event) => {
                setWsStatus('disconnected');
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }

                if (shouldConnectRef.current && retryCountRef.current < MAX_RETRIES) {
                    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current), MAX_RETRY_DELAY);
                    console.warn(`⚠️ Global Stream Disconnected (${event.code}). Retrying in ${delay}ms...`);
                    retryCountRef.current++;
                    retryTimeoutRef.current = setTimeout(connect, delay);
                }
            };

            ws.onerror = () => {
                // onclose will handle logic
            };
        };

        connect();

        // Fallback refresh for non-HL/Ostium exchanges:
        // keeps allMarkets (per-source rows) moving even when global WS only streams part of sources.
        refreshIntervalRef.current = setInterval(async () => {
            if (!shouldConnectRef.current || isRefreshingRef.current) return;
            if (document.hidden) return;
            isRefreshingRef.current = true;
            try {
                await fetchMarkets();
            } catch {
                // best-effort refresh
            } finally {
                isRefreshingRef.current = false;
            }
        }, FALLBACK_MARKETS_REFRESH_MS);

        return () => {
            shouldConnectRef.current = false;

            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
                wsRef.current = null;
            }
            console.log('🔌 Global Market Stream Cleanup');
        };
    }, []); // Run only once on mount
};
