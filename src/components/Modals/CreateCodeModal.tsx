import React, { useState } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';

export const CreateCodeModal: React.FC = () => {
    const { isCreateCodeModalOpen, closeCreateCodeModal } = useUIStore();
    const [code, setCode] = useState('');

    if (!isCreateCodeModalOpen) return null;

    const handleSubmit = () => {
        // Implement logic here
        closeCreateCodeModal();
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeCreateCodeModal()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Create Code</h2>
                    <button className={styles.closeButton} onClick={closeCreateCodeModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.amountContainer}>
                        <div className={styles.amountHeader}>
                            <span>Your Custom Code</span>
                        </div>
                        <div className={styles.inputRow}>
                            <input
                                type="text"
                                className={styles.amountInput}
                                style={{ fontSize: '16px' }}
                                placeholder="e.g. TREASURE"
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
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};
