import React, { useState } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import usdcArbIcon from '../../assets/deposited chain/USDCARB.png';

export const DepositModal: React.FC = () => {
    const { isDepositModalOpen, closeDepositModal, modalMode } = useUIStore();
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');

    // Prevent background scrolling when modal is open
    React.useEffect(() => {
        if (isDepositModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isDepositModalOpen]);

    if (!isDepositModalOpen) return null;

    const isFormValid = !!amount && parseFloat(amount) > 0;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeDepositModal();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {modalMode === 'refill' ? 'Refill Credits' : (activeTab === 'deposit' ? 'Deposit' : 'Withdraw')}
                    </h2>
                    <button className={styles.closeButton} onClick={closeDepositModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Tabs (Only for Deposit mode) */}
                    {modalMode === 'deposit' && (
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeTab === 'deposit' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('deposit')}
                            >
                                Deposit
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'withdraw' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('withdraw')}
                            >
                                Withdraw
                            </button>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div className={styles.amountContainer}>
                        <div className={styles.amountHeader}>
                            <span>Amount</span>
                            <div className={styles.balanceLabel}>
                                <span>0.0000 {modalMode === 'refill' ? 'credits' : 'held'}</span>
                                <span style={{ color: '#444' }}>•</span>
                                <button className={styles.maxButton} onClick={() => setAmount('123.45')}>MAX</button>
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
                                <img src={usdcArbIcon} alt="USDC/ARB" className={styles.assetIcon} />
                                <span className={styles.assetName}>USDC/ARB</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Rows */}
                    {modalMode === 'refill' ? (
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Refill Method</span>
                            <span className={styles.infoValue}>From Balance &gt; Send</span>
                        </div>
                    ) : (
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>
                                {activeTab === 'deposit' ? 'Deposit method' : 'Withdraw method'}
                            </span>
                            <span className={styles.infoValue}>
                                {parseFloat(amount) > 0 ? (
                                    <div className={styles.instantContainer}>
                                        <span className={styles.instantLabel}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M7.58333 1.16667L2.33333 7.58334H6.41667L5.83333 12.8333L11.0833 6.41667H7L7.58333 1.16667Z" fill="#F4B400" stroke="#F4B400" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Instant
                                        </span>
                                        <span className={styles.freeBadge}>Free</span>
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </span>
                        </div>
                    )}

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Available Balance</span>
                        <span className={styles.infoValue}>$0.00</span>
                    </div>

                    {/* Action Button */}
                    <button className={`${styles.actionButton} ${!isFormValid ? styles.disabledButton : ''}`} disabled={!isFormValid}>
                        {modalMode === 'refill' ? 'Refill Credits' : (activeTab === 'deposit' ? 'Deposit funds' : 'Withdraw funds')}
                    </button>
                </div>
            </div>
        </div>
    );
};
