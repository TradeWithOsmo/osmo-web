import React, { useState, useEffect, useRef } from 'react';
import styles from './OrderBookPanel.module.css';
import { useMarketStore } from '../../store/useMarketStore';

interface OrderRowData {
    id: string;
    price: number;
    amount: number;
    total: number;
    type: 'ask' | 'bid';
    depthPercent: number;
}

interface OrderBookProps {
    grouping?: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ grouping = 0.01 }) => {
    const { selectedMarket, setPendingLimitPrice } = useMarketStore();
    const [asks, setAsks] = useState<OrderRowData[]>([]);
    const [bids, setBids] = useState<OrderRowData[]>([]);
    const [rowCount, setRowCount] = useState<number>(15);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAvailable, setIsAvailable] = useState<boolean>(true); // Assume available until proven otherwise
    const WS_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/,$/, '').replace(/^http/, 'ws');

    // Clear stale data when the market changes
    useEffect(() => {
        setAsks([]);
        setBids([]);
    }, [selectedMarket?.symbol]);

    useEffect(() => {
        if (!selectedMarket) return;

        const symbol = selectedMarket.symbol;
        const exchange = (selectedMarket as any).source || 'hyperliquid';
        const ws = new WebSocket(`${WS_ORIGIN}/ws/orderbook/${symbol}?exchange=${exchange}`);

        let dataReceived = false;
        const timeout = setTimeout(() => {
            if (!dataReceived && selectedMarket.source !== 'hyperliquid') {
                setIsAvailable(false);
            }
        }, 5000);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                // Orderbook unavailable for this exchange (e.g. Ostium, Avantis)
                if (message.type === 'orderbook_unavailable') {
                    setIsAvailable(false);
                    return;
                }

                // Multi-exchange format from tradebook router
                const bookData = message.type === 'orderbook' && message.data
                    ? { bids: message.data.bids, asks: message.data.asks }
                    // Legacy Hyperliquid native WS format
                    : message.type === 'l2Book' && message.data?.levels
                        ? {
                            bids: (message.data.levels[0] || []).map((l: any) => ({ px: l.px, sz: l.sz })),
                            asks: (message.data.levels[1] || []).map((l: any) => ({ px: l.px, sz: l.sz }))
                        }
                        : null;

                if (!bookData) return;

                dataReceived = true;
                setIsAvailable(true);

                const { bids: rawBids = [], asks: rawAsks = [] } = bookData;

                let askTotal = 0;
                const processedAsks = rawAsks.slice(0, rowCount).map((l: any, i: number) => {
                    const price = parseFloat(l.px);
                    const amount = parseFloat(l.sz);
                    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(amount) || amount <= 0) return null;
                    askTotal += amount;
                    return { id: `ask-${i}`, price, amount, total: askTotal, type: 'ask' as const, depthPercent: 0 };
                }).filter(Boolean) as OrderRowData[];

                let bidTotal = 0;
                const processedBids = rawBids.slice(0, rowCount).map((l: any, i: number) => {
                    const price = parseFloat(l.px);
                    const amount = parseFloat(l.sz);
                    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(amount) || amount <= 0) return null;
                    bidTotal += amount;
                    return { id: `bid-${i}`, price, amount, total: bidTotal, type: 'bid' as const, depthPercent: 0 };
                }).filter(Boolean) as OrderRowData[];

                const maxTotal = Math.max(
                    processedAsks.length > 0 ? processedAsks[processedAsks.length - 1].total : 0,
                    processedBids.length > 0 ? processedBids[processedBids.length - 1].total : 0
                );
                if (maxTotal > 0) {
                    processedAsks.forEach((a: any) => a.depthPercent = (a.total / maxTotal) * 100);
                    processedBids.forEach((b: any) => b.depthPercent = (b.total / maxTotal) * 100);
                }
                setAsks([...processedAsks].reverse());
                setBids(processedBids);
            } catch (e) {
                console.error("OrderBook WS error:", e);
            }
        };

        return () => {
            ws.close();
            clearTimeout(timeout);
        };
    }, [selectedMarket?.symbol, rowCount, WS_ORIGIN]);

    useEffect(() => {
        const calculateRows = () => {
            if (containerRef.current) {
                const height = containerRef.current.clientHeight;
                const availableHeight = height - 40;
                setRowCount(Math.max(5, Math.floor((availableHeight / 2) / 21)));
            }
        };
        calculateRows();
        const obs = new ResizeObserver(calculateRows);
        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    const [prevPrice, setPrevPrice] = useState<number>(0);
    const [priceTrend, setPriceTrend] = useState<'up' | 'down'>('up');

    // Track price trend from MarketStore (global stream)
    useEffect(() => {
        if (selectedMarket?.price) {
            if (prevPrice !== 0 && selectedMarket.price !== prevPrice) {
                setPriceTrend(selectedMarket.price >= prevPrice ? 'up' : 'down');
            }
            setPrevPrice(selectedMarket.price);
        }
    }, [selectedMarket?.price]);

    const formatPrice = (price: number) => {
        if (!price) return '0.00';

        // Calculate decimals based on grouping (e.g., 0.01 -> 2 decimals)
        const decimals = grouping < 1 ? Math.max(0, -Math.floor(Math.log10(grouping))) : 0;

        // Round to grouping step
        const rounded = Math.round(price / grouping) * grouping;

        return rounded.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    const formatAmount = (amount: number) => amount.toFixed(4);
    const handlePriceClick = (clickedPrice: number) => {
        if (!selectedMarket || !Number.isFinite(clickedPrice) || clickedPrice <= 0) return;
        setPendingLimitPrice(selectedMarket.symbol, clickedPrice);
    };

    if (!isAvailable) return null;

    // Calculate spread
    const bestBid = bids.length > 0 ? bids[0].price : 0;
    const bestAsk = asks.length > 0 ? asks[asks.length - 1].price : 0;
    const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
    const spreadPercent = spread > 0 && bestBid > 0 ? (spread / bestBid) * 100 : 0;

    const isLoading = asks.length === 0 && bids.length === 0;

    return (
        <div className={styles.orderBookWrapper}>
            <div className={styles.columnHeader}>
                <div className={`${styles.col} ${styles.left}`}>Price</div>
                <div className={`${styles.col} ${styles.center}`}>Amount</div>
                <div className={styles.col}>Total</div>
            </div>

            <div className={styles.contentContainer} ref={containerRef}>
                <div className={styles.asksContainer}>
                    {isLoading ? (
                        Array.from({ length: rowCount }).map((_, i) => (
                            <div key={`ask-skeleton-${i}`} className={`${styles.skeleton} ${styles.skeletonRow}`} />
                        ))
                    ) : (
                        asks.map((ask) => (
                            <div
                                key={ask.id}
                                className={styles.row}
                                onClick={() => handlePriceClick(ask.price)}
                                title={`Set limit price: ${formatPrice(ask.price)}`}
                            >
                                <div className={`${styles.bgBar} ${styles.ask}`} style={{ width: `${ask.depthPercent}%` }}></div>
                                <div className={`${styles.cell} ${styles.left} ${styles.askText}`}>{formatPrice(ask.price)}</div>
                                <div className={`${styles.cell} ${styles.center}`}>{formatAmount(ask.amount)}</div>
                                <div className={`${styles.cell} ${styles.defaultText}`}>{formatAmount(ask.total)}</div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.spreadContainer}>
                    {isLoading ? (
                        <div className={`${styles.skeleton} ${styles.skeletonSpread}`} style={{ width: '100%' }} />
                    ) : (
                        <>
                            <div className={styles.lastPrice} style={{ color: priceTrend === 'up' ? '#00E396' : '#FF4560' }}>
                                {formatPrice(selectedMarket?.price || 0)}
                                <span style={{ fontSize: '14px', marginLeft: '6px' }}>{priceTrend === 'up' ? '↑' : '↓'}</span>
                            </div>
                            <div className={styles.spread}>
                                {spreadPercent.toFixed(4)}%
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.bidsContainer}>
                    {isLoading ? (
                        Array.from({ length: rowCount }).map((_, i) => (
                            <div key={`bid-skeleton-${i}`} className={`${styles.skeleton} ${styles.skeletonRow}`} />
                        ))
                    ) : (
                        bids.map((bid) => (
                            <div
                                key={bid.id}
                                className={styles.row}
                                onClick={() => handlePriceClick(bid.price)}
                                title={`Set limit price: ${formatPrice(bid.price)}`}
                            >
                                <div className={`${styles.bgBar} ${styles.bid}`} style={{ width: `${bid.depthPercent}%` }}></div>
                                <div className={`${styles.cell} ${styles.left} ${styles.bidText}`}>{formatPrice(bid.price)}</div>
                                <div className={`${styles.cell} ${styles.center}`}>{formatAmount(bid.amount)}</div>
                                <div className={`${styles.cell} ${styles.defaultText}`}>{formatAmount(bid.total)}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderBook;
