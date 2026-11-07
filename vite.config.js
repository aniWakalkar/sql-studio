import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // PGlite ships its own WebAssembly files and must not be pre-bundled
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  // Monaco and PostgreSQL are big; that's expected for this app
  build: { chunkSizeWarningLimit: 8000 },
  server: {
    open: true,
    // Always use the same address: the browser keeps saved files and databases
    // per address, so a different port would look like an empty app
    port: 7341, // uncommon port, unlikely to clash with other dev tools
    strictPort: true,
  },
})
