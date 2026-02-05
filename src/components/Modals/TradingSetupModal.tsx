import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { onchainService } from '../../api/onchainService';
import toast from 'react-hot-toast';
import styles from './DepositModal.module.css'; // Consistent styling with SessionKey
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

interface TradingSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TradingSetupModal: React.FC<TradingSetupModalProps> = ({ isOpen, onClose }) => {
    const { walletAddress } = useWallet();
    const { wallets } = useWallets();

    // Status
    const [loading, setLoading] = useState(true);
    const [roleGranted, setRoleGranted] = useState(false);
    const [allowanceOk, setAllowanceOk] = useState(false);

    // Actions
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial Check
    useEffect(() => {
        if (isOpen && walletAddress) {
            checkStatus();
        }
    }, [isOpen, walletAddress]);

    const checkStatus = async () => {
        setLoading(true);
        try {
            if (!walletAddress) return;
            const status = await onchainService.checkTradingSetup(walletAddress);
            setRoleGranted(status.roleGranted);
            // Check if allowance > 100 USDC
            setAllowanceOk(status.allowance > 1_000_000_00n);
        } catch (e) {
            console.error(e);
            toast.error("Failed to check trading status");
        } finally {
            setLoading(false);
        }
    };

    const getWalletClient = async () => {
        const activeWallet = wallets.find(w => w.address.toLowerCase() === walletAddress?.toLowerCase());
        if (!activeWallet) throw new Error("Wallet not connected");

        await activeWallet.switchChain(421614);
        const provider = await activeWallet.getEthereumProvider();
        return createWalletClient({
            account: walletAddress as `0x${string}`,
            chain: arbitrumSepolia,
            transport: custom(provider)
        });
    };

    const handleAction = async () => {
        if (!roleGranted) {
            setIsProcessing(true);
            try {
                console.log('[TradingSetup] Getting wallet client...');
                const client = await getWalletClient();
                console.log('[TradingSetup] Wallet client:', client);
                console.log('[TradingSetup] Calling grantOrderRouterRole...');
                const tx = await onchainService.grantOrderRouterRole(client);
                console.log('[TradingSetup] Transaction hash:', tx);
                toast.loading("Granting Role...", { id: 'setup-flow' });
                await onchainService.waitForTransaction(tx);
                toast.success("Role Granted!", { id: 'setup-flow' });

                // Optimistic update
                setRoleGranted(true);
                await checkStatus(); // Re-verify
            } catch (e: any) {
                console.error(e);
                const errMsg = e.message || e.toString() || "Unknown";

                // Detect common errors
                if (errMsg.includes('insufficient funds') || errMsg.includes('gas')) {
                    toast.error("Insufficient ETH for gas. Please claim ETH from Arbitrum Sepolia faucet.", { id: 'setup-flow', duration: 5000 });
                } else if (errMsg.includes('user rejected') || errMsg.includes('denied')) {
                    toast.error("Transaction rejected", { id: 'setup-flow' });
                } else {
                    toast.error("Grant Failed: " + errMsg, { id: 'setup-flow', duration: 5000 });
                }
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        if (!allowanceOk) {
            setIsProcessing(true);
            try {
                const client = await getWalletClient();
                const tx = await onchainService.approveUSDC(client);
                toast.loading("Approving USDC...", { id: 'setup-flow' });
                await onchainService.waitForTransaction(tx);
                toast.success("USDC Approved!", { id: 'setup-flow' });

                // Optimistic update
                setAllowanceOk(true);
                await checkStatus(); // Re-verify
            } catch (e: any) {
                console.error(e);
                const errMsg = e.message || e.toString() || "Unknown";

                // Detect common errors
                if (errMsg.includes('insufficient funds') || errMsg.includes('gas')) {
                    toast.error("Insufficient ETH for gas. Please claim ETH from Arbitrum Sepolia faucet.", { id: 'setup-flow', duration: 5000 });
                } else if (errMsg.includes('user rejected') || errMsg.includes('denied')) {
                    toast.error("Transaction rejected", { id: 'setup-flow' });
                } else {
                    toast.error("Approval Failed: " + errMsg, { id: 'setup-flow', duration: 5000 });
                }
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // Success -> Close
        onClose();
    };

    // Auto-close logic? User might want to see confirmation.

    // Derived State
    const step = !roleGranted ? 'role' : !allowanceOk ? 'allowance' : 'success';

    const getButtonText = () => {
        if (loading) return 'Checking...';
        if (isProcessing) return 'Processing...';
        if (step === 'role') return 'Grant Access (Step 1)';
        if (step === 'allowance') return 'Approve USDC (Step 2)';
        return 'Start Trading'; // Success
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} style={{ maxWidth: '400px' }}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Account Setup</h2>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <p style={{ color: '#A77590', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                        Prepare your wallet for autonomous trading. This is a one-time process.
                    </p>

                    {/* Step Indicators */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>

                        {/* Step 1: Role (Only show if needed or completed) */}
                        <div style={{ display: 'flex', alignItems: 'center', opacity: roleGranted ? 0.5 : 1 }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: roleGranted ? '#00E396' : (step === 'role' ? '#FF4560' : '#3A2530'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px',
                                fontSize: '12px', fontWeight: 'bold'
                            }}>
                                {roleGranted ? '✓' : '1'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#FFE1F2', fontWeight: 500 }}>Grant Permissions</div>
                                <div style={{ fontSize: '12px', color: '#A77590' }}>Allow OrderRouter to execute trades</div>
                            </div>
                        </div>

                        {/* Step 2: Allowance */}
                        <div style={{ display: 'flex', alignItems: 'center', opacity: allowanceOk ? 0.5 : (step === 'allowance' ? 1 : 0.5) }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: allowanceOk ? '#00E396' : (step === 'allowance' ? '#FF4560' : '#3A2530'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px',
                                fontSize: '12px', fontWeight: 'bold'
                            }}>
                                {allowanceOk ? '✓' : '2'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#FFE1F2', fontWeight: 500 }}>Approve USDC</div>
                                <div style={{ fontSize: '12px', color: '#A77590' }}>Enable margin deposits</div>
                            </div>
                        </div>

                    </div>

                    <button
                        className={styles.actionButton}
                        onClick={handleAction}
                        disabled={loading || isProcessing}
                        style={{
                            background: step === 'success' ? '#00E396' : undefined,
                            color: step === 'success' ? '#000' : undefined
                        }}
                    >
                        {getButtonText()}
                    </button>

                    {step !== 'success' && (
                        <div style={{ textAlign: 'center', marginTop: '12px' }}>
                            <button
                                style={{
                                    background: 'transparent', border: 'none', color: '#553344',
                                    fontSize: '12px', cursor: 'pointer', textDecoration: 'underline'
                                }}
                                onClick={onClose}
                            >
                                I'll do this later
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
