import React, { useState } from 'react';
import styles from './MarketCloseModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks/useWallet';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import toast from 'react-hot-toast';

export const CancelAllOrdersModal: React.FC = () => {
    const { isCancelAllOrdersModalOpen, closeCancelAllOrdersModal } = useUIStore();
    const { openOrders, cancelAllOrders } = usePortfolioStore();
    const { walletAddress } = useWallet();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Prevent background scrolling
    React.useEffect(() => {
        if (isCancelAllOrdersModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isCancelAllOrdersModalOpen]);

    if (!isCancelAllOrdersModalOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeCancelAllOrdersModal();
        }
    };

    const handleConfirm = async () => {
        if (!walletAddress) return;
        setIsSubmitting(true);
        try {
            await cancelAllOrders(walletAddress);
            toast.success('All orders cancelled successfully');
            closeCancelAllOrdersModal();
        } catch (error: any) {
            console.error('Cancel All failed', error);
            toast.error(error.message || 'Failed to cancel all orders');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal} style={{ maxWidth: '400px' }}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Cancel All Orders</h2>
                    <button className={styles.closeButton} onClick={closeCancelAllOrdersModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <p style={{ color: '#A77590', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
                        Are you sure you want to cancel all <span style={{ color: '#FFE1F2', fontWeight: 600 }}>{openOrders.length}</span> open orders? This action cannot be undone.
                    </p>

                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={isSubmitting || openOrders.length === 0}
                    >
                        {isSubmitting ? 'Cancelling All...' : 'Confirm Cancel All'}
                    </button>
                </div>
            </div>
        </div>
    );
};
