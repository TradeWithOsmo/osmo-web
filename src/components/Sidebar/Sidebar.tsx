import React, { useState } from 'react'
import { Menu, X, TrendingUp, BarChart3, PieChart, User, Trophy, Star, Settings } from 'lucide-react'
import styles from './Sidebar.module.css'

export interface SidebarItem {
  icon: React.ReactNode
  label: string
  href: string
  isActive?: boolean
}

export interface SidebarProps {
  items?: SidebarItem[]
  onItemClick?: (href: string) => void
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  items = [],
  onItemClick,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true) // Default: collapsed/closed

  const sidebarItems: SidebarItem[] = [
    {
      icon: <TrendingUp size={20} />,
      label: 'Trade',
      href: '/trade',
      isActive: true,
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Market',
      href: '/market',
    },
    {
      icon: <PieChart size={20} />,
      label: 'Portfolio',
      href: '/portfolio',
    },
    {
      icon: <Trophy size={20} />,
      label: 'Leaderboard',
      href: '/leaderboard',
    },
    {
      icon: <Star size={20} />,
      label: 'Points',
      href: '/points',
    },
    {
      icon: <Settings size={20} />,
      label: 'Settings',
      href: '/settings',
    },
  ]

  const finalItems = items.length > 0 ? items : sidebarItems

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${isCollapsed ? styles.collapsed : ''}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Open Sidebar' : 'Close Sidebar'}
      >
        {isCollapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${className}`}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <img 
            src="/Logos/Osmo-Logos.png" 
            alt="Logo" 
            className={styles.logo}
          />
          {!isCollapsed && <span className={styles.logoText}>Osmo</span>}
        </div>

        {/* Navigation Items */}
        <nav className={styles.navigation}>
          {finalItems.map((item) => (
            <button
              key={item.href}
              className={`${styles.navItem} ${item.isActive ? styles.active : ''}`}
              onClick={() => {
                onItemClick?.(item.href)
                // Auto-close on mobile after selection
                if (window.innerWidth < 768) {
                  setIsCollapsed(true)
                }
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!isCollapsed && <span className={styles.label}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                <User size={24} />
              </div>
              <div className={styles.userDetails}>
                <span className={styles.username}>Trader</span>
                <span className={styles.walletAddress}>0x1234...5678</span>
              </div>
            </div>
          )}
          
          <button
            className={styles.profileButton}
            onClick={() => console.log('Profile clicked')}
            title={isCollapsed ? 'Profile' : undefined}
          >
            <User size={20} />
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && window.innerWidth < 768 && (
        <div 
          className={styles.overlay}
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  )
}

export default Sidebar