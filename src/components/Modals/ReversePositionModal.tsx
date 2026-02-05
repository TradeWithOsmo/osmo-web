import React, { useState } from 'react';
import styles from './ReversePositionModal.module.css';
import { useUIStore } from '../../store/useUIStore';

import { useWallet } from '../../hooks/useWallet';
import { orderService } from '../../api/orderService';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import toast from 'react-hot-toast';

export const ReversePositionModal: React.FC = () => {
    const { isReverseModalOpen, closeReverseModal, selectedPosition: uiPosition } = useUIStore();
    const { positions, refreshAll } = usePortfolioStore();
    const { getPrice } = useMarketStore();
    const { walletAddress } = useWallet() as any;

    const selectedPosition = positions.find(p => p.id === uiPosition?.id) || uiPosition;

    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const markPrice = getPrice(selectedPosition?.symbol || '') || (selectedPosition as any)?.markPrice || (selectedPosition as any)?.mark_price || 0;

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

    const closeModal = () => {
        setDontShowAgain(false);
        closeReverseModal();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeModal();
    };

    // Helper
    const formatSize = (val: number) => {
        if (!val && val !== 0) return '0.0000';
        return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
    };


    const isCurrentLong = selectedPosition.side.toLowerCase() === 'long';
    const targetSide = isCurrentLong ? 'Short' : 'Long';
    const buttonClass = isCurrentLong ? styles.confirmShort : styles.confirmLong;
    const buttonText = isCurrentLong ? 'Sell / Short' : 'Buy / Long';

    const estLiqPrice = isCurrentLong ? (markPrice * 1.08) : (markPrice * 0.92);

    const handleConfirm = async () => {
        if (!walletAddress || !selectedPosition) return;
        setIsSubmitting(true);
        try {
            await orderService.reversePosition(
                walletAddress,
                selectedPosition.symbol
            );

            toast.success('Reverse position submitted');
            closeReverseModal();

            // Immediate Refresh
            refreshAll(walletAddress);

            // Sequential refreshes to ensure we catch the indexer
            setTimeout(() => refreshAll(walletAddress), 500);
            setTimeout(() => refreshAll(walletAddress), 2000);

        } catch (error: any) {
            console.error('Reverse failed', error);
            toast.error(error.message || 'Failed to reverse position');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            {formatSize(selectedPosition.size)} {selectedPosition.symbol.split('-')[0]}
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
                    <button
                        className={`${styles.confirmButton} ${buttonClass} ${isSubmitting ? styles.disabledButton : ''}`}
                        disabled={isSubmitting}
                        onClick={handleConfirm}
                    >
                        {isSubmitting ? 'Submitting...' : buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};
