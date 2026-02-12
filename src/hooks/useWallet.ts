import { useState, useMemo, useEffect, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'

const TARGET_CHAIN_ID = 421614
const TARGET_CHAIN_CAIP = `eip155:${TARGET_CHAIN_ID}`

const parseChainId = (chainId: unknown): number | null => {
  if (typeof chainId === 'number' && Number.isFinite(chainId)) return chainId
  if (typeof chainId !== 'string') return null

  if (chainId.startsWith('eip155:')) {
    const parsed = Number(chainId.split(':')[1])
    return Number.isFinite(parsed) ? parsed : null
  }

  const parsed = Number(chainId)
  return Number.isFinite(parsed) ? parsed : null
}

export const useWallet = () => {
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [hasTriedAutoSwitch, setHasTriedAutoSwitch] = useState(false)

  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  const activeWallet = wallets[0]
  const walletAddress = activeWallet?.address
  const currentChainId = parseChainId(activeWallet?.chainId)
  const isOnTargetChain = activeWallet?.chainId === TARGET_CHAIN_CAIP || currentChainId === TARGET_CHAIN_ID
  const hasActiveWallet = Boolean(activeWallet)
  const isWrongChain = authenticated && hasActiveWallet && !isOnTargetChain

  const truncatedAddress = useMemo(() => {
    if (!walletAddress) return null
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
  }, [walletAddress])

  const handleSwitchToTargetChain = useCallback(async () => {
    if (!activeWallet) return false
    if (activeWallet.chainId === TARGET_CHAIN_CAIP || parseChainId(activeWallet.chainId) === TARGET_CHAIN_ID) return true

    await activeWallet.switchChain(TARGET_CHAIN_ID)
    return true
  }, [activeWallet])

  useEffect(() => {
    if (!authenticated) {
      setHasTriedAutoSwitch(false)
      return
    }

    if (!activeWallet || hasTriedAutoSwitch || isOnTargetChain) return

    setHasTriedAutoSwitch(true)
    void activeWallet.switchChain(TARGET_CHAIN_ID).catch((error: unknown) => {
      console.warn('Auto switch to Arbitrum Sepolia failed:', error)
    })
  }, [authenticated, activeWallet, hasTriedAutoSwitch, isOnTargetChain])

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
      setHasTriedAutoSwitch(false)
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
    handleSwitchToTargetChain,
    isWrongChain,
    isOnTargetChain,
    currentChainId,
    targetChainId: TARGET_CHAIN_ID,
    wallets, // Expose wallets to get provider
  }
}
