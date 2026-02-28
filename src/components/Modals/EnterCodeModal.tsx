import React, { useState } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';

export const EnterCodeModal: React.FC = () => {
    const { isEnterCodeModalOpen, closeEnterCodeModal } = useUIStore();
    const [code, setCode] = useState('');

    if (!isEnterCodeModalOpen) return null;

    const handleSubmit = () => {
        // Implement logic here
        closeEnterCodeModal();
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeEnterCodeModal()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Enter Referral Code</h2>
                    <button className={styles.closeButton} onClick={closeEnterCodeModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.amountContainer}>
                        <div className={styles.amountHeader}>
                            <span>Referral Code</span>
                        </div>
                        <div className={styles.inputRow}>
                            <input
                                type="text"
                                className={styles.amountInput}
                                style={{ fontSize: '16px' }}
                                placeholder="Enter code here"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        className={`${styles.actionButton} ${!code ? styles.disabledButton : ''}`}
                        disabled={!code}
                        onClick={handleSubmit}
                    >
                        Submit Code
                    </button>
                </div>
            </div>
        </div>
    );
};
