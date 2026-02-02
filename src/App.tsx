import React, { useState } from 'react';
import { Navbar } from './components';
import { AppRouter } from './router';
import { useGlobalMarketStream } from './hooks/useGlobalMarketStream';
import { useTokenListStore } from './store/useTokenListStore';
import { DepositModal, ReversePositionModal, MarketCloseModal, TPSLModal, CloseAllModal, LimitCloseModal, SessionKeyModal, FaucetModal } from './components/Modals';
import { useWallet } from './hooks/useWallet';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname === '/' ? '/trade' : window.location.pathname);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const { authenticated, walletAddress } = useWallet();

  // Enable global real-time market data stream
  useGlobalMarketStream();

  const { fetchTokenList } = useTokenListStore();

  React.useEffect(() => {
    fetchTokenList();

    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchTokenList]);

  // Check for session key
  React.useEffect(() => {
    if (authenticated && walletAddress) {
      const key = localStorage.getItem('osmo_session_key');
      const expires = localStorage.getItem('osmo_session_expires');

      // If no key or expired, show modal
      if (!key || (expires && new Date(expires) < new Date())) {
        setShowSessionModal(true);
      }
    }
  }, [authenticated, walletAddress]);

  const navItems = [
    { label: 'Trade', href: '/trade', isActive: currentRoute === '/trade' },

    { label: 'Portfolio', href: '/portfolio', isActive: currentRoute.startsWith('/portfolio') },
    { label: 'Usage', href: '/usage', isActive: currentRoute.startsWith('/usage') },
    { label: 'Faucet', href: '/faucet', isActive: currentRoute.startsWith('/faucet') },

    // { label: 'Points', href: '/points', isActive: currentRoute === '/points' },

    { label: 'Leaderboard', href: '/leaderboard', isActive: currentRoute === '/leaderboard' },
  ];

  const handleNavClick = (href: string) => {
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
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
      />
    </div>
  );
}

export default App;