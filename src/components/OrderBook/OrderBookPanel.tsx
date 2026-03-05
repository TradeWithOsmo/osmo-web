import React, { useState, useEffect } from 'react';
import styles from './OrderBookPanel.module.css';
import { useMarketStore } from '../../store/useMarketStore';
import OrderBook from './OrderBook';
import RecentTrades from './RecentTrades';

interface OrderBookPanelProps {
    forcedTab?: 'Order Book' | 'Trades';
}

const getDefaultGrouping = (price?: number): number => {
    const p = Number(price || 0);
    if (!Number.isFinite(p) || p <= 0) return 0.001;
    if (p >= 10000) return 1;
    if (p >= 1000) return 0.1;
    if (p >= 100) return 0.01;
    if (p >= 1) return 0.001;
    if (p >= 0.1) return 0.0001;
    return 0.00001;
};

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

interface Availability { orderbook: boolean; trades: boolean }

const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ forcedTab }) => {
    const { selectedMarket } = useMarketStore();
    const [internalTab, setInternalTab] = useState<'Order Book' | 'Trades'>('Order Book');
    const [grouping, setGrouping] = useState<number>(() => getDefaultGrouping(selectedMarket?.price));
    const [avail, setAvail] = useState<Availability>({ orderbook: true, trades: true });

    React.useEffect(() => {
        setGrouping(getDefaultGrouping(selectedMarket?.price));
    }, [selectedMarket?.symbol, selectedMarket?.source, selectedMarket?.price]);

    // Optimistic: assume available immediately, backend confirms (or marks unavailable)
    useEffect(() => {
        if (!selectedMarket) return;
        setAvail({ orderbook: true, trades: true });
        const exchange = (selectedMarket as any).source || 'hyperliquid';
        fetch(`${API_URL}/api/tradebook/availability?exchange=${encodeURIComponent(exchange)}`)
            .then(r => r.json())
            .then((data: Availability) => {
                setAvail(data);
                if (!data.orderbook && data.trades) setInternalTab('Trades');
                if (data.orderbook && !data.trades) setInternalTab('Order Book');
            })
            .catch(() => {}); // keep optimistic on error
    }, [selectedMarket?.symbol, selectedMarket?.source]);

    const activeTab = forcedTab || internalTab;
    const showFooter = avail.orderbook || avail.trades;

    const handleOrderBookUnavailable = () =>
        setAvail(prev => ({ ...prev, orderbook: false }));
    const handleTradesUnavailable = () =>
        setAvail(prev => ({ ...prev, trades: false }));

    return (
        <div className={styles.container}>
            {/* Tab Switcher */}
            {!forcedTab && (
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'Order Book' ? styles.active : ''}`}
                        onClick={() => setInternalTab('Order Book')}
                        disabled={!avail.orderbook}
                    >
                        Order Book
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'Trades' ? styles.active : ''}`}
                        onClick={() => setInternalTab('Trades')}
                        disabled={!avail.trades}
                    >
                        Trades
                    </button>
                </div>
            )}

            <div className={styles.mainContentArea}>
                {activeTab === 'Order Book'
                    ? avail.orderbook
                        ? <OrderBook grouping={grouping} onUnavailable={handleOrderBookUnavailable} />
                        : <div className={styles.notAvailable}>
                            <div className={styles.notAvailableText}>
                                Order Book is not available for {selectedMarket?.source}.
                            </div>
                          </div>
                    : avail.trades
                        ? <RecentTrades grouping={grouping} onUnavailable={handleTradesUnavailable} />
                        : <div className={styles.notAvailable}>
                            <div className={styles.notAvailableText}>
                                Trade history is not available for {selectedMarket?.source}.
                            </div>
                          </div>
                }
            </div>

            {showFooter && (
                <div className={styles.footer}>
                    <button className={styles.groupBtn} onClick={() => setGrouping(prev => Math.max(0.00001, prev / 10))}>-</button>
                    <button className={styles.groupBtn} onClick={() => setGrouping(prev => Math.min(10, prev * 10))}>+</button>
                    <div className={styles.groupVal}>{grouping < 1 ? grouping.toString() : Math.round(grouping).toString()}</div>
                    <div className={styles.currencyCell}>
                        <div className={styles.currencyIcon}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderBookPanel;
