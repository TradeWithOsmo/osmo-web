import React, { useState, useEffect } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks/useWallet';
import { onchainService } from '../../api/onchainService';
import usdcArbIcon from '../../assets/deposited chain/USDCARB.png';
import toast from 'react-hot-toast';

export const DepositModal: React.FC = () => {
    const { isDepositModalOpen, closeDepositModal, modalMode } = useUIStore();
    const { walletAddress } = useWallet();
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [vaultBalance, setVaultBalance] = useState<number>(0);
    const [aiBalance, setAiBalance] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isDepositModalOpen) {
            document.body.style.overflow = 'hidden';
            if (walletAddress) fetchBalances();
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isDepositModalOpen, walletAddress]);

    const fetchBalances = async () => {
        if (!walletAddress) return;
        setLoading(true);
        try {
            const balances = await onchainService.getVaultBalances(walletAddress);
            setVaultBalance(balances.trading);
            setAiBalance(balances.ai);
        } catch (error) {
            console.error('Failed to fetch balances:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isDepositModalOpen) return null;

    const isFormValid = !!amount && parseFloat(amount) > 0;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeDepositModal();
        }
    };

    const handleAction = async () => {
        if (!walletAddress || !isFormValid) return;

        setProcessing(true);
        const amountUSDC = parseFloat(amount) * 1_000_000; // 6 decimals

        try {
            if (modalMode === 'refill') {
                // Refill AI Vault (Trading Vault -> AI Vault)
                await onchainService.refillAIVault(walletAddress, amountUSDC);
                toast.success('AI Vault refilled successfully');
            } else if (activeTab === 'deposit') {
                // Deposit (Wallet -> Trading Vault)
                await onchainService.depositToVault(walletAddress, amountUSDC);
                toast.success('Deposit successful');
            } else {
                // Withdraw (Trading Vault -> Wallet)
                await onchainService.withdrawFromVault(walletAddress, amountUSDC);
                toast.success('Withdrawal successful');
            }

            // Refresh balances and close
            await fetchBalances();
            setAmount('');
            closeDepositModal();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Transaction failed');
        } finally {
            setProcessing(false);
        }
    };

    // Determine max balance based on mode
    const getMaxBalance = () => {
        if (modalMode === 'refill') return vaultBalance; // Refill comes FROM trading vault
        if (activeTab === 'withdraw') return vaultBalance; // Withdraw FROM trading vault
        // For deposit, we ideally check wallet USDC balance. 
        // For now, we leave it user input or max of infinity (placeholder)
        return 0; // Or fetch wallet balance if available
    };

    const handleMaxClick = () => {
        const max = getMaxBalance();
        if (max > 0) {
            // Display as USD (2 decimals)
            setAmount((max / 1_000_000).toString());
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
                    {/* Tabs (Only for Deposit/Withdraw mode) */}
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
                                {loading ? (
                                    <span>Loading...</span>
                                ) : (
                                    <span>
                                        {modalMode === 'refill'
                                            ? `${(vaultBalance / 1_000_000).toLocaleString()} available`
                                            : activeTab === 'withdraw'
                                                ? `${(vaultBalance / 1_000_000).toLocaleString()} available`
                                                : 'Wallet Balance' // Placeholder until wallet balance fetch is ready
                                        }
                                    </span>
                                )}
                                <span style={{ color: '#444' }}>•</span>
                                <button className={styles.maxButton} onClick={handleMaxClick}>MAX</button>
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
                            <span className={styles.infoValue}>
                                <span style={{ color: '#8b9bb4' }}>Trading Vault</span> → <span style={{ color: '#fff' }}>AI Vault</span>
                            </span>
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
                        <span className={styles.infoLabel}>
                            {modalMode === 'refill' ? 'Current AI Credits' : 'Vault Balance'}
                        </span>
                        <span className={styles.infoValue}>
                            ${((modalMode === 'refill' ? aiBalance : vaultBalance) / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Action Button */}
                    <button
                        className={`${styles.actionButton} ${!isFormValid || processing ? styles.disabledButton : ''}`}
                        disabled={!isFormValid || processing}
                        onClick={handleAction}
                    >
                        {processing ? 'Processing...' : (
                            modalMode === 'refill' ? 'Refill Credits' : (activeTab === 'deposit' ? 'Deposit funds' : 'Withdraw funds')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
