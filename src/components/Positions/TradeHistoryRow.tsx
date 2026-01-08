import React, { useState } from 'react';
import styles from './PositionsPanel.module.css';

export interface TradeHistoryData {
    id: string;
    time: string;
    symbol: string;
    direction: string; // e.g. "Open Long", "Close Short", etc.
    price: number;
    size: number;
    sizeAsset: string; // e.g. "SOL"
    tradeValue: number;
    tradeValueAsset: string; // e.g. "USDC"
    fee: number;
    feeAsset: string; // e.g. "USDC"
    closedPnl: number;
    closedPnlAsset: string; // e.g. "USDC"
}

interface TradeHistoryRowProps {
    trade: TradeHistoryData;
}

const TradeHistoryRow: React.FC<TradeHistoryRowProps> = ({ trade }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Format helpers
    const formatUsd = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Determine direction color
    const isLong = trade.direction.toLowerCase().includes('long');
    const isBuy = trade.direction.toLowerCase().includes('buy');

    // Simple logic for color: Long/Buy = Green, Short/Sell = Red. 
    // "Open Long" -> Green.
    const directionColor = (isLong || isBuy) ? '#00E396' : '#FF4560';

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <>
            {/* Desktop Row */}
            <tr className={`${styles.row} ${styles.desktopRow}`}>
                {/* Time */}
                <td className={styles.td}>
                    <div className={styles.cellContent} style={{ flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                        <span>{trade.time}</span>
                        {/* External Link Icon Placeholder - simplistic square with arrow */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A77590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </div>
                </td>

                {/* Coin */}
                <td className={styles.td}>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{trade.symbol}</span>
                </td>

                {/* Direction */}
                <td className={styles.td}>
                    <span style={{ color: directionColor }}>{trade.direction}</span>
                </td>

                {/* Price */}
                <td className={styles.td}>
                    <span style={{ color: '#FFFFFF' }}>{formatUsd(trade.price)}</span>
                </td>

                {/* Size */}
                <td className={styles.td}>
                    <span style={{ color: '#FFFFFF' }}>
                        {formatUsd(trade.size)} <span style={{ color: '#A77590', fontSize: '11px' }}>{trade.sizeAsset}</span>
                    </span>
                </td>

                {/* Trade Value */}
                <td className={styles.td}>
                    <span style={{ color: '#FFFFFF' }}>
                        {formatUsd(trade.tradeValue)} <span style={{ color: '#A77590', fontSize: '11px' }}>{trade.tradeValueAsset}</span>
                    </span>
                </td>

                {/* Fee */}
                <td className={styles.td}>
                    <span style={{ color: '#FFFFFF' }}>
                        {formatUsd(trade.fee)} <span style={{ color: '#A77590', fontSize: '11px' }}>{trade.feeAsset}</span>
                    </span>
                </td>

                {/* Closed PNL */}
                <td className={styles.td} style={{ textAlign: 'right' }}>
                    <span style={{ color: trade.closedPnl >= 0 ? '#00E396' : '#FF4560' }}>
                        {formatUsd(trade.closedPnl)} <span style={{ color: '#A77590', fontSize: '11px' }}>{trade.closedPnlAsset}</span>
                    </span>
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
                                    <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{trade.symbol}</span>
                                </div>

                                {/* 2. Time */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Time</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ color: '#FFE1F2', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{trade.time.split(' - ')[0]}</span>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A77590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                    </div>
                                </div>

                                {/* 3. Size */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Size</span>
                                    <span style={{ color: '#FFE1F2', fontSize: '13px' }}>{formatUsd(trade.size)} {trade.sizeAsset}</span>
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
                                    <span className={styles.mobileValue}>{trade.time}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Direction</span>
                                    <span className={styles.mobileValue} style={{ color: directionColor }}>{trade.direction}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Price</span>
                                    <span className={styles.mobileValue}>{formatUsd(trade.price)}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Trade Value</span>
                                    <span className={styles.mobileValue}>{formatUsd(trade.tradeValue)} {trade.tradeValueAsset}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Fee</span>
                                    <span className={styles.mobileValue}>{formatUsd(trade.fee)} {trade.feeAsset}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Closed PNL</span>
                                    <span className={styles.mobileValue} style={{ color: trade.closedPnl >= 0 ? '#00E396' : '#FF4560' }}>
                                        {formatUsd(trade.closedPnl)} {trade.closedPnlAsset}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </>
    );
};

export default TradeHistoryRow;
