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

import { useUIStore } from '../../store/useUIStore';
import { useMarketStore } from '../../store/useMarketStore';

interface OrderRowProps {
    order: OrderData;
}

const OrderRow: React.FC<OrderRowProps> = ({ order }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { openCancelOrderModal } = useUIStore();
    const { getPrice } = useMarketStore();
    const isLong = order.direction === 'Long';

    // Current Price
    const markPrice = getPrice(order.symbol) || 0;

    // Format helper
    const formatUsd = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    const formatCrypto = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleCancelClick = () => {
        openCancelOrderModal(order);
    };

    return (
        <>
            {/* Desktop Row */}
            <tr className={`${styles.row} ${styles.desktopRow}`}>
                <td className={styles.td}><span>{order.time}</span></td>
                <td className={styles.td}><span style={{ fontWeight: 500 }}>{order.type}</span></td>
                <td className={styles.td}><span className={isLong ? styles.positive : styles.negative}>{order.direction}</span></td>
                <td className={styles.td}><span style={{ fontWeight: 700, color: '#FFFFFF' }}>{order.symbol}</span></td>
                <td className={styles.td}><span style={{ color: '#FFFFFF' }}>{formatCrypto(order.size)} <span style={{ color: '#A77590', fontSize: '11px' }}>{order.symbol}</span></span></td>
                <td className={styles.td}><span>${formatUsd(order.price)}</span></td>
                <td className={styles.td}><span style={{ color: '#FFE1F2' }}>${markPrice > 0 ? formatUsd(markPrice) : '--'}</span></td>
                <td className={styles.td}><span>{order.reduceOnly ? 'Yes' : 'No'}</span></td>
                <td className={styles.td}><span>{order.triggerConditions || '--'}</span></td>
                <td className={styles.td}><span>--</span></td>

                {/* Cancel (Action) */}
                <td className={styles.td} style={{ textAlign: 'right' }}>
                    <button
                        className={styles.actionButton}
                        style={{ color: '#FF4560' }}
                        onClick={handleCancelClick}
                    >
                        Cancel
                    </button>
                </td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${styles.row} ${styles.mobileRow}`}>
                <td className={styles.td} colSpan={100}>
                    <div className={styles.mobileCard}>
                        <div className={styles.mobileHeader} onClick={toggleExpand}>
                            <div className={styles.mobileHeaderContent}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Coin</span>
                                    <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{order.symbol}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Side</span>
                                    <span className={isLong ? styles.positive : styles.negative} style={{ fontSize: '13px' }}>{order.direction}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Entry Price</span>
                                    <span style={{ color: '#FFE1F2', fontSize: '13px' }}>${formatUsd(order.price)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className={styles.mobileDetails}>
                                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Time</span><span className={styles.mobileValue}>{order.time}</span></div>
                                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Type</span><span className={styles.mobileValue}>{order.type}</span></div>
                                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Size</span><span className={styles.mobileValue}>{formatCrypto(order.size)} {order.symbol}</span></div>
                                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Mark Price</span><span className={styles.mobileValue}>${markPrice > 0 ? formatUsd(markPrice) : '--'}</span></div>
                                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Trigger</span><span className={styles.mobileValue}>{order.triggerConditions || '--'}</span></div>
                                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Reduce Only</span><span className={styles.mobileValue}>{order.reduceOnly ? 'Yes' : 'No'}</span></div>

                                <div className={styles.mobileDetailRow} style={{ borderBottom: 'none', paddingTop: '16px' }}>
                                    <button
                                        className={styles.actionButton}
                                        style={{ fontSize: '13px', width: '100%', textAlign: 'center', color: '#FF4560', background: 'rgba(255, 69, 96, 0.1)', padding: '8px', borderRadius: '4px' }}
                                        onClick={handleCancelClick}
                                    >
                                        Cancel Order
                                    </button>
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
