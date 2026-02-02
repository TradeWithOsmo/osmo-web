import React, { useState, useMemo } from 'react';
import styles from './PositionsPanel.module.css';
import OrderRow from './OrderRow';
import type { OrderData } from './OrderRow';


interface OrdersTableProps {
    orders: OrderData[];
}

import { orderService } from '../../api/orderService';
import { useWallet } from '../../hooks/useWallet';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import toast from 'react-hot-toast';

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
    const [sortBy, setSortBy] = useState<'default' | 'orderValue'>('default');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const { walletAddress } = useWallet();
    const { refreshAll, isLoading, error } = usePortfolioStore();

    const handleCancelOrder = async (orderId: string) => {
        if (!walletAddress) return;
        try {
            await orderService.cancelOrder(orderId, walletAddress);
            toast.success('Order cancelled');
            await refreshAll(walletAddress);
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel order');
        }
    };

    const handleCancelAll = async () => {
        if (!walletAddress || orders.length === 0) return;
        if (!confirm('Are you sure you want to cancel all open orders?')) return;

        const toastId = toast.loading('Cancelling all orders...');
        try {
            // Parallel cancellation
            await Promise.all(orders.map(o => orderService.cancelOrder(o.id, walletAddress)));
            toast.success('All orders cancelled', { id: toastId });
            await refreshAll(walletAddress);
        } catch (error: any) {
            toast.error('Failed to cancel some orders', { id: toastId });
        }
    };

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
                    <th className={styles.th} style={{ textAlign: 'right', color: '#00E396', cursor: orders.length > 0 ? 'pointer' : 'not-allowed', opacity: orders.length > 0 ? 1 : 0.5 }} onClick={handleCancelAll}>Cancel All</th>
                </tr>
            </thead>
            <tbody>
                {isLoading && sortedOrders.length === 0 ? (
                    <tr>
                        <td colSpan={12} style={{ textAlign: 'center', padding: '40px 0', color: '#A77590' }}>
                            Loading orders...
                        </td>
                    </tr>
                ) : error ? (
                    <tr>
                        <td colSpan={12} style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#FF4560', fontSize: '14px' }}>⚠ Failed to load orders</span>
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
                ) : sortedOrders.length > 0 ? (
                    sortedOrders.map(order => (
                        <OrderRow key={order.id} order={order} onCancel={handleCancelOrder} />
                    ))
                ) : (
                    <tr>
                        <td colSpan={12} style={{ textAlign: 'center', padding: '40px 0' }}>
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
