import React, { useState, useMemo } from 'react';
import styles from './PositionsPanel.module.css';
import OrderRow from './OrderRow';
import type { OrderData } from './OrderRow';


interface OrdersTableProps {
    orders: OrderData[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
    const [sortBy, setSortBy] = useState<'default' | 'orderValue'>('default');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = () => {
        if (sortBy === 'orderValue') {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy('orderValue');
            setSortDirection('desc');
        }
    };

    const sortedOrders = useMemo(() => {
        if (sortBy === 'default') return orders;

        return [...orders].sort((a, b) => {
            return sortDirection === 'asc'
                ? a.orderValue - b.orderValue
                : b.orderValue - a.orderValue;
        });
    }, [orders, sortBy, sortDirection]);

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th className={styles.th}>Time</th>
                    <th className={styles.th}>Type</th>
                    <th className={styles.th}>Coin</th>
                    <th className={styles.th}>Direction</th>
                    <th className={styles.th}>Size</th>
                    <th className={styles.th}>Original Size</th>
                    <th className={styles.th} style={{ cursor: 'pointer' }} onClick={handleSort}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Order Value
                            <svg
                                width="10"
                                height="6"
                                viewBox="0 0 10 6"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                    transition: 'transform 0.2s',
                                    transform: sortBy === 'orderValue' && sortDirection === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}
                            >
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </th>
                    <th className={styles.th}>Price</th>
                    <th className={styles.th}>Reduce Only</th>
                    <th className={styles.th}>Trigger Conditions</th>
                    <th className={styles.th}>TP/SL</th>
                    <th className={styles.th} style={{ textAlign: 'right', color: '#00E396', cursor: 'pointer' }}>Cancel All</th>
                </tr>
            </thead>
            <tbody>
                {sortedOrders.map(order => (
                    <OrderRow key={order.id} order={order} />
                ))}
            </tbody>
        </table>
    );
};

export default OrdersTable;
