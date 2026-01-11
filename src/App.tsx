import React, { useState } from 'react';
import { Navbar } from './components';
import { AppRouter } from './router'; // Keeping import just in case, or remove if unused

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname === '/' ? '/trade' : window.location.pathname);

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navItems = [
    { label: 'Trade', href: '/trade', isActive: currentRoute === '/trade' || currentRoute === '/autos' },
    { label: 'Portfolio', href: '/portfolio', isActive: currentRoute.startsWith('/portfolio') },

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
    </div>
  );
}

export default App;