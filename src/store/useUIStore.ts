import { create } from 'zustand';

export interface PositionData {
    id: string;
    symbol: string;
    pair: string;
    side: 'Long' | 'Short';
    size: number;
    sizeUsd: number;
    leverage: string;
    entryPrice: number;
    markPrice: number;
    liquidationPrice: number | null;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    margin: number;
    funding: number;
    tp?: number | string;
    sl?: number | string;
}

interface UIStore {
    isDepositModalOpen: boolean;
    modalMode: 'deposit' | 'refill';
    openDepositModal: (mode?: 'deposit' | 'refill') => void;
    closeDepositModal: () => void;

    // Position Modal State
    selectedPosition: PositionData | null;
    isReverseModalOpen: boolean;
    openReverseModal: (position: PositionData) => void;
    closeReverseModal: () => void;

    isMarketCloseModalOpen: boolean;
    openMarketCloseModal: (position: PositionData) => void;
    closeMarketCloseModal: () => void;

    isTPSLModalOpen: boolean;
    openTPSLModal: (position: PositionData) => void;
    closeTPSLModal: () => void;

    isCloseAllModalOpen: boolean;
    openCloseAllModal: () => void;
    closeCloseAllModal: () => void;

    isLimitCloseModalOpen: boolean;
    openLimitCloseModal: (position: PositionData) => void;
    closeLimitCloseModal: () => void;

    isFaucetModalOpen: boolean;
    openFaucetModal: () => void;
    closeFaucetModal: () => void;

    isSessionModalOpen: boolean;
    openSessionModal: () => void;
    closeSessionModal: () => void;

    isTradingSetupOpen: boolean;
    openTradingSetup: () => void;
    closeTradingSetup: () => void;

    hasSession: boolean;
    setHasSession: (status: boolean) => void;

    isSessionChecking: boolean;
    setSessionChecking: (loading: boolean) => void;

    // Order Modal State
    selectedOrder: any | null;
    isCancelOrderModalOpen: boolean;
    openCancelOrderModal: (order: any) => void;
    closeCancelOrderModal: () => void;

    isCancelAllOrdersModalOpen: boolean;
    openCancelAllOrdersModal: () => void;
    closeCancelAllOrdersModal: () => void;

    isEnterCodeModalOpen: boolean;
    openEnterCodeModal: () => void;
    closeEnterCodeModal: () => void;

    isCreateCodeModalOpen: boolean;
    openCreateCodeModal: () => void;
    closeCreateCodeModal: () => void;

    isClaimRewardsModalOpen: boolean;
    openClaimRewardsModal: () => void;
    closeClaimRewardsModal: () => void;

    isShareLinkModalOpen: boolean;
    openShareLinkModal: () => void;
    closeShareLinkModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isDepositModalOpen: false,
    modalMode: 'deposit',
    openDepositModal: (mode = 'deposit') => set({ isDepositModalOpen: true, modalMode: mode }),
    closeDepositModal: () => set({ isDepositModalOpen: false }),

    // Position Modals
    selectedPosition: null,
    isReverseModalOpen: false,
    openReverseModal: (position) => set({ isReverseModalOpen: true, selectedPosition: position }),
    closeReverseModal: () => set({ isReverseModalOpen: false, selectedPosition: null }),

    isMarketCloseModalOpen: false,
    openMarketCloseModal: (position) => set({ isMarketCloseModalOpen: true, selectedPosition: position }),
    closeMarketCloseModal: () => set({ isMarketCloseModalOpen: false, selectedPosition: null }),

    isTPSLModalOpen: false,
    openTPSLModal: (position) => set({ isTPSLModalOpen: true, selectedPosition: position }),
    closeTPSLModal: () => set({ isTPSLModalOpen: false, selectedPosition: null }),

    isCloseAllModalOpen: false,
    openCloseAllModal: () => set({ isCloseAllModalOpen: true }),
    closeCloseAllModal: () => set({ isCloseAllModalOpen: false }),

    isLimitCloseModalOpen: false,
    openLimitCloseModal: (position) => set({ isLimitCloseModalOpen: true, selectedPosition: position }),
    closeLimitCloseModal: () => set({ isLimitCloseModalOpen: false, selectedPosition: null }),

    isFaucetModalOpen: false,
    openFaucetModal: () => set({ isFaucetModalOpen: true }),
    closeFaucetModal: () => set({ isFaucetModalOpen: false }),

    isSessionModalOpen: false,
    openSessionModal: () => set({ isSessionModalOpen: true }),
    closeSessionModal: () => set({ isSessionModalOpen: false }),

    isTradingSetupOpen: false,
    openTradingSetup: () => set({ isTradingSetupOpen: true }),
    closeTradingSetup: () => set({ isTradingSetupOpen: false }),

    hasSession: false,
    setHasSession: (status) => set({ hasSession: status }),

    isSessionChecking: true, // Default true to prevent flash
    setSessionChecking: (loading) => set({ isSessionChecking: loading }),

    // Order Modals
    selectedOrder: null,
    isCancelOrderModalOpen: false,
    openCancelOrderModal: (order) => set({ isCancelOrderModalOpen: true, selectedOrder: order }),
    closeCancelOrderModal: () => set({ isCancelOrderModalOpen: false, selectedOrder: null }),

    isCancelAllOrdersModalOpen: false,
    openCancelAllOrdersModal: () => set({ isCancelAllOrdersModalOpen: true }),
    closeCancelAllOrdersModal: () => set({ isCancelAllOrdersModalOpen: false }),

    isEnterCodeModalOpen: false,
    openEnterCodeModal: () => set({ isEnterCodeModalOpen: true }),
    closeEnterCodeModal: () => set({ isEnterCodeModalOpen: false }),

    isCreateCodeModalOpen: false,
    openCreateCodeModal: () => set({ isCreateCodeModalOpen: true }),
    closeCreateCodeModal: () => set({ isCreateCodeModalOpen: false }),

    isClaimRewardsModalOpen: false,
    openClaimRewardsModal: () => set({ isClaimRewardsModalOpen: true }),
    closeClaimRewardsModal: () => set({ isClaimRewardsModalOpen: false }),

    isShareLinkModalOpen: false,
    openShareLinkModal: () => set({ isShareLinkModalOpen: true }),
    closeShareLinkModal: () => set({ isShareLinkModalOpen: false }),
}));
