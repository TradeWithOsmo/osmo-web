import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Force Vite to de-duplicate these packages so all code (including pre-bundled
    // libraries like global-trade-react-icon) share one React instance.
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      // Hard-alias React to root node_modules to prevent @wagmi/connectors
      // (which ships its own React 18) from loading a second React instance.
      'react': path.resolve(dirname, './node_modules/react'),
      'react-dom': path.resolve(dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(dirname, './node_modules/react/jsx-runtime'),
      '@': path.resolve(dirname, './src'),
      '@charting': path.resolve(dirname, './src/charting'),
      '__vite-optional-peer-dep:@solana-program/system:@privy-io/react-auth': path.resolve(dirname, './src/shims/solana-program-system.ts'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'util', 'stream', 'assert', 'url', 'https-browserify'],
  },
})
