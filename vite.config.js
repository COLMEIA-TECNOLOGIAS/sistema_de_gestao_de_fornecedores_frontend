import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'login1.svg'],
      manifest: {
        name: 'Gestão de Fornecedores',
        short_name: 'Fornecedores',
        description: 'Plataforma de gestão de fornecedores MOSAP3',
        lang: 'pt',
        theme_color: '#44B16F',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Bibliotecas pesadas em chunks próprios (melhor cache entre deploys)
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          pdf: ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
})
