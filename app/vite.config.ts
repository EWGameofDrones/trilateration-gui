import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  base: './',
  plugins: [solid()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    minify: false,
    outDir: '../electron/solidjs-dist'
  }
})
