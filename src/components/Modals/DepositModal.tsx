import React, { useState, useEffect } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks/useWallet';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useBalance } from 'wagmi';

import { onchainService, CONTRACTS } from '../../api/onchainService'; // Updated import
import TokenIcon from '../MarketDetails/TokenIcon';
import toast from 'react-hot-toast';
import { createWalletClient, custom, formatUnits, isAddress } from 'viem';
import { baseSepolia } from 'viem/chains';

export const DepositModal: React.FC = () => {
    const { isDepositModalOpen, closeDepositModal, modalMode } = useUIStore();
    const { walletAddress, wallets, handleSwitchToTargetChain } = useWallet();

    // Internal tab state (Deposit/Withdraw in normal mode, Refill/Unrefill in refill mode)
    const [subTab, setSubTab] = useState<'in' | 'out'>('in');

    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [vaultBalance, setVaultBalance] = useState<number>(0);
    const [availableBalance, setAvailableBalance] = useState<number>(0);
    const [aiBalance, setAiBalance] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Reset subTab when modal mode changes or opens
    useEffect(() => {
        if (isDepositModalOpen) {
            setSubTab('in');
            setAmount('');
            setRecipient('');
        }
    }, [isDepositModalOpen, modalMode]);

    // Fetch USDC Balance via Wagmi
    const { data: usdcBalanceData } = useBalance({
        address: walletAddress as `0x${string}`,
        token: CONTRACTS.USDC as `0x${string}`,
        query: {
            enabled: !!walletAddress && isDepositModalOpen,
            refetchInterval: 10000 // Slowed down to 10s
        }
    });

    const walletUSDCBalance = usdcBalanceData ? Number(formatUnits(usdcBalanceData.value, usdcBalanceData.decimals)) : 0;

    // Fetch Vault balances
    useEffect(() => {
        if (isDepositModalOpen && walletAddress) {
            document.body.style.overflow = 'hidden';
            fetchBalances();
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
            setAvailableBalance(balances.available);
            setAiBalance(balances.ai);
        } catch (error) {
            console.error('Failed to fetch balances:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isDepositModalOpen) return null;

    // Derived logic
    const isRefill = modalMode === 'refill';

    const maxAllowed = isRefill
        ? (subTab === 'in' ? availableBalance : aiBalance)
        : (subTab === 'in' ? walletUSDCBalance : availableBalance);

    const isRecipientValid = !recipient || isAddress(recipient);
    const isAmountValid = !!amount && parseFloat(amount) > 0 && parseFloat(amount) <= (maxAllowed + 0.000001); // Float tolerance
    const isFormValid = isAmountValid && isRecipientValid;

    const handleAction = async () => {
        if (!walletAddress || !isFormValid) return;

        const wallet = wallets[0];
        if (!wallet) {
            toast.error('No wallet connected');
            return;
        }

        setProcessing(true);
        try {
            await handleSwitchToTargetChain();

            const provider = await wallet.getEthereumProvider();
            const walletClient = createWalletClient({
                account: walletAddress as `0x${string}`,
                chain: baseSepolia,
                transport: custom(provider)
            });

            const amountVal = parseFloat(amount);

            if (isRefill) {
                if (subTab === 'in') {
                    // Refill (Trading -> AI)
                    const withdrawResult = await onchainService.withdrawFromVault(walletClient, walletAddress, amountVal);
                    await toast.promise(onchainService.waitForTransaction(withdrawResult.tx_hash), {
                        loading: 'Withdrawing from Trading Vault...',
                        success: 'Withdrawal confirmed! Depositing to AI Vault...',
                        error: 'Withdrawal failed'
                    });

                    const depositResult = await onchainService.depositToAIVault(walletClient, walletAddress, amountVal);
                    await toast.promise(onchainService.waitForTransaction(depositResult.tx_hash), {
                        loading: 'Depositing to AI Vault...',
                        success: 'Refill successful!',
                        error: 'AI Deposit failed'
                    });
                } else {
                    // Unrefill (AI -> Trading)
                    const withdrawResult = await onchainService.withdrawFromAIVault(walletClient, walletAddress, amountVal);
                    await toast.promise(onchainService.waitForTransaction(withdrawResult.tx_hash), {
                        loading: 'Withdrawing from AI Vault...',
                        success: 'Withdrawal confirmed! Depositing to Trading Vault...',
                        error: 'Withdrawal failed'
                    });

                    const depositResult = await onchainService.depositToVault(walletClient, walletAddress, amountVal);
                    await toast.promise(onchainService.waitForTransaction(depositResult.tx_hash), {
                        loading: 'Depositing to Trading Vault...',
                        success: 'Unrefill successful!',
                        error: 'Trading Deposit failed'
                    });
                }
            } else {
                if (subTab === 'in') {
                    // Deposit (Wallet -> Trading)
                    await onchainService.depositToVault(walletClient, walletAddress, amountVal);
                    toast.success('Deposit successful');
                } else {
                    // Withdraw (Trading -> Wallet)
                    const withdrawResult = await onchainService.withdrawFromVault(walletClient, walletAddress, amountVal);
                    await toast.promise(onchainService.waitForTransaction(withdrawResult.tx_hash), {
                        loading: 'Withdrawing...',
                        success: 'Withdrawal confirmed!',
                        error: 'Withdrawal failed'
                    });

                    if (recipient && isAddress(recipient)) {
                        await toast.promise(onchainService.transferUSDC(walletClient, recipient, amountVal), {
                            loading: 'Transferring to Recipient...',
                            success: 'Transfer successful!',
                            error: 'Transfer failed'
                        });
                    }
                }
            }

            if (walletAddress) await usePortfolioStore.getState().refreshAll(walletAddress);
            closeDepositModal();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Transaction failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleMaxClick = () => {
        if (maxAllowed > 0) {
            setAmount(maxAllowed.toString());
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeDepositModal()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {isRefill ? (subTab === 'in' ? 'Refill Credits' : 'Unrefill Credits') : (subTab === 'in' ? 'Deposit' : 'Withdraw')}
                    </h2>
                    <button className={styles.closeButton} onClick={closeDepositModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${subTab === 'in' ? styles.activeTab : ''}`}
                            onClick={() => setSubTab('in')}
                        >
                            {isRefill ? 'Refill' : 'Deposit'}
                        </button>
                        <button
                            className={`${styles.tab} ${subTab === 'out' ? styles.activeTab : ''}`}
                            onClick={() => setSubTab('out')}
                        >
                            {isRefill ? 'Unrefill' : 'Withdraw'}
                        </button>
                    </div>

                    <div className={styles.amountContainer}>
                        <div className={styles.amountHeader}>
                            <span>Amount</span>
                            <div className={styles.balanceLabel}>
                                {loading ? <span>Loading...</span> : (
                                    <span>
                                        {isRefill
                                            ? `${(subTab === 'in' ? availableBalance : aiBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available`
                                            : `${(subTab === 'in' ? walletUSDCBalance : availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available`
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
                                <TokenIcon symbol="USDC" size={24} className={styles.assetIcon} />
                                <span className={styles.assetName}>USDC/BASE</span>
                            </div>
                        </div>
                    </div>

                    {subTab === 'out' && !isRefill && (
                        <div className={styles.recipientContainer} style={{ marginTop: '16px' }}>
                            <div className={styles.amountHeader} style={{ marginBottom: '8px' }}>
                                <span>Withdraw to (Optional)</span>
                            </div>
                            <input
                                type="text"
                                className={styles.amountInput}
                                style={{ fontSize: '16px', padding: '12px', width: '100%', background: '#1A1D25', border: '1px solid #333', borderRadius: '8px' }}
                                placeholder="Wallet Address (0x...)"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                            />
                        </div>
                    )}

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>
                            {isRefill ? (subTab === 'in' ? 'Refill Method' : 'Unrefill Method') : (subTab === 'in' ? 'Deposit method' : 'Withdraw method')}
                        </span>
                        <span className={styles.infoValue}>
                            {isRefill ? (
                                subTab === 'in'
                                    ? <><span style={{ color: '#A77590' }}>Vault</span> → <span style={{ color: '#00E396' }}>AI</span></>
                                    : <><span style={{ color: '#A77590' }}>AI</span> → <span style={{ color: '#00E396' }}>Vault</span></>
                            ) : 'Instant'}
                        </span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>
                            {isRefill ? 'Current AI Credits' : 'Vault Balance'}
                        </span>
                        <span className={styles.infoValue}>
                            ${(isRefill ? aiBalance : vaultBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <button
                        className={`${styles.actionButton} ${!isFormValid || processing ? styles.disabledButton : ''}`}
                        disabled={!isFormValid || processing}
                        onClick={handleAction}
                    >
                        {processing ? 'Processing...' : (
                            isRefill ? (subTab === 'in' ? 'Refill Credits' : 'Unrefill Credits') : (subTab === 'in' ? 'Deposit funds' : 'Withdraw funds')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

