import React, { useState } from 'react';
import styles from './MarketCloseModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks/useWallet';
import { orderService } from '../../api/orderService';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import toast from 'react-hot-toast';

export const MarketCloseModal: React.FC = () => {
    const { isMarketCloseModalOpen, closeMarketCloseModal, selectedPosition: uiPosition } = useUIStore();
    const { positions, refreshAll } = usePortfolioStore();
    const { getPrice } = useMarketStore();
    const { walletAddress } = useWallet();

    const selectedPosition = positions.find(p => p.id === uiPosition?.id) || uiPosition;

    const [percentage, setPercentage] = useState(100);
    const [manualSize, setManualSize] = useState('');
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Support both camelCase and snake_case from different store types
    const markPrice = getPrice(selectedPosition?.symbol || '') || (selectedPosition as any)?.markPrice || (selectedPosition as any)?.mark_price || 0;

    // Prevent background scrolling
    React.useEffect(() => {
        if (isMarketCloseModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMarketCloseModalOpen]);

    if (!isMarketCloseModalOpen || !selectedPosition) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeMarketCloseModal();
        }
    };

    const assetSymbol = selectedPosition.symbol.split('-')[0];

    // Update manual size when percentage changes
    React.useEffect(() => {
        if (selectedPosition && !isSubmitting) {
            const size = (selectedPosition.size * (percentage / 100));
            setManualSize(size.toFixed(selectedPosition.symbol.includes('USD') ? 4 : 8));
        }
    }, [percentage, selectedPosition?.size, isSubmitting]);

    const handleManualSizeChange = (val: string) => {
        setManualSize(val);
        const num = parseFloat(val);
        if (selectedPosition && !isNaN(num) && selectedPosition.size > 0) {
            const pct = Math.min(100, Math.max(0, (num / selectedPosition.size) * 100));
            setPercentage(pct);
        }
    };

    const closingSize = parseFloat(manualSize) || 0;
    const closingUsd = closingSize * markPrice;

    const formatSize = (val: number) => {
        if (!val && val !== 0) return '0.0000';
        return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
    };

    const handleConfirm = async () => {
        if (!walletAddress || !selectedPosition) return;
        setIsSubmitting(true);
        try {
            // Use Backend API for "Simulated/Ledger" Close
            await orderService.closePosition(
                walletAddress,
                selectedPosition.symbol,
                undefined, // Market Price
                percentage / 100,
                (selectedPosition as any)?.exchange
            );

            toast.success('Market close submitted');
            closeMarketCloseModal();

            // Immediate Refresh
            refreshAll(walletAddress);

            // Double Refresh for indexer lag
            setTimeout(() => refreshAll(walletAddress), 500);
            setTimeout(() => refreshAll(walletAddress), 2000);

        } catch (error: any) {
            console.error('Close failed', error);
            toast.error(error.message || 'Failed to close position');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Market Close</h2>
                    <button className={styles.closeButton} onClick={closeMarketCloseModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <div className={styles.content}>
                    <p className={styles.subtitle}>This will attempt to immediately close the position.</p>
                    {/* Size Summary */}
                    <div className={styles.row}>
                        <span className={styles.label}>Size</span>
                        <span className={`${styles.value} ${styles.sizeValue}`}>
                            {formatSize(selectedPosition.size)} {assetSymbol}
                        </span>
                    </div>

                    {/* Price Summary */}
                    <div className={styles.row}>
                        <span className={styles.label}>Mark Price</span>
                        <span className={styles.value}>
                            ${markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className={styles.row}>
                        <span className={styles.label}>Close Value</span>
                        <span className={styles.value}>
                            ${closingUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Input Area */}
                    <div className={styles.inputContainer}>
                        <span className={styles.inputLabel}>Amount</span>
                        <div className={styles.inputWrapper}>
                            <input
                                type="number"
                                className={styles.numberInput}
                                value={manualSize}
                                onChange={(e) => handleManualSizeChange(e.target.value)}
                                placeholder="0.00"
                            />
                            <span className={styles.assetName}>{assetSymbol}</span>
                        </div>
                    </div>

                    {/* Slider Section */}
                    <div className={styles.sliderSection}>
                        <div className={styles.sliderContainer}>
                            <div className={styles.sliderTrack} />
                            <div
                                className={styles.sliderProgress}
                                style={{ width: `${percentage}%` }}
                            />
                            {/* Dots at 0, 25, 50, 75, 100 */}
                            {[0, 25, 50, 75, 100].map(dot => (
                                <div
                                    key={dot}
                                    className={styles.sliderDot}
                                    style={{ left: `${dot}%`, zIndex: 4, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPercentage(dot);
                                    }}
                                />
                            ))}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={percentage}
                                onChange={(e) => setPercentage(parseInt(e.target.value))}
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    opacity: 0,
                                    cursor: 'pointer',
                                    zIndex: 3
                                }}
                            />
                            <div
                                className={styles.sliderThumb}
                                style={{ left: `${percentage}%` }}
                            />
                        </div>
                        <div className={styles.percentageBox}>
                            {percentage} %
                        </div>
                    </div>

                    {/* Checkbox */}
                    <div className={styles.checkboxContainer} onClick={() => setDontShowAgain(!dontShowAgain)}>
                        <div className={`${styles.checkbox} ${dontShowAgain ? styles.checked : ''}`}>
                            {dontShowAgain && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" /></svg>}
                        </div>
                        <span className={styles.checkboxLabel}>Don't show this again</span>
                    </div>

                    {/* Action Button */}
                    <button
                        className={`${styles.confirmButton} ${isSubmitting ? styles.disabledButton : ''}`}
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Closing...' : 'Market Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};
