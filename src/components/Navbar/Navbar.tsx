import React from 'react'
import { useWallet, useNavigation } from '../../hooks'
import { useUIStore } from '../../store/useUIStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import styles from './Navbar.module.css'
import notificationIcon from '../../assets/Icons/Notifikasi/Notifications.png'
import notificationBulletIcon from '../../assets/Icons/Notifikasi/Notifications-Bullet.png'
import tradeIcon from '../../assets/Logos-Market-Autos/Osmo-Market.png'
import menuIcon from '../../assets/Icons/Menu/Menu.png'
import closeIcon from '../../assets/Icons/Menu/XSquare.png'
import eventPatternImg from '../../assets/Square-pattern.png'
import osmoLogoIcon from '../../assets/Icons/Osmo-Logos.png'
import TokenIcon from '../MarketDetails/TokenIcon'

export interface NavItem {
  label: string
  href: string
  isActive?: boolean
}

export interface NavbarProps {
  brandText?: string
  navItems?: NavItem[]
  onNavClick?: (href: string) => void
  hasNotifications?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  navItems = [],
  onNavClick,
  hasNotifications = false,
}) => {
  const { openDepositModal } = useUIStore()
  // Wallet hooks
  const {
    ready,
    authenticated,
    walletAddress,
    truncatedAddress,
    isWalletDropdownOpen,
    isWrongChain,
    showDisconnectConfirm,
    setIsWalletDropdownOpen,
    setShowDisconnectConfirm,
    handleConnect,
    handleSwitchToTargetChain,
    handleDisconnect,
    handleCopyAddress,
  } = useWallet()

  // Navigation hooks
  const {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  } = useNavigation()

  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = React.useState(false)
  const togglePortfolioDropdown = () => setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen)

  const [isUsageDropdownOpen, setIsUsageDropdownOpen] = React.useState(false)
  const toggleUsageDropdown = () => setIsUsageDropdownOpen(!isUsageDropdownOpen)

  // Notification Sidebar setup
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [pushState, setPushState] = React.useState<'idle' | 'loading' | 'success'>('idle')
  const {
    notifications,
    browserPushEnabled,
    enableBrowserPush,
    connect: connectNotifications,
    disconnect: disconnectNotifications,
    removeNotification,
    clearAll,
  } = useNotificationStore()

  React.useEffect(() => {
    if (!authenticated || !walletAddress) {
      disconnectNotifications()
      setPushState('idle')
      return
    }
    connectNotifications(walletAddress)
    setPushState(browserPushEnabled ? 'success' : 'idle')
    return () => disconnectNotifications()
  }, [authenticated, walletAddress, browserPushEnabled, connectNotifications, disconnectNotifications])

  const notificationsForUser = React.useMemo(() => {
    const wallet = String(walletAddress || '').toLowerCase();
    if (!wallet) return [];
    return notifications.filter((n) => String(n.userAddress || '').toLowerCase() === wallet);
  }, [notifications, walletAddress])

  const filteredNotifications = notificationsForUser.filter(notif =>
    notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEnablePush = async () => {
    if (!authenticated || !walletAddress) return
    if (pushState === 'loading') return
    if (browserPushEnabled) return
    setPushState('loading')
    const ok = await enableBrowserPush()
    connectNotifications(walletAddress)
    setPushState(ok ? 'success' : 'idle')
  }

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])



  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Menu Icon - Shown on mobile or when no nav items */}
        <div className={styles.menuIconWrapper}>
          <button
            className={styles.iconButton}
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            <img
              src={isMobileMenuOpen ? closeIcon : menuIcon}
              alt={isMobileMenuOpen ? "Close" : "Menu"}
              className={styles.iconImage}
            />
          </button>
          <div className={styles.divider} />
        </div>

        {/* Brand/Logo */}
        <div
          className={styles.brand}
          onClick={() => onNavClick?.('/trade')}
          style={{ cursor: 'pointer' }}
        >
          <img src="/Logos/Osmo-Logos.png" alt="Logo" className={styles.logo} />
        </div>

        {/* Tablet: Trade button next to logo */}
        <div className={styles.tabletTradeDropdown}>
          <div className={styles.divider} />
          <div className={styles.dropdown}>
            <button
              className={`${styles.navItem} ${styles.dropdownToggle}`}
              onClick={() => {
                onNavClick?.('/trade')
                closeMobileMenu()
              }}
              title="Trade"
            >
              <img src={tradeIcon} alt="Trade Mode" className={styles['trade-mode-icon']} />
            </button>
          </div>
        </div>

        {navItems.length > 0 && <div className={styles.divider} />}

        {/* Navigation Items - Desktop */}
        {navItems.length > 0 && (
          <div className={`${styles.navMenu} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
            {navItems.map((item, index) => {
              const DIMMED_OPACITY = 0.5;
              const isTrade = item.label === 'Trade';
              const isDimmed = !authenticated && !isTrade;

              return (
                <React.Fragment key={item.href}>
                  {item.label === 'Trade' ? (
                    <>
                      {/* Desktop: Button with icon */}
                      <div className={`${styles.dropdown} ${styles.desktopOnly}`}>
                        <button
                          className={`${styles.navItem} ${styles.dropdownToggle} ${item.isActive ? styles.active : ''}`}
                          onClick={() => {
                            onNavClick?.('/trade')
                            closeMobileMenu()
                          }}
                          title={item.label}
                        >
                          <img src={tradeIcon} alt="Trade Mode" className={styles['trade-mode-icon']} />
                        </button>
                      </div>
                      {/* Mobile: Single item */}
                      <React.Fragment>
                        <a
                          href="/trade"
                          className={`${styles.navItem} ${styles.mobileOnly}`}
                          onClick={(e) => {
                            e.preventDefault()
                            onNavClick?.('/trade')
                            closeMobileMenu()
                          }}
                          title="Trade"
                        >
                          <span>Trade</span>
                        </a>
                      </React.Fragment>
                    </>
                  ) : item.label === 'Portfolio' ? (
                    <>
                      {/* Mobile: Dropdown */}
                      <button
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''} ${styles.mobileOnly}`}
                        onClick={() => togglePortfolioDropdown()}
                        style={{ justifyContent: 'space-between', width: '100%', opacity: isDimmed ? DIMMED_OPACITY : 1 }}
                      >
                        <span>{item.label}</span>
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={`${styles.navArrow} ${isPortfolioDropdownOpen ? styles.rotate : ''}`}
                        >
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {isPortfolioDropdownOpen && (
                        <div className={`${styles.mobileSubMenu} ${styles.mobileOnly}`}>
                          {['Overview', 'Positions', 'Orders', 'History', 'Fees'].map(subItem => (
                            <a
                              key={subItem}
                              href={`/portfolio?tab=${subItem}`}
                              className={styles.mobileSubMenuItem}
                              onClick={(e) => {
                                e.preventDefault()
                                onNavClick?.(`/portfolio?tab=${subItem}`)
                                closeMobileMenu()
                              }}
                            >
                              {subItem}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Desktop: Simple Link */}
                      <a
                        href={item.href}
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''} ${styles.desktopOnly}`}
                        onClick={(e) => {
                          e.preventDefault()
                          onNavClick?.(item.href)
                        }}
                        style={{ opacity: isDimmed ? DIMMED_OPACITY : 1 }}
                        title={item.label}
                      >
                        <span>{item.label}</span>
                      </a>
                    </>
                  ) : item.label === 'Usage' ? (
                    <>
                      {/* Mobile: Dropdown */}
                      <button
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''} ${styles.mobileOnly}`}
                        onClick={() => toggleUsageDropdown()}
                        style={{ justifyContent: 'space-between', width: '100%', opacity: isDimmed ? DIMMED_OPACITY : 1 }}
                      >
                        <span>{item.label}</span>
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={`${styles.navArrow} ${isUsageDropdownOpen ? styles.rotate : ''}`}
                        >
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {isUsageDropdownOpen && (
                        <div className={`${styles.mobileSubMenu} ${styles.mobileOnly}`}>
                          {['Overview', 'Usage', 'Model Fee'].map(subItem => (
                            <a
                              key={subItem}
                              href={`/usage?tab=${subItem}`}
                              className={styles.mobileSubMenuItem}
                              onClick={(e) => {
                                e.preventDefault()
                                onNavClick?.(`/usage?tab=${subItem}`)
                                closeMobileMenu()
                              }}
                            >
                              {subItem}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Desktop: Simple Link */}
                      <a
                        href={item.href}
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''} ${styles.desktopOnly}`}
                        onClick={(e) => {
                          e.preventDefault()
                          onNavClick?.(item.href)
                        }}
                        style={{ opacity: isDimmed ? DIMMED_OPACITY : 1 }}
                        title={item.label}
                      >
                        <span>{item.label}</span>
                      </a>
                    </>
                  ) : (
                    <a
                      href={item.href}
                      className={`${styles.navItem} ${item.isActive ? styles.active : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        onNavClick?.(item.href)
                        closeMobileMenu()
                      }}
                      style={{ opacity: isDimmed ? DIMMED_OPACITY : 1 }}
                      title={item.label}
                    >
                      <span>{item.label}</span>
                    </a>
                  )}
                  {index < navItems.length - 1 && <div className={styles.divider} />}
                </React.Fragment>
              )
            })}

            {/* Mobile Action Footer */}
            <div className={`${styles.mobileActionFooter} ${styles.mobileOnly}`}>
              <button className={styles.mobileActionButton} onClick={() => openDepositModal('deposit')}>
                Deposit
              </button>
              <button className={styles.mobileActionButton} onClick={() => openDepositModal('refill')}>
                Refill
              </button>
            </div>
          </div>
        )}

        {/* Right Section - Icons & Profile */}
        {navItems.length > 0 && <div className={styles.divider} />}
        <div className={styles.rightSection}>
          <button className={styles.iconButton} aria-label="Notifications" onClick={() => setIsNotificationOpen(true)}>
            <img
              src={hasNotifications || notificationsForUser.length > 0 ? notificationBulletIcon : notificationIcon}
              alt="Notifications"
              className={styles.iconImage}
            />
          </button>
          <div className={styles.divider} />
          <div className={styles.walletDropdown}>
            <button
              className={styles.walletButton}
              onClick={handleConnect}
              disabled={!ready}
            >
              <span className={styles.address}>
                {authenticated && truncatedAddress ? truncatedAddress : 'Connect Wallet'}
              </span>
            </button>
            {authenticated && isWalletDropdownOpen && (
              <div className={styles.walletDropdownMenu}>
                {isWrongChain && (
                  <button
                    className={`${styles.walletDropdownItem} ${styles.walletDropdownItemPrimary}`}
                    onClick={async () => {
                      try {
                        await handleSwitchToTargetChain()
                        setIsWalletDropdownOpen(false)
                      } catch (error) {
                        console.error('Failed to switch chain:', error)
                      }
                    }}
                  >
                    Switch to Arbitrum Sepolia
                  </button>
                )}
                <button
                  className={styles.walletDropdownItem}
                  onClick={handleCopyAddress}
                >
                  Copy Address
                </button>
                <button
                  className={styles.walletDropdownItem}
                  onClick={() => {
                    setShowDisconnectConfirm(true)
                    setIsWalletDropdownOpen(false)
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDisconnectConfirm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Disconnect Wallet</h3>
            <p className={styles.modalText}>Are you sure you want to disconnect your wallet?</p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButtonCancel}
                onClick={() => setShowDisconnectConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.modalButtonConfirm}
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Sidebar Overlay */}
      {isNotificationOpen && (
        <div className={styles.notificationOverlay} onClick={() => setIsNotificationOpen(false)}>
          <div className={styles.notificationSidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.notificationHeader}>
              <button className={styles.backIcon} onClick={() => setIsNotificationOpen(false)} aria-label="Back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className={styles.notificationTitle}>Notification</span>
            </div>

            <div className={styles.notificationSearchContainer}>
              <input
                type="text"
                placeholder="Search notifications..."
                className={styles.notificationSearchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.notificationContent}>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notif => (
                  <div key={notif.id} className={styles.notificationItem}>
                    <div className={styles.notificationItemHeader}>
                      <div className={styles.notificationTypeWrapper}>
                        {notif.symbol ? (
                          <TokenIcon symbol={notif.symbol} size={20} className={styles.notificationIcon} />
                        ) : (
                          notif.icon ? <img src={notif.icon} alt="" className={styles.notificationIcon} /> : null
                        )}
                        <span className={styles.notificationType}>{notif.type}</span>
                      </div>
                      <button
                        className={styles.removeNotificationButton}
                        onClick={() => removeNotification(notif.id)}
                        aria-label="Remove notification"
                        title="Clear notification"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    <span className={styles.notificationMessage}>{notif.message}</span>
                    {notif.image && (
                      <div className={styles.notificationImageContainer}>
                        <img src={notif.image} alt={notif.type} className={styles.notificationImage} />
                      </div>
                    )}
                    <div className={styles.notificationItemFooter}>
                      <span className={styles.notificationTime}>{notif.time}</span>
                      {notif.ctaText && (
                        <a
                          href={notif.ctaLink}
                          className={styles.notificationCTA}
                          onClick={(e) => {
                            if (notif.ctaLink === '#') e.preventDefault()
                          }}
                        >
                          {notif.ctaText}
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyNotifications}>
                  No notifications found.
                </div>
              )}
            </div>

            <div className={styles.notificationFooter}>
              <button
                className={`${styles.enablePushButton} ${pushState === 'success' ? styles.pushSuccess : ''}`}
                onClick={handleEnablePush}
                disabled={pushState === 'loading' || browserPushEnabled}
              >
                {pushState === 'idle' && 'Enable Push Notifications'}
                {pushState === 'loading' && (
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
                {pushState === 'success' && (
                  <div className={styles.successContent}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Enabled</span>
                  </div>
                )}
              </button>
              <button
                className={styles.clearAllButton}
                onClick={() => clearAll(walletAddress || undefined)}
                disabled={notificationsForUser.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
