import React from 'react'
import { useWallet, useNavigation } from '../../hooks'
import { useUIStore } from '../../store/useUIStore'
import styles from './Navbar.module.css'
import notificationIcon from '../../assets/Icons/Notifikasi/Notifications.png'
import notificationBulletIcon from '../../assets/Icons/Notifikasi/Notifications-Bullet.png'
import howIcon from '../../assets/Icons/How/Circle-Question.png'
import tradeIcon from '../../assets/Logos-Market-Autos/Osmo-Market.png'
import autosIcon from '../../assets/Logos-Market-Autos/Osmo-Autos.png'
import menuIcon from '../../assets/Icons/Menu/Menu.png'
import closeIcon from '../../assets/Icons/Menu/XSquare.png'

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
    truncatedAddress,
    isWalletDropdownOpen,
    showDisconnectConfirm,
    setIsWalletDropdownOpen,
    setShowDisconnectConfirm,
    handleConnect,
    handleDisconnect,
    handleCopyAddress,
  } = useWallet()

  // Navigation hooks
  const {
    isMobileMenuOpen,
    isTradeDropdownOpen,
    selectedTradeMode,
    toggleMobileMenu,
    closeMobileMenu,
    toggleTradeDropdown,
    selectTradeMode,
  } = useNavigation()

  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = React.useState(false)
  const togglePortfolioDropdown = () => setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen)

  const [isUsageDropdownOpen, setIsUsageDropdownOpen] = React.useState(false)
  const toggleUsageDropdown = () => setIsUsageDropdownOpen(!isUsageDropdownOpen)

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

  const currentTradeIcon = selectedTradeMode === 'trade' ? tradeIcon : autosIcon

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

        {/* Tablet: Trade dropdown next to logo */}
        <div className={styles.tabletTradeDropdown}>
          <div className={styles.divider} />
          <div className={styles.dropdown}>
            <button
              className={`${styles.navItem} ${styles.dropdownToggle}`}
              onClick={toggleTradeDropdown}
              title="Trade"
            >
              <img src={currentTradeIcon} alt="Trade Mode" className={styles['trade-mode-icon']} />
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${styles.navArrow} ${isTradeDropdownOpen ? styles.rotate : ''}`}
              >
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isTradeDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    selectTradeMode('trade')
                    onNavClick?.('/trade')
                    closeMobileMenu()
                  }}
                >
                  <img src={tradeIcon} alt="Trade" className={styles['trade-mode-icon']} />
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    selectTradeMode('autos')
                    onNavClick?.('/autos')
                    closeMobileMenu()
                  }}
                >
                  <img src={autosIcon} alt="Autos" className={styles['trade-mode-icon']} />
                </button>
              </div>
            )}
          </div>
        </div>

        {navItems.length > 0 && <div className={styles.divider} />}

        {/* Navigation Items - Desktop */}
        {navItems.length > 0 && (
          <div className={`${styles.navMenu} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
            {navItems.map((item, index) => {
              const isRestricted = (item.label === 'Portfolio' || item.label === 'Usage') && !authenticated;

              return (
                <React.Fragment key={item.href}>
                  {item.label === 'Trade' ? (
                    <>
                      {/* Desktop: Dropdown with icon */}
                      <div className={`${styles.dropdown} ${styles.desktopOnly}`}>
                        <button
                          className={`${styles.navItem} ${styles.dropdownToggle} ${item.isActive ? styles.active : ''}`}
                          onClick={toggleTradeDropdown}
                          title={item.label}
                        >
                          <img src={currentTradeIcon} alt="Trade Mode" className={styles['trade-mode-icon']} />
                          <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`${styles.navArrow} ${isTradeDropdownOpen ? styles.rotate : ''}`}
                          >
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {isTradeDropdownOpen && (
                          <div className={styles.dropdownMenu}>
                            <button
                              className={styles.dropdownItem}
                              onClick={() => {
                                selectTradeMode('trade')
                                onNavClick?.('/trade')
                                closeMobileMenu()
                              }}
                            >
                              <img src={tradeIcon} alt="Trade" className={styles['trade-mode-icon']} />
                            </button>
                            <button
                              className={styles.dropdownItem}
                              onClick={() => {
                                selectTradeMode('autos')
                                onNavClick?.('/autos')
                                closeMobileMenu()
                              }}
                            >
                              <img src={autosIcon} alt="Autos" className={styles['trade-mode-icon']} />
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Mobile: Two separate items */}
                      <>
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
                        <a
                          href="/autos"
                          className={`${styles.navItem} ${styles.mobileOnly}`}
                          onClick={(e) => {
                            e.preventDefault()
                            onNavClick?.('/autos')
                            closeMobileMenu()
                          }}
                          title="Autonomus"
                        >
                          <span>Autonomus</span>
                        </a>
                      </>
                    </>
                  ) : item.label === 'Portfolio' ? (
                    <>
                      {/* Mobile: Dropdown */}
                      <button
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''} ${styles.mobileOnly} ${isRestricted ? styles.disabled : ''}`}
                        onClick={() => !isRestricted && togglePortfolioDropdown()}
                        style={{ justifyContent: 'space-between', width: '100%' }}
                        disabled={isRestricted}
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
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''} ${styles.desktopOnly} ${isRestricted ? styles.disabled : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          if (isRestricted) return;
                          onNavClick?.(item.href)
                        }}
                        title={item.label}
                      >
                        <span>{item.label}</span>
                      </a>
                    </>
                  ) : item.label === 'Usage' ? (
                    <>
                      {/* Mobile: Dropdown */}
                      <button
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''} ${styles.mobileOnly} ${isRestricted ? styles.disabled : ''}`}
                        onClick={() => !isRestricted && toggleUsageDropdown()}
                        style={{ justifyContent: 'space-between', width: '100%' }}
                        disabled={isRestricted}
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
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''} ${styles.desktopOnly} ${isRestricted ? styles.disabled : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          if (isRestricted) return;
                          onNavClick?.(item.href)
                        }}
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
          {/* Only show Help icon when there are nav items */}
          {navItems.length > 0 && (
            <div className={styles.helpIconWrapper}>
              <button className={styles.iconButton} aria-label="Help">
                <img src={howIcon} alt="Help" className={styles.iconImage} />
              </button>
              <div className={styles.divider} />
            </div>
          )}
          <button className={styles.iconButton} aria-label="Notifications">
            <img
              src={hasNotifications ? notificationBulletIcon : notificationIcon}
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
    </nav>
  )
}

export default Navbar
