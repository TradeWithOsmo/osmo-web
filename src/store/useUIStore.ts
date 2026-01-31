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
}));
