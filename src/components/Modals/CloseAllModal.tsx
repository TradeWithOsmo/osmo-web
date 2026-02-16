import React, { useState } from 'react';
import styles from './CloseAllModal.module.css';
import { useUIStore } from '../../store/useUIStore';

import { useWallet } from '../../hooks/useWallet';
import { orderService } from '../../api/orderService';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import toast from 'react-hot-toast';

export const CloseAllModal: React.FC = () => {
    const { isCloseAllModalOpen, closeCloseAllModal } = useUIStore();
    const { positions, refreshAll } = usePortfolioStore();
    const { getPrice } = useMarketStore();
    const { walletAddress } = useWallet() as any;
    const [closeMode, setCloseMode] = useState<'market' | 'limit'>('limit');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Prevent background scrolling
    React.useEffect(() => {
        if (isCloseAllModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isCloseAllModalOpen]);

    if (!isCloseAllModalOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeCloseAllModal();
    };

    const isFormValid = true;

    const resolveMidPrice = (position: any): number | undefined => {
        const fromStore = getPrice?.(position?.symbol);
        const candidate =
            fromStore ??
            position?.mark_price ??
            position?.markPrice ??
            position?.mark ??
            position?.entry_price ??
            position?.entryPrice;
        const num = Number(candidate);
        return Number.isFinite(num) && num > 0 ? num : undefined;
    };

    const handleConfirm = async () => {
        if (!walletAddress) {
            toast.error('Connect your wallet first');
            return;
        }
        if (!positions || positions.length === 0) {
            toast.error('No open positions to close');
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading(
            closeMode === 'limit'
                ? 'Closing all positions (limit @ mid)...'
                : 'Closing all positions (market)...'
        );

        try {
            // Always close sequentially so each position can pass its `exchange` (simulation/onchain/etc).
            // This also avoids backend "close all" ambiguity across exchanges.
            for (const p of positions) {
                const priceHint = resolveMidPrice(p);
                const ex = String((p as any)?.exchange || '').trim().toLowerCase();

                // For onchain: passing `price` turns market close into a limit close (can sit unfilled).
                // For simulation/others: passing a price hint is safe and avoids slow/fragile price fetches.
                const price =
                    closeMode === 'limit'
                        ? priceHint
                        : (ex && ex !== 'onchain' ? priceHint : undefined);

                await orderService.closePosition(walletAddress, p.symbol, price, 1.0, (p as any)?.exchange);
            }

            toast.success('All positions closed', { id: toastId });
            closeCloseAllModal();

            // Immediate Refresh
            refreshAll(walletAddress);

            // Sequential refreshes
            setTimeout(() => refreshAll(walletAddress), 500);
            setTimeout(() => refreshAll(walletAddress), 2000);

        } catch (error: any) {
            console.error(error);
            toast.error(error?.message ? `Failed to close some positions: ${error.message}` : 'Failed to close some positions', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Confirm Close All</h2>
                    <button className={styles.closeButton} onClick={closeCloseAllModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <p className={styles.subtitle}>
                        This will close all your positions and cancel their associated TP/SL orders.
                    </p>

                    <div className={styles.positionsList}>
                        {positions.map((p, idx) => (
                            <div key={idx} className={styles.positionItem}>
                                <span className={typeof p.side === 'string' && p.side.toLowerCase() === 'long' ? styles.longText : styles.shortText}>
                                    {p.side}
                                </span>
                                <span className={styles.positionDetail}>
                                    {Number(p.size || 0).toLocaleString('en-US', { maximumFractionDigits: 8 })} {String(p.symbol || '').split('-')[0]}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.optionSection}>
                        <div className={styles.optionRow} onClick={() => setCloseMode('market')}>
                            <div className={`${styles.checkbox} ${closeMode === 'market' ? styles.checked : ''}`}>
                                {closeMode === 'market' && <div className={styles.checkMark} />}
                            </div>
                            <span className={styles.optionLabel}>Market Close</span>
                        </div>

                        <div className={styles.optionRow} onClick={() => setCloseMode('limit')}>
                            <div className={`${styles.checkbox} ${closeMode === 'limit' ? styles.checked : ''}`}>
                                {closeMode === 'limit' && <div className={styles.checkMark} />}
                            </div>
                            <span className={styles.optionLabel}>Limit Close at Mid Price</span>
                        </div>
                    </div>

                    <button
                        className={`${styles.confirmButton} ${!isFormValid || isSubmitting ? styles.disabledButton : ''}`}
                        disabled={!isFormValid || isSubmitting}
                        onClick={handleConfirm}
                    >
                        {isSubmitting ? 'Closing...' : (closeMode === 'limit' ? 'Confirm Limit Close at Mid' : 'Confirm Market Close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
