import React, { useState } from 'react';
import styles from './MarketCloseModal.module.css';
import { useUIStore } from '../../store/useUIStore';

export const MarketCloseModal: React.FC = () => {
    const { isMarketCloseModalOpen, closeMarketCloseModal, selectedPosition } = useUIStore();
    const [percentage, setPercentage] = useState(100);
    const [dontShowAgain, setDontShowAgain] = useState(false);

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
    const closingSize = (selectedPosition.size * (percentage / 100)).toFixed(4);
    const isFormValid = true; // Market close always has input (default 100%)

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
                            {selectedPosition.size} {assetSymbol}
                        </span>
                    </div>

                    {/* Price Summary */}
                    <div className={styles.row}>
                        <span className={styles.label}>Price</span>
                        <span className={styles.value}>Market</span>
                    </div>

                    {/* Input Area */}
                    <div className={styles.inputContainer}>
                        <span className={styles.inputLabel}>Size</span>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                className={styles.numberInput}
                                value={closingSize.replace('.', ',')}
                                readOnly
                            />
                            <span className={styles.assetName}>{assetSymbol}</span>
                            <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M9.5 4.25L6 7.75L2.5 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
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
                    <button className={`${styles.confirmButton} ${!isFormValid ? styles.disabledButton : ''}`} onClick={closeMarketCloseModal}>
                        Market Close
                    </button>
                </div>
            </div>
        </div>
    );
};
