import React, { useState } from 'react';
import styles from './PositionsPanel.module.css';

export interface OrderData {
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
}

interface OrderRowProps {
    order: OrderData;
}

const OrderRow: React.FC<OrderRowProps> = ({ order }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = order.direction === 'Long';

    // Format helper
    const formatUsd = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatCrypto = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
                    <span style={{ color: '#FFFFFF' }}>{formatCrypto(order.size)} <span style={{ color: '#A77590', fontSize: '11px' }}>{order.symbol}</span></span>
                </td>

                {/* Original Size */}
                <td className={styles.td}>
                    <span style={{ color: '#FFFFFF' }}>{formatCrypto(order.originalSize)} <span style={{ color: '#A77590', fontSize: '11px' }}>{order.symbol}</span></span>
                </td>

                {/* Order Value */}
                <td className={styles.td}>
                    <span style={{ color: '#FFFFFF' }}>{formatUsd(order.orderValue)} <span style={{ color: '#A77590', fontSize: '11px' }}>USDC</span></span>
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

                {/* Cancel (Action) */}
                <td className={styles.td} style={{ textAlign: 'right' }}>
                    <button className={styles.actionButton} style={{ color: '#2E93fF' }}>Cancel</button>
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

                                {/* 2. Type */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Type</span>
                                    <span style={{ color: '#FFE1F2', fontSize: '13px' }}>{order.type}</span>
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
                                    <span className={styles.mobileLabel}>Time</span>
                                    <span className={styles.mobileValue}>{order.time}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Direction</span>
                                    <span className={`${styles.mobileValue} ${isLong ? styles.positive : styles.negative}`}>{order.direction}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Price</span>
                                    <span className={styles.mobileValue}>{formatUsd(order.price)}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Original Size</span>
                                    <span className={styles.mobileValue}>{formatCrypto(order.originalSize)}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Order Value</span>
                                    <span className={styles.mobileValue}>{formatUsd(order.orderValue)} USDC</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Trigger Conditions</span>
                                    <span className={styles.mobileValue}>{order.triggerConditions}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Reduce Only</span>
                                    <span className={styles.mobileValue}>{order.reduceOnly ? 'Yes' : 'No'}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>TP/SL</span>
                                    <span className={styles.mobileValue}>-- / --</span>
                                </div>
                                <div className={styles.mobileDetailRow} style={{ borderBottom: 'none', paddingTop: '16px' }}>
                                    <button className={styles.actionButton} style={{ fontSize: '13px', width: '100%', textAlign: 'left', color: '#2E93fF' }}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </>
    );
};

export default OrderRow;
