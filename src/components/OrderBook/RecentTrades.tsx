import React, { useState, useEffect, useRef } from 'react';
import styles from './OrderBookPanel.module.css';
import { useMarketStore } from '../../store/useMarketStore';

interface TradeRowData {
    id: string;
    price: number;
    size: number;
    time: string;
    side: 'buy' | 'sell';
}

interface RecentTradesProps {
    grouping?: number;
}

const RecentTrades: React.FC<RecentTradesProps> = ({ grouping = 0.01 }) => {
    const { selectedMarket } = useMarketStore();
    const [trades, setTrades] = useState<TradeRowData[]>([]);
    const [tradeRowCount, setTradeRowCount] = useState<number>(20);
    const tradesContainerRef = useRef<HTMLDivElement>(null);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const WS_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/,$/, '').replace(/^http/, 'ws');

    // Clear stale data when the market changes
    useEffect(() => {
        setTrades([]);
    }, [selectedMarket?.symbol]);

    useEffect(() => {
        if (!selectedMarket) return;

        const symbol = selectedMarket.symbol;
        const ws = new WebSocket(`${WS_ORIGIN}/ws/trades/${symbol}`);

        let dataReceived = false;
        const timeout = setTimeout(() => {
            if (!dataReceived && selectedMarket.source !== 'hyperliquid') {
                setIsAvailable(false);
            }
        }, 5000);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'trades' && Array.isArray(message.data)) {
                    dataReceived = true;
                    setIsAvailable(true);
                    const formatted: TradeRowData[] = message.data
                        .map((t: any) => {
                            const price = parseFloat(t.px);
                            const size = parseFloat(t.sz);
                            if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(size) || size <= 0) {
                                return null;
                            }
                            return {
                                id: t.hash || t.tx_hash || `${t.time}-${t.px}-${t.sz}`,
                                price,
                                size,
                                time: new Date(t.time).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                                side: t.side === 'B' ? 'buy' : 'sell'
                            };
                        })
                        .filter(Boolean) as TradeRowData[];

                    setTrades(prev => [...formatted, ...prev].slice(0, 100));
                }
            } catch (e) {
                console.error("Trades WS error:", e);
            }
        };

        return () => {
            ws.close();
            clearTimeout(timeout);
        };
    }, [selectedMarket?.symbol, WS_ORIGIN]);

    useEffect(() => {
        const calculateRows = () => {
            if (tradesContainerRef.current) {
                const height = tradesContainerRef.current.clientHeight;
                setTradeRowCount(Math.max(10, Math.floor(height / 24)));
            }
        };
        calculateRows();
        const obs = new ResizeObserver(calculateRows);
        if (tradesContainerRef.current) obs.observe(tradesContainerRef.current);
        return () => obs.disconnect();
    }, []);

    const formatPrice = (price: number) => {
        if (!price) return '0.00';

        // Calculate decimals based on grouping (e.g., 0.01 -> 2 decimals)
        const decimals = grouping < 1 ? Math.max(0, -Math.floor(Math.log10(grouping))) : 0;

        return price.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    if (!isAvailable) return null;

    const isLoading = trades.length === 0;

    return (
        <div className={styles.tradesWrapper}>
            <div className={styles.columnHeader}>
                <div className={`${styles.col} ${styles.left}`}>Price</div>
                <div className={`${styles.col} ${styles.center}`}>Size ({selectedMarket?.symbol.split('-')[0]})</div>
                <div className={styles.col}>Time</div>
            </div>
            <div className={styles.contentContainer} ref={tradesContainerRef}>
                {isLoading ? (
                    Array.from({ length: tradeRowCount }).map((_, i) => (
                        <div key={`trade-skeleton-${i}`} className={`${styles.skeleton} ${styles.skeletonTradeRow}`} />
                    ))
                ) : (
                    trades.slice(0, tradeRowCount).map((trade) => (
                        <div key={trade.id} className={styles.tradeRow}>
                            <div className={`${styles.cell} ${styles.left}`} style={{ color: trade.side === 'buy' ? '#00E396' : '#FF4560' }}>
                                {formatPrice(trade.price)}
                            </div>
                            <div className={`${styles.cell} ${styles.center} ${styles.defaultText}`}>
                                {trade.size.toFixed(4)}
                            </div>
                            <div className={`${styles.cell} ${styles.timeText}`}>
                                {trade.time}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentTrades;
