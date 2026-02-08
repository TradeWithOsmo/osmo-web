import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
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
