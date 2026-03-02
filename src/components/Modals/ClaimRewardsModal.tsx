import React, { useEffect, useState } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks';
import { referralService } from '../../api/referralService';
import toast from 'react-hot-toast';

export const ClaimRewardsModal: React.FC = () => {
    const { isClaimRewardsModalOpen, closeClaimRewardsModal } = useUIStore();
    const { walletAddress } = useWallet();
    const [claimableAmount, setClaimableAmount] = useState(0);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        if (!isClaimRewardsModalOpen) return;
        let mounted = true;
        referralService.getSummary(walletAddress || '')
            .then((summary) => {
                if (mounted) setClaimableAmount(summary.claimableRewards || 0);
            })
            .catch(() => {
                if (mounted) setClaimableAmount(0);
            });
        return () => {
            mounted = false;
        };
    }, [isClaimRewardsModalOpen, walletAddress]);

    if (!isClaimRewardsModalOpen) return null;

    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            const result = await referralService.claimRewards(walletAddress || '');
            setClaimableAmount(result.remainingClaimable || 0);
            toast.success(`Claimed $${(result.claimedAmount || 0).toFixed(2)}`);
            closeClaimRewardsModal();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to claim rewards');
        } finally {
            setIsClaiming(false);
        }
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
                        disabled={isClaiming}
                        onClick={handleClaim}
                    >
                        {isClaiming ? 'Claiming...' : 'Claim Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};
