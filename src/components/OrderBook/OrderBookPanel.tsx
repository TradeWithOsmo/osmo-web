import React, { useState } from 'react';
import styles from './OrderBookPanel.module.css';
import { useMarketStore } from '../../store/useMarketStore';
import OrderBook from './OrderBook';
import RecentTrades from './RecentTrades';

interface OrderBookPanelProps {
    forcedTab?: 'Order Book' | 'Trades';
}

const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ forcedTab }) => {
    const { selectedMarket } = useMarketStore();
    const [internalTab, setInternalTab] = useState<'Order Book' | 'Trades'>('Order Book');
    const [grouping, setGrouping] = useState(0.01);

    const activeTab = forcedTab || internalTab;
    const isOstium = selectedMarket?.source === 'ostium';

    return (
        <div className={styles.container}>
            {/* Tab Switcher - Only shown on Desktop or if forcedTab not provided */}
            {!forcedTab && (
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'Order Book' ? styles.active : ''}`}
                        onClick={() => setInternalTab('Order Book')}
                    >
                        Order Book
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'Trades' ? styles.active : ''}`}
                        onClick={() => setInternalTab('Trades')}
                    >
                        Trades
                    </button>
                </div>
            )}

            {isOstium ? (
                <div className={styles.notAvailable}>
                    <div className={styles.notAvailableText}>
                        Order Book and Trade history are not available for {selectedMarket?.category} assets from Ostium.
                    </div>
                </div>
            ) : (
                <div className={styles.mainContentArea}>
                    {activeTab === 'Order Book' ? (
                        <OrderBook grouping={grouping} />
                    ) : (
                        <RecentTrades grouping={grouping} />
                    )}
                </div>
            )}

            {!isOstium && (
                <div className={styles.footer}>
                    <button className={styles.groupBtn} onClick={() => setGrouping(prev => Math.max(0.001, prev / 10))}>−</button>
                    <button className={styles.groupBtn} onClick={() => setGrouping(prev => Math.min(1, prev * 10))}>+</button>
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
