import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    // TSX takes priority over JSX so new admin pages shadow old ones
    extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
