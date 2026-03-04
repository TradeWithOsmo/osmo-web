import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { baseSepolia } from 'viem/chains'
import './index.css'
import './styles/global.css'
import App from './App.tsx'
import { config } from './wagmiConfig.ts'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent surprise refetches when user changes tab / focuses window.
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || 'your-privy-app-id'}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#FFE1F2',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        supportedChains: [baseSepolia],
        defaultChain: baseSepolia,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <App />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  </StrictMode>,
)

