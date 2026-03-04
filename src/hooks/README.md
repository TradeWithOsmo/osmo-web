# Custom Hooks

This folder contains reusable custom hooks for the application.

## Available Hooks

### `useWallet`

Manages wallet connection state and interactions using Privy.

**Returns:**
- `ready`: boolean - Whether Privy is ready
- `authenticated`: boolean - Whether user is authenticated
- `walletAddress`: string | undefined - Full wallet address
- `truncatedAddress`: string | null - Shortened wallet address (e.g., "0xAd1f...8196")
- `isWalletDropdownOpen`: boolean - Wallet dropdown state
- `showDisconnectConfirm`: boolean - Disconnect confirmation modal state
- `setIsWalletDropdownOpen`: function - Toggle wallet dropdown
- `setShowDisconnectConfirm`: function - Toggle disconnect modal
- `handleConnect`: function - Connect or toggle dropdown
- `handleDisconnect`: function - Disconnect wallet
- `handleCopyAddress`: function - Copy full address to clipboard

**Example:**
```tsx
import { useWallet } from '@/hooks'

function MyComponent() {
  const { authenticated, truncatedAddress, handleConnect } = useWallet()
  
  return (
    <button onClick={handleConnect}>
      {authenticated ? truncatedAddress : 'Connect Wallet'}
    </button>
  )
}
```

---

### `useNavigation`

Manages navigation state for mobile menu and trade dropdown.

**Returns:**
- `isMobileMenuOpen`: boolean - Mobile menu state
- `isTradeDropdownOpen`: boolean - Trade dropdown state
- `selectedTradeMode`: 'trade' | 'autos' - Selected trade mode
- `toggleMobileMenu`: function - Toggle mobile menu
- `closeMobileMenu`: function - Close mobile menu
- `toggleTradeDropdown`: function - Toggle trade dropdown
- `closeTradeDropdown`: function - Close trade dropdown
- `selectTradeMode`: function - Select and close dropdown

**Example:**
```tsx
import { useNavigation } from '@/hooks'

function MyComponent() {
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation()
  
  return (
    <button onClick={toggleMobileMenu}>
      {isMobileMenuOpen ? 'Close' : 'Menu'}
    </button>
  )
}
```

## Usage

Import hooks from the index file:

```tsx
import { useWallet, useNavigation } from '@/hooks'
// or
import { useWallet, useNavigation } from '../../hooks'
```
