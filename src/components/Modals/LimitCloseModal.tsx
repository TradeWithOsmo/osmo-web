import React, { useState } from 'react';
import styles from './LimitCloseModal.module.css';
import { useUIStore } from '../../store/useUIStore';

export const LimitCloseModal: React.FC = () => {
    const { isLimitCloseModalOpen, closeLimitCloseModal, selectedPosition } = useUIStore();
    const [percentage, setPercentage] = useState(100);
    const [limitPrice, setLimitPrice] = useState('');

    // Prevent background scrolling
    React.useEffect(() => {
        if (isLimitCloseModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isLimitCloseModalOpen]);

    if (!isLimitCloseModalOpen || !selectedPosition) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeLimitCloseModal();
        }
    };

    const assetSymbol = selectedPosition.symbol.split('-')[0];
    const closingSize = (selectedPosition.size * (percentage / 100)).toFixed(4);
    const isFormValid = !!limitPrice;

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Limit Close</h2>
                    <button className={styles.closeButton} onClick={closeLimitCloseModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <div className={styles.content}>
                    <p className={styles.subtitle}>This will close the position at the specified price.</p>

                    {/* Size Summary */}
                    <div className={styles.row}>
                        <span className={styles.label}>Size</span>
                        <span className={`${styles.value} ${styles.sizeValue}`}>
                            {selectedPosition.size} {assetSymbol}
                        </span>
                    </div>

                    {/* Price Input */}
                    <div className={styles.inputContainer}>
                        <span className={styles.inputLabel}>Price</span>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                className={styles.numberInput}
                                placeholder={selectedPosition.markPrice.toString()}
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                            />
                            <span className={styles.assetName}>USDC</span>
                        </div>
                    </div>

                    {/* Size Input Area */}
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

                    {/* Action Button */}
                    <button className={`${styles.confirmButton} ${!isFormValid ? styles.disabledButton : ''}`} onClick={closeLimitCloseModal}>
                        Limit Close
                    </button>
                </div>
            </div>
        </div>
    );
};
