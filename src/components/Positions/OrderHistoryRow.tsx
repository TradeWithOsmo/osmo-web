import React, { useState } from 'react';
import styles from './PositionsPanel.module.css';

export interface OrderHistoryData {
    id: string;
    time: string;
    type: 'Limit' | 'Market' | 'Stop Limit' | 'Stop Market';
    symbol: string;
    direction: 'Long' | 'Short';
    size: number;
    originalSize: number;
    orderValue: number;
    price: number;
    reduceOnly: boolean;
    triggerConditions: string;
    tp?: number | string;
    sl?: number | string;
    status: 'Filled' | 'Cancelled' | 'Partially Filled';
}

interface OrderHistoryRowProps {
    order: OrderHistoryData;
}

const OrderHistoryRow: React.FC<OrderHistoryRowProps> = ({ order }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const isLong = order.direction === 'Long';
    const isFilled = order.status === 'Filled';
    const isCancelled = order.status === 'Cancelled';

    // Format helper
    const formatUsd = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatCrypto = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let statusColor = '#FFFFFF';
    if (isFilled) statusColor = '#00E396';
    if (isCancelled) statusColor = '#FF4560';

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <>
            {/* Desktop Row */}
            <tr className={`${styles.row} ${styles.desktopRow}`}>
                {/* Time */}
                <td className={styles.td}>
                    <span>{order.time}</span>
                </td>

                {/* Type */}
                <td className={styles.td}>
                    <span style={{ fontWeight: 500 }}>{order.type}</span>
                </td>

                {/* Coin */}
                <td className={styles.td}>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{order.symbol}</span>
                </td>

                {/* Direction */}
                <td className={styles.td}>
                    <span className={isLong ? styles.positive : styles.negative}>{order.direction}</span>
                </td>

                {/* Size */}
                <td className={styles.td}>
                    <span>{formatCrypto(order.size)}</span>
                </td>

                {/* Original Size */}
                <td className={styles.td}>
                    <span>{formatCrypto(order.originalSize)}</span>
                </td>

                {/* Order Value */}
                <td className={styles.td}>
                    <span style={{ fontWeight: 500 }}>{formatUsd(order.orderValue)} USDC</span>
                </td>

                {/* Price */}
                <td className={styles.td}>
                    <span>{formatUsd(order.price)}</span>
                </td>

                {/* Reduce Only */}
                <td className={styles.td}>
                    <span>{order.reduceOnly ? 'Yes' : 'No'}</span>
                </td>

                {/* Trigger Conditions */}
                <td className={styles.td}>
                    <span>{order.triggerConditions}</span>
                </td>

                {/* TP/SL */}
                <td className={styles.td}>
                    <span>--</span>
                </td>

                {/* Status */}
                <td className={styles.td} style={{ textAlign: 'right' }}>
                    <span style={{ color: statusColor }}>{order.status}</span>
                </td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${styles.row} ${styles.mobileRow}`}>
                <td className={styles.td} colSpan={100}>
                    <div className={styles.mobileCard}>
                        <div className={styles.mobileHeader} onClick={toggleExpand}>
                            <div className={styles.mobileHeaderContent}>
                                {/* 1. Coin */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Coin</span>
                                    <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{order.symbol}</span>
                                </div>

                                {/* 2. Time */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Time</span>
                                    <span style={{ color: '#FFE1F2', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{order.time.split(' - ')[0]}</span>
                                </div>

                                {/* 3. Size */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Size</span>
                                    <span style={{ color: '#FFE1F2', fontSize: '13px' }}>{formatCrypto(order.size)}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#A77590' }}>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className={styles.mobileDetails}>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Full Time</span>
                                    <span className={styles.mobileValue}>{order.time}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Type</span>
                                    <span className={styles.mobileValue}>{order.type}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Direction</span>
                                    <span className={styles.mobileValue} style={{ color: isLong ? '#00E396' : '#FF4560' }}>{order.direction}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Price</span>
                                    <span className={styles.mobileValue}>{formatUsd(order.price)}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Order Value</span>
                                    <span className={styles.mobileValue}>{formatUsd(order.orderValue)} USDC</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Original Size</span>
                                    <span className={styles.mobileValue}>{formatCrypto(order.originalSize)}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Reduce Only</span>
                                    <span className={styles.mobileValue}>{order.reduceOnly ? 'Yes' : 'No'}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Trigger Conditions</span>
                                    <span className={styles.mobileValue}>{order.triggerConditions}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>TP/SL</span>
                                    <span className={styles.mobileValue}>-- / --</span>
                                </div>
                                <div className={styles.mobileDetailRow} style={{ borderBottom: 'none' }}>
                                    <span className={styles.mobileLabel}>Status</span>
                                    <span className={styles.mobileValue} style={{ color: statusColor }}>{order.status}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </>
    );
};

export default OrderHistoryRow;
