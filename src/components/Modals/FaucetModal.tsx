import React, { useState, useEffect } from 'react';
import styles from './DepositModal.module.css'; // Reusing DepositModal styles for consistency
import { useUIStore } from '../../store/useUIStore';
import usdcArbIcon from '../../assets/deposited chain/USDCARB.png';

export const FaucetModal: React.FC = () => {
    const { isFaucetModalOpen, closeFaucetModal } = useUIStore();
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (isFaucetModalOpen) {
            document.body.style.overflow = 'hidden';
            setAmount('1000'); // Default amount
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFaucetModalOpen]);

    if (!isFaucetModalOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeFaucetModal();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal} style={{ maxWidth: '480px' }}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Faucet</h2>
                    <button className={styles.closeButton} onClick={closeFaucetModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <p style={{ color: '#A77590', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                        Mint testnet tokens to start trading on Osmo. You can drip up to 1000 USDC every 24 hours.
                    </p>

                    {/* Amount Input */}
                    <div className={styles.amountContainer}>
                        <div className={styles.amountHeader}>
                            <span>Amount to Drip</span>
                            <div className={styles.balanceLabel}>
                                <span style={{ color: '#444' }}>Max Drip: 1000</span>
                            </div>
                        </div>
                        <div className={styles.inputRow}>
                            <input
                                type="text"
                                className={styles.amountInput}
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <div className={styles.assetSelector}>
                                <span className={styles.assetName} style={{ fontSize: '16px', fontWeight: 600 }}>USDC</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoRow} style={{ marginTop: '24px' }}>
                        <span className={styles.infoLabel}>Network</span>
                        <div className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={usdcArbIcon} alt="ARB" style={{ width: '20px', height: '20px' }} />
                            <span>USDC Arbitrum Sepolia</span>
                        </div>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Cooldown</span>
                        <span className={styles.infoValue}>24 Hours</span>
                    </div>

                    {/* Action Button */}
                    <button
                        className={styles.actionButton}
                        style={{ marginTop: '32px' }}
                        onClick={() => {
                            // Logic to claim would go here
                            closeFaucetModal();
                        }}
                    >
                        Drip Tokens
                    </button>
                </div>
            </div>
        </div>
    );
};
