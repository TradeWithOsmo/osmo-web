import React, { useState } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks';
import { onchainService } from '../../api/onchainService';
import toast from 'react-hot-toast';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';

export const EnterCodeModal: React.FC = () => {
    const { isEnterCodeModalOpen, closeEnterCodeModal } = useUIStore();
    const { walletAddress } = useWallet();
    const { wallets } = useWallets();
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isEnterCodeModalOpen) return null;

    const getWalletClient = async () => {
        const activeWallet = wallets.find(w => w.address.toLowerCase() === walletAddress?.toLowerCase());
        if (!activeWallet) throw new Error('Wallet not connected');
        await activeWallet.switchChain(84532);
        const provider = await activeWallet.getEthereumProvider();
        return createWalletClient({
            account: walletAddress as `0x${string}`,
            chain: baseSepolia,
            transport: custom(provider)
        });
    };

    const handleSubmit = async () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        setIsSubmitting(true);
        try {
            const client = await getWalletClient();
            const { tx_hash } = await onchainService.enterReferralCode(client, trimmed);
            toast.loading('Submitting referral code...', { id: 'enter-code' });
            await onchainService.waitForTransaction(tx_hash);
            toast.success('Referral code submitted!', { id: 'enter-code' });
            setCode('');
            closeEnterCodeModal();
        } catch (e: any) {
            const msg = e?.shortMessage || e?.message || 'Failed to submit code';
            if (msg.includes('user rejected') || msg.includes('denied')) {
                toast.error('Transaction rejected', { id: 'enter-code' });
            } else {
                toast.error(msg, { id: 'enter-code', duration: 5000 });
            }
        } finally {
            setIsSubmitting(false);
        }
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
                        disabled={!code || isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Code'}
                    </button>
                </div>
            </div>
        </div>
    );
};
