import React, { useState } from 'react';
import { Navbar } from './components';
import { AppRouter } from './router';
import { useGlobalMarketStream } from './hooks/useGlobalMarketStream';
import { useSelectedMarketRealtime } from './hooks/useSelectedMarketRealtime';
import { useTokenListStore } from './store/useTokenListStore';
import { Toaster } from 'react-hot-toast';
import { DepositModal, ReversePositionModal, MarketCloseModal, TPSLModal, CloseAllModal, LimitCloseModal, SessionKeyModal, FaucetModal, TradingSetupModal, CancelOrderModal, CancelAllOrdersModal, EnterCodeModal, CreateCodeModal, ClaimRewardsModal, ShareLinkModal } from './components/Modals';
import { useWallet } from './hooks/useWallet';
import { useUIStore } from './store/useUIStore';
import { onchainService } from './api/onchainService';
import { useAppDataSync } from './hooks/useAppDataSync';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname === '/' ? '/trade' : window.location.pathname);
  const { isSessionModalOpen, openSessionModal, closeSessionModal, hasSession, setHasSession, isTradingSetupOpen, openTradingSetup, closeTradingSetup, isSessionChecking, setSessionChecking } = useUIStore();
  const { authenticated, walletAddress } = useWallet();

  // Enable global real-time market data stream
  useGlobalMarketStream();
  useSelectedMarketRealtime();
  useAppDataSync();

  const { fetchTokenList } = useTokenListStore();

  React.useEffect(() => {
    fetchTokenList();

    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchTokenList]);

  // Check Trading Setup (Allowance) -> Only if Session exists
  React.useEffect(() => {
    if (authenticated && walletAddress && hasSession && !isSessionChecking) {
      onchainService.checkTradingSetup(walletAddress).then(status => {
        const allowanceOk = status.allowance > 100_000_000n; // >100 USDC
        const roleAndAllowanceOk = status.roleGranted && allowanceOk;

        if (!roleAndAllowanceOk) {
          console.log('[App] Trading setup needed (Role or Allowance missing)');
          openTradingSetup();
        }
      });
    }
  }, [authenticated, walletAddress, hasSession, isSessionChecking]);

  // Check for session key
  React.useEffect(() => {
    const checkSession = async () => {
      setSessionChecking(true);

      // If not authenticated, we don't need to check.
      if (!authenticated || !walletAddress) {
        closeSessionModal();
        setHasSession(false);
        setSessionChecking(false);
        return;
      }

      const key = localStorage.getItem('osmo_session_key');
      const expires = localStorage.getItem('osmo_session_expires');

      // 1. Check LocalStorage first
      if (key && expires && new Date(expires) > new Date()) {
        setHasSession(true);
        setSessionChecking(false); // Locally valid

        // Background verify to handle DB clears/revocation
        onchainService.getActiveSession(walletAddress).then(session => {
          if (!session.has_session) {
            console.warn('[App] Local session invalid on backend. Clearing.');
            localStorage.removeItem('osmo_session_key');
            localStorage.removeItem('osmo_session_address');
            localStorage.removeItem('osmo_session_expires');
            setHasSession(false);
            openSessionModal();
          }
        }).catch(err => console.error('[App] Background session check failed', err));

        return; // Valid session exists locally
      }

      // 2. If no local, check backend BEFORE showing modal
      /* 
      // DISABLED: Do not trust backend session state for now to avoid stale contract address issues.
      try {
        const session = await onchainService.getActiveSession(walletAddress);
        if (session.has_session) {
          // Restore quietly
          console.log('[App] Session restored from backend', session); // Debug log
          localStorage.setItem('osmo_session_key', session.session_private_key);
          localStorage.setItem('osmo_session_address', session.session_address);

          let expiryDate;
          if (session.expires_at) {
            expiryDate = new Date(session.expires_at);
          } else if (session.expires_in) {
            expiryDate = new Date(Date.now() + session.expires_in * 1000);
          } else {
            // Default to 24h
            expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          }

          localStorage.setItem('osmo_session_expires', expiryDate.toISOString());
          setHasSession(true);
          setSessionChecking(false);

          return; // Don't show modal
        }
      } catch (e) {
        console.error('[App] Failed to check session', e);
      }
      */

      // 3. If truly no session, show modal
      // 3. If truly no session, do NOT auto-open modal on first load.
      // Let the user click "Establish Connection" button to open it.
      setHasSession(false);
      setSessionChecking(false);
      // openSessionModal(); // Removed auto-open
    };

    checkSession();
  }, [authenticated, walletAddress]);

  const navItems = [
    { label: 'Trade', href: '/trade', isActive: currentRoute.startsWith('/trade') },
    { label: 'Portfolio', href: '/portfolio', isActive: currentRoute.startsWith('/portfolio') },
    { label: 'Usage', href: '/usage', isActive: currentRoute.startsWith('/usage') },
    { label: 'Arena', href: '/arena', isActive: currentRoute === '/arena' },
    { label: 'Refer', href: '/refer', isActive: currentRoute === '/refer' },
    {
      label: 'More',
      href: '#',
      isActive: false,
      submenu: [
        { label: 'Faucet', href: '/faucet', isActive: currentRoute.startsWith('/faucet') },
        { label: 'Leaderboard', href: '/leaderboard', isActive: currentRoute === '/leaderboard' },
        { label: 'Docs', href: '/docs', isActive: currentRoute.startsWith('/docs') },
      ]
    },
  ];

  const handleNavClick = (href: string) => {
    if (href === '#') return;
    if (href === '/docs' || href.startsWith('/docs')) {
      window.location.href = href;
      return;
    }
    window.history.pushState({}, '', href);
    setCurrentRoute(href);
  };

  return (
    <div style={{ backgroundColor: '#12000A', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        navItems={navItems}
        onNavClick={handleNavClick}
      />
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppRouter route={currentRoute} />
      </div>
      <DepositModal />
      <ReversePositionModal />
      <MarketCloseModal />
      <TPSLModal />
      <CloseAllModal />
      <LimitCloseModal />
      <FaucetModal />

      <SessionKeyModal
        isOpen={isSessionModalOpen}
        onClose={closeSessionModal}
      />
      <TradingSetupModal
        isOpen={isTradingSetupOpen}
        onClose={closeTradingSetup}
      />
      <CancelOrderModal />
      <CancelAllOrdersModal />
      <EnterCodeModal />
      <CreateCodeModal />
      <ClaimRewardsModal />
      <ShareLinkModal />
      <Toaster position="top-right" toastOptions={{ style: { background: '#12000A', color: '#FFE1F2', border: '1px solid #3A2530' } }} />
    </div>
  );
}

export default App;
