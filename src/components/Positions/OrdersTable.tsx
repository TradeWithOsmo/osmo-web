import React from 'react';
import styles from './PositionsPanel.module.css';
import OrderRow from './OrderRow';
import type { OrderData } from './OrderRow';
import { useWallet } from '../../hooks/useWallet';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useUIStore } from '../../store/useUIStore';

interface OrdersTableProps {
    orders: OrderData[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
    const { walletAddress } = useWallet();
    const { isLoading, error, refreshAll } = usePortfolioStore();
    const { openCancelAllOrdersModal } = useUIStore();

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th className={styles.th}>Time</th>
                    <th className={styles.th}>Type</th>
                    <th className={styles.th}>Side</th>
                    <th className={styles.th}>Coin</th>
                    <th className={styles.th}>Size</th>
                    <th className={styles.th}>Entry Price</th>
                    <th className={styles.th}>Mark Price</th>
                    <th className={styles.th}>Reduce Only</th>
                    <th className={styles.th}>Trigger</th>
                    <th className={styles.th}>TP/SL</th>
                    <th className={styles.th} style={{ textAlign: 'right', color: '#00E396', cursor: orders.length > 0 ? 'pointer' : 'not-allowed', opacity: orders.length > 0 ? 1 : 0.5 }} onClick={() => orders.length > 0 && openCancelAllOrdersModal()}>Cancel All</th>
                </tr>
            </thead>
            <tbody>
                {isLoading && orders.length === 0 ? (
                    <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '40px 0', color: '#A77590' }}>
                            Loading orders...
                        </td>
                    </tr>
                ) : error ? (
                    <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#FF4560', fontSize: '14px' }}>⚠ Failed to load orders</span>
                                <span style={{ color: '#A77590', fontSize: '12px' }}>{error}</span>
                                <button
                                    onClick={() => walletAddress && refreshAll(walletAddress)}
                                    style={{ marginTop: '8px', padding: '4px 12px', background: '#3A2530', border: '1px solid #5D4050', borderRadius: '4px', cursor: 'pointer', color: '#FFE1F2' }}
                                >
                                    Retry
                                </button>
                            </div>
                        </td>
                    </tr>
                ) : orders.length > 0 ? (
                    orders.map(order => (
                        <OrderRow key={order.id} order={order} />
                    ))
                ) : (
                    <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5D4050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span style={{ color: '#A77590', fontSize: '14px' }}>No open orders</span>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default OrdersTable;
