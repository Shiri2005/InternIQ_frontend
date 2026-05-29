import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Serve PDFs from the API origin in dev so "View certificate" is same-origin (5173) and opens correctly
      "/certificates": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // Serve uploaded study PDFs through Vite dev server as well
      "/study-materials": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
