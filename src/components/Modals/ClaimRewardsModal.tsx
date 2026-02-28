import React from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';

export const ClaimRewardsModal: React.FC = () => {
    const { isClaimRewardsModalOpen, closeClaimRewardsModal } = useUIStore();
    const claimableAmount = 0.00; // Mock data

    if (!isClaimRewardsModalOpen) return null;

    const handleClaim = () => {
        // Implement logic here
        closeClaimRewardsModal();
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeClaimRewardsModal()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Claim Rewards</h2>
                    <button className={styles.closeButton} onClick={closeClaimRewardsModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.infoRow} style={{ marginBottom: '16px' }}>
                        <span className={styles.infoLabel}>Claimable Rewards</span>
                        <span className={styles.infoValue}>${claimableAmount.toFixed(2)}</span>
                    </div>

                    <button
                        className={styles.actionButton}
                        onClick={handleClaim}
                    >
                        Claim Now
                    </button>
                </div>
            </div>
        </div>
    );
};
