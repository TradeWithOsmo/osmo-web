import React, { useState } from 'react';
import styles from './PositionsPanel.module.css';

export interface PositionData {
    id: string;
    symbol: string;
    pair: string;
    side: 'Long' | 'Short';
    size: number; // e.g., in BTC
    sizeUsd: number; // e.g., in USD
    leverage: string; // e.g., "10x"
    entryPrice: number;
    markPrice: number;
    liquidationPrice: number | null;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    margin: number;
    funding: number;
    tp?: number | string;
    sl?: number | string;
}

interface PositionRowProps {
    position: PositionData;
}

const PositionRow: React.FC<PositionRowProps> = ({ position }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = position.side === 'Long';

    // Format helper
    const formatUsd = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatCrypto = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    const symbolCode = position.symbol.split('-')[0].toLowerCase();
    const iconUrl = `https://assets.coincap.io/assets/icons/${symbolCode}@2x.png`;
    const fallbackUrl = `https://ui-avatars.com/api/?name=${position.symbol}&background=627EEA&color=fff&rounded=true&bold=true&format=svg`;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const pnlColor = position.unrealizedPnl >= 0 ? styles.positive : styles.negative;
    const pnlText = `${position.unrealizedPnl >= 0 ? '' : '-'}$${Math.abs(position.unrealizedPnl).toFixed(2)}`;
    const roiText = `(${position.unrealizedPnlPercent.toFixed(2)}%)`;

    return (
        <>
            {/* Desktop Row */}
            <tr className={`${styles.row} ${styles.desktopRow}`}>
                {/* Coin */}
                <td className={styles.td}>
                    <div className={styles.cellContent} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                            <img
                                src={iconUrl}
                                alt={position.symbol}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = fallbackUrl;
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{position.symbol}</span>
                            <span className={isLong ? styles.positive : styles.negative} style={{ fontSize: '11px', backgroundColor: isLong ? 'rgba(0, 227, 150, 0.1)' : 'rgba(255, 69, 96, 0.1)', padding: '2px 4px', borderRadius: '2px' }}>
                                {position.leverage}
                            </span>
                        </div>
                    </div>
                </td>

                {/* Size */}
                <td className={styles.td}>
                    <span style={{ color: '#FFFFFF' }}>{formatCrypto(position.size)} <span style={{ color: '#A77590', fontSize: '11px' }}>{position.symbol}</span></span>
                </td>

                {/* Position Value */}
                <td className={styles.td}>
                    <span style={{ color: '#FFFFFF' }}>{formatUsd(position.sizeUsd)} <span style={{ color: '#A77590', fontSize: '11px' }}>USDC</span></span>
                </td>

                {/* Entry Price */}
                <td className={styles.td}>
                    <span>{position.entryPrice.toLocaleString()}</span>
                </td>

                {/* Mark Price */}
                <td className={styles.td}>
                    <span>{position.markPrice.toLocaleString()}</span>
                </td>

                {/* PNL (ROE %) */}
                <td className={styles.td}>
                    <div className={styles.cellContent} style={{ flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                        <span className={pnlColor}>
                            {pnlText}
                        </span>
                        <span className={position.unrealizedPnlPercent >= 0 ? styles.positive : styles.negative}>
                            {roiText}
                        </span>
                        {/* Share icon placeholder */}
                        <span className={styles.shareIcon}>⎋</span>
                    </div>
                </td>

                {/* Liq. Price */}
                <td className={styles.td}>
                    <span>{position.liquidationPrice ? position.liquidationPrice.toLocaleString() : 'N/A'}</span>
                </td>

                {/* Margin */}
                <td className={styles.td}>
                    <span>${formatUsd(position.margin)} <span style={{ color: '#A77590', fontSize: '11px' }}>(Cross)</span></span>
                </td>

                {/* Funding */}
                <td className={styles.td}>
                    <span style={{ color: position.funding >= 0 ? '#00E396' : '#FF4560' }}>${formatUsd(Math.abs(position.funding))}</span>
                </td>

                {/* Close All */}
                <td className={styles.td}>
                    <div className={styles.actionGroup}>
                        <button className={styles.actionButton}>Limit</button>
                        <button className={styles.actionButton}>Market</button>
                        <button className={styles.actionButton}>Reverse</button>
                    </div>
                </td>

                {/* TP/SL */}
                <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div className={styles.actionGroup} style={{ justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '12px' }}>-- / --</span>
                        <button className={styles.editButton}>✎</button>
                    </div>
                </td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${styles.row} ${styles.mobileRow}`}>
                <td className={styles.td} colSpan={100}>
                    <div className={styles.mobileCard}>
                        {/* Header (Always Visible) */}
                        <div className={styles.mobileHeader} onClick={toggleExpand}>
                            <div className={styles.mobileHeaderContent}>
                                {/* 1. Coin & Leverage */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Coin</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{position.symbol}</span>
                                        <span className={isLong ? styles.positive : styles.negative} style={{ fontSize: '10px', backgroundColor: isLong ? 'rgba(0, 227, 150, 0.1)' : 'rgba(255, 69, 96, 0.1)', padding: '2px 4px', borderRadius: '2px' }}>
                                            {position.leverage}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Size */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Size</span>
                                    <span style={{ color: '#00E396', fontSize: '13px' }}>{formatCrypto(position.size)} {position.symbol}</span>
                                </div>

                                {/* 3. PNL */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>PNL (ROE %)</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                        <span className={pnlColor} style={{ fontSize: '13px' }}>{pnlText}</span>
                                        <span className={position.unrealizedPnlPercent >= 0 ? styles.positive : styles.negative} style={{ fontSize: '11px' }}>
                                            {roiText} <span className={styles.shareIcon} style={{ fontSize: '10px' }}>⎋</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Toggle Arrow */}
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
                                    <span className={styles.mobileLabel}>Entry Price</span>
                                    <span className={styles.mobileValue}>{position.entryPrice.toLocaleString()}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Mark Price</span>
                                    <span className={styles.mobileValue}>{position.markPrice.toLocaleString()}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Liq. Price</span>
                                    <span className={styles.mobileValue}>{position.liquidationPrice ? position.liquidationPrice.toLocaleString() : 'N/A'}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Position Value</span>
                                    <span className={styles.mobileValue}>{formatUsd(position.sizeUsd)} USDC</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Margin</span>
                                    <span className={styles.mobileValue}>${formatUsd(position.margin)} (Cross)</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>Funding</span>
                                    <span className={`${styles.mobileValue} ${styles.positive}`}>${formatUsd(position.funding)}</span>
                                </div>
                                <div className={styles.mobileDetailRow}>
                                    <span className={styles.mobileLabel}>TP/SL</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={styles.mobileValue}>-- / --</span>
                                        <button className={styles.editButton}>✎</button>
                                    </div>
                                </div>
                                <div className={styles.mobileDetailRow} style={{ borderBottom: 'none', paddingTop: '16px', justifyContent: 'flex-start', gap: '16px' }}>
                                    <button className={styles.actionButton} style={{ fontSize: '13px', border: '1px solid #2E93fF', padding: '4px 12px', borderRadius: '4px' }}>Limit</button>
                                    <button className={styles.actionButton} style={{ fontSize: '13px', border: '1px solid #2E93fF', padding: '4px 12px', borderRadius: '4px' }}>Market</button>
                                    <button className={styles.actionButton} style={{ fontSize: '13px', border: '1px solid #2E93fF', padding: '4px 12px', borderRadius: '4px' }}>Reverse</button>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </>
    );
};

export default PositionRow;
