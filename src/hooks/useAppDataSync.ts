import { useEffect, useRef } from 'react';

import { useWallet } from './useWallet';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useUsageStore } from '../store/useUsageStore';
import { useLeaderboardStore } from '../store/useLeaderboardStore';
import { useArenaStore } from '../store/useArenaStore';

export function useAppDataSync() {
  const { authenticated, walletAddress } = useWallet();
  const stopSyncTimeoutRef = useRef<number | null>(null);
  const normalizedWallet = walletAddress ? walletAddress.toLowerCase() : '';

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
    if (!authenticated || !normalizedWallet) {
      // Grace period prevents brief wallet/auth flickers from tearing down WS repeatedly.
      if (stopSyncTimeoutRef.current) {
        window.clearTimeout(stopSyncTimeoutRef.current);
      }
      stopSyncTimeoutRef.current = window.setTimeout(() => {
        usePortfolioStore.getState().stopGlobalSync();
        useUsageStore.getState().stopGlobalSync();
        stopSyncTimeoutRef.current = null;
      }, 5000);
      return;
    }

    if (stopSyncTimeoutRef.current) {
      window.clearTimeout(stopSyncTimeoutRef.current);
      stopSyncTimeoutRef.current = null;
    }

    usePortfolioStore.getState().startGlobalSync(normalizedWallet);
    useUsageStore.getState().startGlobalSync(normalizedWallet);

    return () => {
      // no-op cleanup; sync lifecycle is handled by stable state transitions above
    };
  }, [authenticated, normalizedWallet]);

  // Arena: keep leaderboard warm always; only sync on-chain bits when wallet is connected.
  useEffect(() => {
    if (authenticated && normalizedWallet) {
      useArenaStore.getState().startGlobalSync(normalizedWallet);
    } else {
      useArenaStore.getState().startGlobalSync();
    }
  }, [authenticated, normalizedWallet]);

  useEffect(() => {
    return () => {
      if (stopSyncTimeoutRef.current) {
        window.clearTimeout(stopSyncTimeoutRef.current);
        stopSyncTimeoutRef.current = null;
      }
    };
  }, []);
}
