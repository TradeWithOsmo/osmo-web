import { useEffect } from 'react';

import { useWallet } from './useWallet';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useUsageStore } from '../store/useUsageStore';
import { useLeaderboardStore } from '../store/useLeaderboardStore';
import { useArenaStore } from '../store/useArenaStore';

export function useAppDataSync() {
  const { authenticated, walletAddress } = useWallet();

  // Global, public pages: keep these warm/realtime even if user is not logged in.
  useEffect(() => {
    useLeaderboardStore.getState().startGlobalSync();
    useArenaStore.getState().startGlobalSync(); // leaderboard-only until wallet is available
    return () => {
      useLeaderboardStore.getState().stopGlobalSync();
      useArenaStore.getState().stopGlobalSync();
    };
  }, []);

  // Wallet-bound data: start once from root so page/tab switches don't trigger refetch loops.
  useEffect(() => {
    if (!authenticated || !walletAddress) {
      usePortfolioStore.getState().stopGlobalSync();
      useUsageStore.getState().stopGlobalSync();
      return;
    }

    usePortfolioStore.getState().startGlobalSync(walletAddress);
    useUsageStore.getState().startGlobalSync(walletAddress);

    return () => {
      usePortfolioStore.getState().stopGlobalSync();
      useUsageStore.getState().stopGlobalSync();
    };
  }, [authenticated, walletAddress]);

  // Arena: keep leaderboard warm always; only sync on-chain bits when wallet is connected.
  useEffect(() => {
    if (authenticated && walletAddress) {
      useArenaStore.getState().startGlobalSync(walletAddress);
    } else {
      useArenaStore.getState().startGlobalSync();
    }
  }, [authenticated, walletAddress]);
}
