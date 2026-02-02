import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { onchainService } from '../../api/onchainService';
import toast from 'react-hot-toast';
import styles from './DepositModal.module.css'; // Use DepositModal styles for consistency

interface SessionKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SessionKeyModal: React.FC<SessionKeyModalProps> = ({ isOpen, onClose }) => {
    const { walletAddress } = useWallet();
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!walletAddress) return;

        setCreating(true);
        try {
            const result = await onchainService.createSessionKey(walletAddress, {
                max_trade_size: 1000 * 1_000_000, // $1000
                expires_in: 30 * 24 * 60 * 60 // 30 days
            });

            localStorage.setItem('osmo_session_key', result.session_key);
            localStorage.setItem('osmo_session_expires', result.expires_at);

            toast.success('Session key established successfully!');
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create session key');
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal} style={{ maxWidth: '450px' }}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Establish Connection</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <p style={{ color: '#A77590', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                        Authorize a secure session key to enable autonomous AI trading execution.
                    </p>

                    <div className={styles.amountContainer}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className={styles.infoRow} style={{ borderBottom: '1px solid #2D0818', paddingBottom: '8px' }}>
                                <span className={styles.infoLabel}>Permission</span>
                                <span className={styles.infoValue}>Trade Execution</span>
                            </div>
                            <div className={styles.infoRow} style={{ borderBottom: '1px solid #2D0818', paddingBottom: '8px' }}>
                                <span className={styles.infoLabel}>Max Size</span>
                                <span className={styles.infoValue}>$1,000.00</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Validity</span>
                                <span className={styles.infoValue}>30 Days</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoRow} style={{ justifyContent: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#553344' }}>Key stored locally. Revocable on-chain.</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        <button
                            className={styles.actionButton}
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            {creating ? 'Establishing...' : 'Confirm Connection'}
                        </button>

                        <button
                            style={{
                                background: 'transparent',
                                border: '1px solid #3A2530',
                                color: '#A77590',
                                padding: '12px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                            onClick={onClose}
                        >
                            Skip for Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
