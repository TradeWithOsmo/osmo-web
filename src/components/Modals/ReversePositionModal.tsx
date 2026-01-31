import React, { useState } from 'react';
import styles from './ReversePositionModal.module.css';
import { useUIStore } from '../../store/useUIStore';

export const ReversePositionModal: React.FC = () => {
    const { isReverseModalOpen, closeReverseModal, selectedPosition } = useUIStore();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Lock scroll
    React.useEffect(() => {
        if (isReverseModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isReverseModalOpen]);

    if (!isReverseModalOpen || !selectedPosition) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeModal();
    };

    const closeModal = () => {
        setDontShowAgain(false);
        closeReverseModal();
    };

    const isCurrentLong = selectedPosition.side === 'Long';
    // If current is Long, we are reversing to Short. Button = "Sell / Short" (Red)
    // If current is Short, we are reversing to Long. Button = "Buy / Long" (Green)

    const targetSide = isCurrentLong ? 'Short' : 'Long';
    const buttonClass = isCurrentLong ? styles.confirmShort : styles.confirmLong;
    const buttonText = isCurrentLong ? 'Sell / Short' : 'Buy / Long';

    // Mock calculations or data from position
    // "Est. Liquidation Price": Just using mock logic or current + margin for demo?
    // User screenshot shows specific numbers. We'll use available data.
    // Liq price changes when reversing.
    const estLiqPrice = isCurrentLong ? (selectedPosition.markPrice * 1.1) : (selectedPosition.markPrice * 0.9);
    const isFormValid = true;

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Reverse Position</h2>
                    <button className={styles.closeButton} onClick={closeModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Action Row */}
                    <div className={styles.row}>
                        <span className={styles.label}>Action</span>
                        <div className={styles.longShort}>
                            <span className={isCurrentLong ? styles.longText : styles.shortText}>
                                {selectedPosition.side}
                            </span>
                            <span className={styles.arrow}>➔</span>
                            <span className={!isCurrentLong ? styles.longText : styles.shortText}>
                                {targetSide}
                            </span>
                        </div>
                    </div>

                    {/* Size Row */}
                    <div className={styles.row}>
                        <span className={styles.label}>Size</span>
                        <span className={styles.value}>
                            {selectedPosition.size} {selectedPosition.symbol.split('-')[0]}
                        </span>
                    </div>

                    {/* Price Row */}
                    <div className={styles.row}>
                        <span className={styles.label}>Price</span>
                        <span className={styles.value}>Market</span>
                    </div>

                    {/* Est. Liq Price Row */}
                    <div className={styles.row}>
                        <span className={styles.label}>Est. Liquidation Price</span>
                        <span className={styles.value}>
                            {estLiqPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                        </span>
                    </div>

                    {/* Checkbox */}
                    <div className={styles.checkboxContainer} onClick={() => setDontShowAgain(!dontShowAgain)}>
                        <div className={`${styles.checkbox} ${dontShowAgain ? styles.checked : ''}`}>
                            {dontShowAgain && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" /></svg>}
                        </div>
                        <span className={styles.checkboxLabel}>Don't show this again</span>
                    </div>

                    {/* Button */}
                    <button className={`${styles.confirmButton} ${buttonClass} ${!isFormValid ? styles.disabledButton : ''}`} disabled={!isFormValid}>
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};
