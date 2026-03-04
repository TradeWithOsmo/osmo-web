import React, { useState, useEffect } from 'react';
import styles from './DepositModal.module.css'; // Reusing DepositModal styles for consistency
import { useUIStore } from '../../store/useUIStore';
import TokenIcon from '../MarketDetails/TokenIcon';
import { useWallet } from '../../hooks/useWallet';
import { onchainService } from '../../api/onchainService';
import toast from 'react-hot-toast';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';

export const FaucetModal: React.FC = () => {
    const { isFaucetModalOpen, closeFaucetModal } = useUIStore();
    const { authenticated, walletAddress, wallets, handleSwitchToTargetChain } = useWallet();
    const [amount, setAmount] = useState('1000');
    const [isClaiming, setIsClaiming] = useState(false);
    const [dripAmountText, setDripAmountText] = useState<string>('');

    const shortenAddress = (addr?: string) => {
        const a = String(addr || '');
        if (!a) return '';
        if (a.length <= 12) return a;
        return `${a.slice(0, 6)}...${a.slice(-4)}`;
    };

    useEffect(() => {
        if (isFaucetModalOpen) {
            document.body.style.overflow = 'hidden';
            setAmount(''); // Will be populated from on-chain dripAmount when available
            setDripAmountText('');
            setIsClaiming(false);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFaucetModalOpen]);

    useEffect(() => {
        if (!isFaucetModalOpen || !walletAddress) return;
        let cancelled = false;
        (async () => {
            try {
                const st = await onchainService.getFaucetStatusOnChain(walletAddress);
                const amt = Number(st.drip_amount) / 1_000_000;
                if (!cancelled) {
                    setAmount(String(amt));
                    setDripAmountText(amt.toLocaleString());
                }
            } catch (e) {
                // Non-fatal; UI can still attempt claim and surface error.
                if (!cancelled) {
                    setAmount('');
                    setDripAmountText('');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isFaucetModalOpen, walletAddress]);

    if (!isFaucetModalOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeFaucetModal();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal} style={{ maxWidth: '480px' }}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Testnet Faucet</h2>
                    <button className={styles.closeButton} onClick={closeFaucetModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <p style={{ color: '#A77590', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                        Mint testnet tokens to start trading on Osmo. The faucet drips a fixed amount (up to 1,000 USDC) every 24 hours.
                    </p>

                    {/* Amount Input */}
                    <div className={styles.amountContainer}>
                        <div className={styles.amountHeader}>
                            <span>Amount to Drip</span>
                            <div className={styles.balanceLabel}>
                                <span style={{ color: '#A77590' }}>Fixed: {dripAmountText || '...'} USDC</span>
                            </div>
                        </div>
                        <div className={styles.inputRow}>
                            <input
                                type="text"
                                className={styles.amountInput}
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled
                            />
                            <div className={styles.assetSelector}>
                                <span className={styles.assetName} style={{ fontSize: '16px', fontWeight: 600 }}>USDC</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoRow} style={{ marginTop: '24px' }}>
                        <span className={styles.infoLabel}>Network</span>
                        <div className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TokenIcon symbol="ETH" size={20} />
                            <span>Base Sepolia</span>
                        </div>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Destination</span>
                        <span
                            className={styles.infoValue}
                            style={{ color: '#FFE1F2', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}
                            title={walletAddress || ''}
                        >
                            {walletAddress ? shortenAddress(walletAddress) : 'Connect wallet'}
                        </span>
                    </div>

                    {/* Action Button */}
                    <button
                        className={styles.actionButton}
                        style={{ marginTop: '32px', opacity: isClaiming || !authenticated ? 0.7 : 1 }}
                        disabled={isClaiming}
                        onClick={async () => {
                            if (!authenticated || !walletAddress) {
                                toast.error('Please connect your wallet first');
                                return;
                            }

                            // Get provider
                            const wallet = wallets[0];
                            if (!wallet) {
                                toast.error('No wallet connected');
                                return;
                            }

                            setIsClaiming(true);
                            try {
                                await handleSwitchToTargetChain();

                                const provider = await wallet.getEthereumProvider();
                                const walletClient = createWalletClient({
                                    account: walletAddress as `0x${string}`,
                                    chain: baseSepolia,
                                    transport: custom(provider)
                                });

                                const result = await onchainService.claimFaucetOnChain(walletClient, walletAddress, 0);
                                if (result.success || result.tx_hash) {
                                    const claimed = result?.drip_amount ? (Number(result.drip_amount) / 1_000_000) : parseFloat(amount || '0');
                                    toast.success(`Successfully claimed ${claimed.toLocaleString()} USDC to your wallet!`);
                                    closeFaucetModal();
                                }
                            } catch (error: any) {
                                console.error(error);
                                toast.error(error.message || 'Failed to claim faucet');
                            } finally {
                                setIsClaiming(false);
                            }
                        }}
                    >
                        {isClaiming ? 'Dripping Tokens...' : !authenticated ? 'Connect Wallet' : 'Drip Tokens'}
                    </button>
                </div>
            </div>
        </div>
    );
};
