import React from 'react';
import styles from './PositionsPanel.module.css';
import OrderRow from './OrderRow';
import type { OrderData } from './OrderRow';

interface OrdersTableProps {
    orders: OrderData[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>Time</th>
                        <th className={styles.th}>Type</th>
                        <th className={styles.th}>Coin</th>
                        <th className={styles.th}>Direction</th>
                        <th className={styles.th}>Size</th>
                        <th className={styles.th}>Original Size</th>
                        <th className={styles.th}>Order Value <span style={{ fontSize: '8px' }}>▼</span></th>
                        <th className={styles.th}>Price</th>
                        <th className={styles.th}>Reduce Only</th>
                        <th className={styles.th}>Trigger Conditions</th>
                        <th className={styles.th}>TP/SL</th>
                        <th className={styles.th} style={{ textAlign: 'right', color: '#00E396', cursor: 'pointer' }}>Cancel All</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <OrderRow key={order.id} order={order} />
                    ))}
                </tbody>
            </table>
            <div style={{ padding: '8px 16px', borderTop: '1px solid #3A2530' }}>
                <span style={{ color: '#00E396', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>View All</span>
            </div>
        </div>
    );
};

export default OrdersTable;
