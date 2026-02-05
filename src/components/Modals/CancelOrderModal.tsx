import React, { useState } from 'react';
import styles from './MarketCloseModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks/useWallet';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import toast from 'react-hot-toast';

export const CancelOrderModal: React.FC = () => {
    const { isCancelOrderModalOpen, closeCancelOrderModal, selectedOrder } = useUIStore();
    const { cancelOrder } = usePortfolioStore();
    const { walletAddress } = useWallet();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Prevent background scrolling
    React.useEffect(() => {
        if (isCancelOrderModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isCancelOrderModalOpen]);

    if (!isCancelOrderModalOpen || !selectedOrder) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeCancelOrderModal();
        }
    };

    const handleConfirm = async () => {
        if (!walletAddress || !selectedOrder) return;
        setIsSubmitting(true);
        try {
            await cancelOrder(walletAddress, selectedOrder.id);
            toast.success('Order cancelled successfully');
            closeCancelOrderModal();
        } catch (error: any) {
            console.error('Cancel failed', error);
            toast.error(error.message || 'Failed to cancel order');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal} style={{ maxWidth: '400px' }}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Cancel Order</h2>
                    <button className={styles.closeButton} onClick={closeCancelOrderModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <p style={{ color: '#A77590', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                        Are you sure you want to cancel your <span style={{ color: '#FFE1F2', fontWeight: 600 }}>{selectedOrder.type}</span> order for <span style={{ color: '#FFE1F2', fontWeight: 600 }}>{selectedOrder.symbol}</span>?
                    </p>

                    <div style={{ background: 'rgba(255, 225, 242, 0.03)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#A77590', fontSize: '13px' }}>Side</span>
                            <span style={{ color: selectedOrder.direction === 'Long' ? '#00E396' : '#FF4560', fontWeight: 600, fontSize: '13px' }}>{selectedOrder.direction}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#A77590', fontSize: '13px' }}>Size</span>
                            <span style={{ color: '#FFE1F2', fontWeight: 600, fontSize: '13px' }}>{selectedOrder.size} {selectedOrder.symbol}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#A77590', fontSize: '13px' }}>Price</span>
                            <span style={{ color: '#FFE1F2', fontWeight: 600, fontSize: '13px' }}>${selectedOrder.price.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        style={{ background: '#FF4560' }}
                    >
                        {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
};
