import React, { useState } from 'react';
import styles from './PositionsPanel.module.css';
import portfolioStyles from '../Portfolio/Portfolio.module.css'; // Import Navbar styles
import PositionRow from './PositionRow';
import type { PositionData } from './PositionRow';
import type { OrderData } from './OrderRow';
import OrdersTable from './OrdersTable';
import TradeHistoryTable from './TradeHistoryTable';
import type { TradeHistoryData } from './TradeHistoryRow';
import OrderHistoryTable from './OrderHistoryTable';
import type { OrderHistoryData } from './OrderHistoryRow';
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

// Mock Data
const MOCK_POSITIONS: PositionData[] = [
    {
        id: '1',
        symbol: 'BTC',
        pair: 'BTC-USD',
        side: 'Long',
        size: 0.0055,
        sizeUsd: 484.24,
        leverage: '10x',
        entryPrice: 90648,
        markPrice: 87724,
        liquidationPrice: null,
        unrealizedPnl: -16.14,
        unrealizedPnlPercent: -32.3,
        margin: 48.42,
        funding: 16.64,
        tp: '--',
        sl: '--'
    },
    {
        id: '2',
        symbol: 'LINK',
        pair: 'LINK-USD',
        side: 'Short',
        size: 15.32,
        sizeUsd: 224.50,
        leverage: '5x',
        entryPrice: 14.25,
        markPrice: 13.90,
        liquidationPrice: 18.50,
        unrealizedPnl: 5.35,
        unrealizedPnlPercent: 2.38,
        margin: 44.90,
        funding: 0.12,
        tp: 12.50,
        sl: 15.00
    }
];

const MOCK_ORDERS: OrderData[] = [
    {
        id: '1',
        time: '30/12/2025 - 16.04.22',
        type: 'Limit',
        symbol: 'SOL',
        direction: 'Long',
        size: 9.85,
        originalSize: 9.85,
        orderValue: 1222.78,
        price: 124.14,
        reduceOnly: false,
        triggerConditions: 'N/A',
        tp: '--',
        sl: '--'
    }
];

const MOCK_TRADE_HISTORY: TradeHistoryData[] = [
    {
        id: '1',
        time: '30/12/2025 - 16.04.04',
        symbol: 'SOL',
        direction: 'Open Long',
        price: 124.60,
        size: 5.19,
        sizeAsset: 'SOL',
        tradeValue: 646.66,
        tradeValueAsset: 'USDC',
        fee: 0.29,
        feeAsset: 'USDC',
        closedPnl: -0.29,
        closedPnlAsset: 'USDC'
    }
];

const MOCK_ORDER_HISTORY: OrderHistoryData[] = [
    {
        id: '1',
        time: '29/12/2025 - 14.20.10',
        type: 'Market',
        symbol: 'ETH',
        direction: 'Short',
        size: 2.5,
        originalSize: 2.5,
        orderValue: 6200.50,
        price: 2480.20,
        reduceOnly: true,
        triggerConditions: 'N/A',
        tp: '--',
        sl: '--',
        status: 'Filled'
    },
    {
        id: '2',
        time: '29/12/2025 - 10.15.00',
        type: 'Limit',
        symbol: 'BTC',
        direction: 'Long',
        size: 0.1,
        originalSize: 0.1,
        orderValue: 4500.00,
        price: 45000.00,
        reduceOnly: false,
        triggerConditions: 'N/A',
        tp: '--',
        sl: '--',
        status: 'Cancelled'
    }
];

type TabType = 'Positions' | 'Orders' | 'Trade History' | 'Order History';

const PositionsPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('Positions');
    const [isExpanded, setIsExpanded] = useState(false); // Minimized by default

    // Derived counts
    const positionsCount = MOCK_POSITIONS.length;
    const ordersCount = MOCK_ORDERS.length;

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

                <div className={styles.filler} style={{ flex: 1, borderBottom: '1px solid #3A2530' }} />

                <div
                    className={styles.arrowToggle}
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ borderBottom: '1px solid #3A2530', height: 'auto', display: 'flex', alignItems: 'center' }}
                >
                    <img
                        src={arrowDownIcon}
                        alt="Toggle"
                        style={{
                            width: '16px',
                            height: '16px',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', // If Expanded, arrow points UP (180deg from down). If Collapsed, arrow points DOWN (0deg).
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
                                        <th className={styles.th}>Coin</th>
                                        <th className={styles.th}>Size</th>
                                        <th className={styles.th} style={{ cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Position Value
                                                <SortIcon active={true} direction={'desc'} />
                                            </div>
                                        </th>
                                        <th className={styles.th}>Entry Price</th>
                                        <th className={styles.th}>Mark Price</th>
                                        <th className={styles.th}>PNL (ROE %)</th>
                                        <th className={styles.th}>Liq. Price</th>
                                        <th className={styles.th}>Margin</th>
                                        <th className={styles.th}>Funding</th>
                                        <th className={styles.th}>Close All</th>
                                        <th className={styles.th} style={{ textAlign: 'right' }}>TP/SL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_POSITIONS.map(pos => (
                                        <PositionRow key={pos.id} position={pos} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'Orders' && (
                        <OrdersTable orders={MOCK_ORDERS} />
                    )}

                    {activeTab === 'Trade History' && (
                        <TradeHistoryTable trades={MOCK_TRADE_HISTORY} />
                    )}

                    {activeTab === 'Order History' && (
                        <OrderHistoryTable orders={MOCK_ORDER_HISTORY} />
                    )}
                </div>
            )
            }
        </div >
    );
};

export default PositionsPanel;
