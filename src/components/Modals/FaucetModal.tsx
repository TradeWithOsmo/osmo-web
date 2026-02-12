import React, { useState, useEffect } from 'react';
import styles from './DepositModal.module.css'; // Reusing DepositModal styles for consistency
import { useUIStore } from '../../store/useUIStore';
import usdcArbIcon from '../../assets/deposited chain/USDCARB.png';
import { useWallet } from '../../hooks/useWallet';
import { onchainService, CONTRACTS } from '../../api/onchainService';
import toast from 'react-hot-toast';
import { createWalletClient, custom } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

export const FaucetModal: React.FC = () => {
    const { isFaucetModalOpen, closeFaucetModal } = useUIStore();
    const { authenticated, walletAddress, wallets, handleSwitchToTargetChain } = useWallet();
    const [amount, setAmount] = useState('1000');
    const [isClaiming, setIsClaiming] = useState(false);
    const [destination, setDestination] = useState<'wallet' | 'ai_vault'>('wallet');

    useEffect(() => {
        if (isFaucetModalOpen) {
            document.body.style.overflow = 'hidden';
            setAmount('1000'); // Default amount
            setIsClaiming(false);
            setDestination('wallet');
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFaucetModalOpen]);

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
                        Mint testnet tokens to start trading on Osmo. You can drip up to 1,000 USDC every 24 hours.
                    </p>

                    {/* Destination Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#0A0005', padding: '4px', borderRadius: '8px', border: '1px solid #3A2530' }}>
                        <button
                            onClick={() => setDestination('wallet')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                background: destination === 'wallet' ? '#3A2530' : 'transparent',
                                color: destination === 'wallet' ? '#FFE1F2' : '#A77590',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            My Wallet
                        </button>
                        <button
                            onClick={() => setDestination('ai_vault')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                background: destination === 'ai_vault' ? '#3A2530' : 'transparent',
                                color: destination === 'ai_vault' ? '#FFE1F2' : '#A77590',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            AI Vault Credits
                        </button>
                    </div>

                    {/* Amount Input */}
                    <div className={styles.amountContainer}>
                        <div className={styles.amountHeader}>
                            <span>Amount to Drip</span>
                            <div className={styles.balanceLabel}>
                                <span style={{ color: '#A77590' }}>Max Drip: 1,000</span>
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
                                <span className={styles.assetName} style={{ fontSize: '16px', fontWeight: 600 }}>USDC</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoRow} style={{ marginTop: '24px' }}>
                        <span className={styles.infoLabel}>Network</span>
                        <div className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={usdcArbIcon} alt="ARB" style={{ width: '20px', height: '20px' }} />
                            <span>Arbitrum Sepolia</span>
                        </div>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Destination</span>
                        <span className={styles.infoValue} style={{ color: '#FFE1F2' }}>
                            {destination === 'wallet' ? 'Your Wallet Address' : 'AI Vault Contract'}
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
                                    chain: arbitrumSepolia,
                                    transport: custom(provider)
                                });

                                // Determine recipient
                                const recipient = destination === 'wallet' ? walletAddress : (CONTRACTS.AIVault as string);

                                if (!recipient) {
                                    throw new Error("Invalid destination address");
                                }

                                const result = await onchainService.claimFaucetOnChain(walletClient, recipient, parseFloat(amount));
                                if (result.success || result.tx_hash) {
                                    toast.success(`Successfully claimed ${parseFloat(amount).toLocaleString()} USDC to ${destination === 'wallet' ? 'your wallet' : 'AI Vault'}!`);
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

                    {destination === 'ai_vault' && (
                        <p style={{ marginTop: '12px', fontSize: '11px', color: '#A77590', textAlign: 'center' }}>
                            Note: Drip to AI Vault will increase your AI credits for autonomous trading.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
