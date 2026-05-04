import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',

  // ── Build optimizations ──
  build: {
    // Use modern target for smaller bundles (no unnecessary polyfills)
    target: 'es2020',

    // Enable source maps only in development
    sourcemap: false,

    // Aggressive chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Vendor chunks — cached separately from app code
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react'
            if (id.includes('react-router-dom')) return 'vendor-router'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('lucide-react') || id.includes('react-toastify')) return 'vendor-ui'
          }
        },
      },
    },

    // Smaller chunk size warning threshold
    chunkSizeWarningLimit: 500,

    // Minification (Vite 8 uses Oxc by default)
    minify: true,

    // CSS code splitting — each route loads only its CSS
    cssCodeSplit: true,
  },

  // ── Dev server optimizations ──
  server: {
    // Pre-bundle heavy deps for faster dev cold-starts
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/pages/Home.jsx',
        './src/lib/products.js',
        './src/lib/supabase.js',
      ],
    },
  },

  // ── Dependency pre-bundling ──
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'react-toastify',
      'framer-motion',
    ],
  },
})
