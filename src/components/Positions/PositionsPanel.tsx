import React, { useState } from 'react';
import styles from './PositionsPanel.module.css';
import portfolioStyles from '../Portfolio/Portfolio.module.css'; // Import Navbar styles
import { useUIStore } from '../../store/useUIStore';
import PositionRow from './PositionRow';
import OrdersTable from './OrdersTable';
import TradeHistoryTable from './TradeHistoryTable';
import OrderHistoryTable from './OrderHistoryTable';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import arrowDownIcon from '../../assets/Icons/Arrow/Arrow-down-Bullet.png';

// Sort Icon Component (same as Leaderboard)
const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => {
    const activeColor = '#FFE1F2';
    const inactiveColor = '#5D4050';

    return (
        <svg width="8" height="11" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M5 0L9 4H1L5 0Z"
                fill={active && direction === 'asc' ? activeColor : inactiveColor}
                stroke={active && direction === 'asc' ? activeColor : inactiveColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            <path
                d="M5 14L1 10H9L5 14Z"
                fill={active && direction === 'desc' ? activeColor : inactiveColor}
                stroke={active && direction === 'desc' ? activeColor : inactiveColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
        </svg>
    );
};

// Mock data removed in favor of real store data

type TabType = 'Positions' | 'Orders' | 'Trade History' | 'Order History';

interface PositionsPanelProps {
    isExpanded?: boolean;
    onToggle?: () => void;
}

import { useWallet } from '../../hooks/useWallet';

const PositionsPanel: React.FC<PositionsPanelProps> = ({ isExpanded: propExpanded, onToggle }) => {
    const { openCloseAllModal } = useUIStore();
    const {
        positions,
        openOrders,
        orderHistory,
        tradeHistory,
        refreshAll,
        startGlobalSync,
        isLoading,
        error
    } = usePortfolioStore();
    const { getPrice } = useMarketStore();
    const { walletAddress } = useWallet();
    const [activeTab, setActiveTab] = useState<TabType>('Positions');

    // Local state fallback if not controlled
    const [localExpanded, setLocalExpanded] = useState(true);

    const isExpanded = propExpanded !== undefined ? propExpanded : localExpanded;

    const handleToggle = () => {
        if (onToggle) {
            onToggle();
        } else {
            setLocalExpanded(!localExpanded);
        }
    };

    // Derived counts
    const positionsCount = positions.length;
    const ordersCount = openOrders.length;

    return (
        <div className={`${styles.panelContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}>
            {/* Tabs Header - Navbar Style from Portfolio */}
            <div className={portfolioStyles.tabsContainer}>
                <button
                    className={`${portfolioStyles.tabButton} ${activeTab === 'Positions' ? portfolioStyles.activeTab : ''}`}
                    onClick={() => setActiveTab('Positions')}
                >
                    Positions <span className={styles.countBadge}>{positionsCount}</span>
                </button>
                <button
                    className={`${portfolioStyles.tabButton} ${activeTab === 'Orders' ? portfolioStyles.activeTab : ''}`}
                    onClick={() => setActiveTab('Orders')}
                >
                    Orders <span className={styles.countBadge} style={{ backgroundColor: activeTab === 'Orders' ? '#3A2530' : '#3A2530', color: activeTab === 'Orders' ? '#FFE1F2' : '#A77590' }}>{ordersCount}</span>
                </button>
                <button
                    className={`${portfolioStyles.tabButton} ${activeTab === 'Trade History' ? portfolioStyles.activeTab : ''}`}
                    onClick={() => setActiveTab('Trade History')}
                >
                    Trade History
                </button>
                <button
                    className={`${portfolioStyles.tabButton} ${activeTab === 'Order History' ? portfolioStyles.activeTab : ''}`}
                    onClick={() => setActiveTab('Order History')}
                >
                    Order History
                </button>

                <div className={styles.filler} style={{ flex: 1, borderBottom: '1px solid #3A2530' }}></div>

                <div
                    className={styles.arrowToggle}
                    onClick={() => {
                        if (!walletAddress) return;
                        startGlobalSync(walletAddress);
                        void refreshAll(walletAddress);
                    }}
                    style={{ borderBottom: '1px solid #3A2530', height: '100%' }}
                    title="Refresh Data"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A77590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.refreshIcon}>
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                </div>

                <div
                    className={styles.arrowToggle}
                    onClick={handleToggle}
                    style={{ borderBottom: '1px solid #3A2530', height: '100%' }}
                >
                    <img
                        src={arrowDownIcon}
                        alt="Toggle"
                        style={{
                            width: '16px',
                            height: '16px',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }}
                    />
                </div>
            </div>

            {/* Content Table */}
            {isExpanded && (
                <div className={styles.tableContainer}>
                    {activeTab === 'Positions' && (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={`${styles.th} ${styles.thFirst}`}>Coin</th>
                                        <th className={`${styles.th} ${styles.thRight}`}>Size</th>
                                        <th className={`${styles.th} ${styles.thRight}`} style={{ cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                                Position Value
                                                <SortIcon active={true} direction={'desc'} />
                                            </div>
                                        </th>
                                        <th className={`${styles.th} ${styles.thRight}`}>Entry Price</th>
                                        <th className={`${styles.th} ${styles.thRight}`}>Mark Price</th>
                                        <th className={`${styles.th} ${styles.thRight}`}>PNL (ROE %)</th>
                                        <th className={`${styles.th} ${styles.thRight}`}>Liq. Price</th>
                                        <th className={`${styles.th} ${styles.thRight}`}>Margin</th>
                                        <th className={styles.th}>
                                            <button
                                                className={styles.closeAllHeaderBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openCloseAllModal();
                                                }}
                                                disabled={positions.length === 0}
                                                style={{ opacity: positions.length === 0 ? 0.5 : 1, cursor: positions.length === 0 ? 'not-allowed' : 'pointer' }}
                                            >
                                                Close All
                                            </button>
                                        </th>
                                        <th className={`${styles.th} ${styles.thRight}`}>TP/SL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading && positions.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: 'center', padding: '40px 0', color: '#A77590' }}>
                                                Loading positions...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: 'center', padding: '40px 0' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: '#FF4560', fontSize: '14px' }}>Failed to load positions</span>
                                                    <span style={{ color: '#A77590', fontSize: '12px' }}>{error}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!walletAddress) return;
                                                            startGlobalSync(walletAddress);
                                                            void refreshAll(walletAddress);
                                                        }}
                                                        disabled={!walletAddress}
                                                        style={{ marginTop: '8px', padding: '4px 12px', background: '#3A2530', border: '1px solid #5D4050', borderRadius: '4px', cursor: 'pointer', color: '#FFE1F2' }}
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : positions.length > 0 ? (
                                        positions.map((pos: any) => {
                                            const marketPrice = getPrice(pos.symbol) || pos.mark_price || pos.entry_price || 0;
                                            return (
                                                <PositionRow key={pos.id} position={{
                                                    id: pos.id,
                                                    symbol: pos.symbol,
                                                    pair: pos.symbol,
                                                    exchange: pos.exchange,
                                                    side: pos.side === 'long' ? 'Long' : 'Short',
                                                    size: pos.size,
                                                    sizeUsd: pos.size * marketPrice,
                                                    leverage: `${pos.leverage}x`,
                                                    entryPrice: pos.entry_price,
                                                    markPrice: marketPrice,
                                                    liquidationPrice: pos.liquidation_price || null,
                                                    unrealizedPnl: pos.unrealized_pnl,
                                                    unrealizedPnlPercent: pos.unrealized_pnl_percent || 0,
                                                    margin: pos.margin_used || 0,
                                                    funding: 0,
                                                    tp: pos.tp,
                                                    sl: pos.sl
                                                }} />
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: 'center', padding: '40px 0' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5D4050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                                        <line x1="8" y1="21" x2="16" y2="21"></line>
                                                        <line x1="12" y1="17" x2="12" y2="21"></line>
                                                    </svg>
                                                    <span style={{ color: '#A77590', fontSize: '14px' }}>No open positions</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'Orders' && (
                        <OrdersTable orders={openOrders.map((o: any) => ({
                            id: o.id,
                            time: o.created_at ? new Date(o.created_at).toLocaleString() : 'Just now',
                            type: (o.order_type.charAt(0).toUpperCase() + o.order_type.slice(1).replace('_', ' ')) as any,
                            symbol: o.symbol,
                            direction: o.side.toLowerCase() === 'buy' ? 'Long' : 'Short',
                            size: o.size,
                            originalSize: o.size,
                            orderValue: o.notional_usd,
                            price: o.price || 0,
                            reduceOnly: o.reduce_only || false,
                            triggerConditions: o.stop_price ? `>= ${o.stop_price}` : 'N/A',
                            tp: '--',
                            sl: '--'
                        }))} />
                    )}

                    {activeTab === 'Trade History' && (
                        <TradeHistoryTable trades={tradeHistory.map(t => ({
                            ...t,
                            time: t.time ? new Date(t.time).toLocaleString() : 'Just now'
                        }))} />
                    )}

                    {activeTab === 'Order History' && (
                        <OrderHistoryTable orders={orderHistory.map((o: any) => ({
                            id: o.id,
                            time: o.created_at ? new Date(o.created_at).toLocaleString() : 'Just now',
                            type: (o.order_type.charAt(0).toUpperCase() + o.order_type.slice(1).replace('_', ' ')) as any,
                            symbol: o.symbol,
                            direction: o.side.toLowerCase() === 'buy' ? 'Long' : 'Short',
                            size: o.size,
                            originalSize: o.size,
                            orderValue: o.notional_usd,
                            price: o.price || 0,
                            reduceOnly: o.reduce_only || false,
                            triggerConditions: o.stop_price ? `>= ${o.stop_price}` : 'N/A',
                            tp: '--', // Backend TODO
                            sl: '--', // Backend TODO
                            status: (o.status ? (o.status.charAt(0).toUpperCase() + o.status.slice(1)) : 'Unknown') as any
                        }))} />
                    )}
                </div>
            )
            }
        </div >
    );
};

export default PositionsPanel;
