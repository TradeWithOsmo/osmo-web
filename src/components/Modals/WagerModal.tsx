import React, { useState } from 'react';
import styles from './WagerModal.module.css';
import osmoLogo from '../../assets/Icons/Osmo-Logos.png';

interface WagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    side: 'human' | 'ai';
    balance: number;
    isProcessing?: boolean;
}

export const WagerModal: React.FC<WagerModalProps> = ({ isOpen, onClose, onConfirm, side, balance, isProcessing }) => {
    const [amount, setAmount] = useState('');

    if (!isOpen) return null;

    const handleMaxClick = () => {
        setAmount(balance.toString());
    };

    const handleConfirm = () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val < 0) {
            onConfirm(0);
        } else if (val <= balance) {
            onConfirm(val);
        }
    };

    const parsedAmount = parseFloat(amount) || 0;
    const isValid = parsedAmount >= 0 && parsedAmount <= balance;

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Double Down</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.description}>
                        You are backing <strong>{side === 'human' ? 'Humans' : 'AI'}</strong>.
                        Optionally wager your points to earn <strong>2x <img src={osmoLogo} alt="$OSMO" width={16} height={16} style={{ marginBottom: -3, marginRight: 2 }} /> $OSMO</strong> rewards if your side wins.
                    </div>

                    <div className={styles.amountContainer}>
                        <div className={styles.amountHeader}>
                            <span>Wager Amount (Optional)</span>
                            <div className={styles.balanceLabel}>
                                <span>{balance.toLocaleString()} pts available</span>
                                <button className={styles.maxButton} onClick={handleMaxClick}>MAX</button>
                            </div>
                        </div>
                        <div className={styles.inputRow}>
                            <input
                                type="number"
                                className={styles.amountInput}
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <span className={styles.unit}>PTS</span>
                        </div>
                    </div>

                    {parsedAmount > 0 && (
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Potential Reward</span>
                            <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {(parsedAmount * 2).toLocaleString()} <img src={osmoLogo} alt="$OSMO" width={16} height={16} /> $OSMO
                            </span>
                        </div>
                    )}

                    <button
                        className={styles.actionButton}
                        disabled={!isValid || isProcessing}
                        onClick={handleConfirm}
                    >
                        {isProcessing ? (
                            <div className={styles.loader} />
                        ) : (
                            parsedAmount > 0 ? 'Confirm Wager' : 'Join without Wager'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
