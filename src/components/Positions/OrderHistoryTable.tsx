import React from 'react';
import styles from './PositionsPanel.module.css';
import OrderHistoryRow from './OrderHistoryRow';
import type { OrderHistoryData } from './OrderHistoryRow';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks/useWallet';

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

interface OrderHistoryTableProps {
    orders: OrderHistoryData[];
    footerContent?: React.ReactNode;
}

const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({ orders, footerContent }) => {
    const { isLoading, error, refreshAll } = usePortfolioStore();
    const { walletAddress } = useWallet();

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={`${styles.th} ${styles.thFirst}`}>Time</th>
                        <th className={styles.th}>Type</th>
                        <th className={styles.th}>Coin</th>
                        <th className={styles.th}>Direction</th>
                        <th className={`${styles.th} ${styles.thRight}`}>Size</th>
                        <th className={`${styles.th} ${styles.thRight}`}>Original Size</th>
                        <th className={`${styles.th} ${styles.thRight}`} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                Order Value
                                <SortIcon active={true} direction={'desc'} />
                            </div>
                        </th>
                        <th className={`${styles.th} ${styles.thRight}`}>Price</th>
                        <th className={styles.th}>Reduce Only</th>
                        <th className={styles.th}>Trigger Conditions</th>
                        <th className={styles.th}>TP/SL</th>
                        <th className={`${styles.th} ${styles.thRight}`}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && orders.length === 0 ? (
                        <tr>
                            <td colSpan={12} style={{ textAlign: 'center', padding: '40px 0', color: '#A77590' }}>
                                Loading order history...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={12} style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#FF4560', fontSize: '14px' }}>⚠ Failed to load history</span>
                                    <span style={{ color: '#A77590', fontSize: '12px' }}>{error}</span>
                                    <button
                                        onClick={() => refreshAll(walletAddress!)}
                                        style={{ marginTop: '8px', padding: '4px 12px', background: '#3A2530', border: '1px solid #5D4050', borderRadius: '4px', cursor: 'pointer', color: '#FFE1F2' }}
                                    >
                                        Retry
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ) : orders.length > 0 ? (
                        orders.map(order => (
                            <OrderHistoryRow key={order.id} order={order} />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={12} style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5D4050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span style={{ color: '#A77590', fontSize: '14px' }}>No order history</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {footerContent}
        </div>
    );
};

export default OrderHistoryTable;
