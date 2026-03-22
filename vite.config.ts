import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Configurazione Vite per il gestionale professionale
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Aggiunge Tailwind CSS per lo stile grafico
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Permette import brevi tipo @/components
    },
  },
})