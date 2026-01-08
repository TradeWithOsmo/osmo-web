import { useState } from 'react'

export const useNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // Default: closed
  const [isTradeDropdownOpen, setIsTradeDropdownOpen] = useState(false) // Default: closed
  const [selectedTradeMode, setSelectedTradeMode] = useState<'trade' | 'autos'>('trade')



  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleTradeDropdown = () => {
    setIsTradeDropdownOpen(!isTradeDropdownOpen)
  }

  const closeTradeDropdown = () => {
    setIsTradeDropdownOpen(false)
  }



  const selectTradeMode = (mode: 'trade' | 'autos') => {
    setSelectedTradeMode(mode)
    closeTradeDropdown()
  }

  return {
    isMobileMenuOpen,
    isTradeDropdownOpen,
    selectedTradeMode,
    toggleMobileMenu,
    closeMobileMenu,
    toggleTradeDropdown,
    closeTradeDropdown,
    selectTradeMode,
  }
}
