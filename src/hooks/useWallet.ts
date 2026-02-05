import { useState, useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'

export const useWallet = () => {
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  const walletAddress = wallets[0]?.address

  const truncatedAddress = useMemo(() => {
    if (!walletAddress) return null
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
  }, [walletAddress])

  const handleCopyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress)
        console.log('Address copied!')
      } catch (err) {
        console.error('Failed to copy address:', err)
      }
      setIsWalletDropdownOpen(false)
    }
  }

  const handleConnect = () => {
    if (authenticated) {
      setIsWalletDropdownOpen(!isWalletDropdownOpen)
    } else {
      login()
    }
  }

  const handleDisconnect = async () => {
    await logout()
    setShowDisconnectConfirm(false)
  }

  return {
    ready,
    authenticated,
    walletAddress,
    truncatedAddress,
    isWalletDropdownOpen,
    showDisconnectConfirm,
    setIsWalletDropdownOpen,
    setShowDisconnectConfirm,
    handleConnect,
    handleDisconnect,
    handleCopyAddress,
    wallets, // Expose wallets to get provider
  }
}
