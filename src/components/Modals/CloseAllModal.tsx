import React, { useState } from 'react';
import styles from './CloseAllModal.module.css';
import { useUIStore } from '../../store/useUIStore';

export const CloseAllModal: React.FC = () => {
    const { isCloseAllModalOpen, closeCloseAllModal } = useUIStore();
    const [closeMode, setCloseMode] = useState<'market' | 'limit'>('limit');

    // Prevent background scrolling
    React.useEffect(() => {
        if (isCloseAllModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isCloseAllModalOpen]);

    if (!isCloseAllModalOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeCloseAllModal();
    };

    const isFormValid = true;

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Confirm Close All</h2>
                    <button className={styles.closeButton} onClick={closeCloseAllModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <p className={styles.subtitle}>
                        This will close all your positions and cancel their associated TP/SL orders.
                    </p>

                    <div className={styles.optionSection}>
                        <div className={styles.optionRow} onClick={() => setCloseMode('market')}>
                            <div className={`${styles.checkbox} ${closeMode === 'market' ? styles.checked : ''}`}>
                                {closeMode === 'market' && <div className={styles.checkMark} />}
                            </div>
                            <span className={styles.optionLabel}>Market Close</span>
                        </div>

                        <div className={styles.optionRow} onClick={() => setCloseMode('limit')}>
                            <div className={`${styles.checkbox} ${closeMode === 'limit' ? styles.checked : ''}`}>
                                {closeMode === 'limit' && <div className={styles.checkMark} />}
                            </div>
                            <span className={styles.optionLabel}>Limit Close at Mid Price</span>
                        </div>
                    </div>

                    <button className={`${styles.confirmButton} ${!isFormValid ? styles.disabledButton : ''}`} disabled={!isFormValid} onClick={closeCloseAllModal}>
                        {closeMode === 'limit' ? 'Confirm Limit Close at Mid' : 'Confirm Market Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};
