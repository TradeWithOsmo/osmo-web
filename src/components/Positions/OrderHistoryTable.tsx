import React from 'react';
import styles from './PositionsPanel.module.css';
import OrderHistoryRow from './OrderHistoryRow';
import type { OrderHistoryData } from './OrderHistoryRow';

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
    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>Time</th>
                        <th className={styles.th}>Type</th>
                        <th className={styles.th}>Coin</th>
                        <th className={styles.th}>Direction</th>
                        <th className={styles.th}>Size</th>
                        <th className={styles.th}>Original Size</th>
                        <th className={styles.th} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Order Value
                                <SortIcon active={true} direction={'desc'} />
                            </div>
                        </th>
                        <th className={styles.th}>Price</th>
                        <th className={styles.th}>Reduce Only</th>
                        <th className={styles.th}>Trigger Conditions</th>
                        <th className={styles.th}>TP/SL</th>
                        <th className={styles.th} style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <OrderHistoryRow key={order.id} order={order} />
                    ))}
                </tbody>
            </table>
            {footerContent}
        </div>
    );
};

export default OrderHistoryTable;
