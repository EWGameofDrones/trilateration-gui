import { defineConfig, PluginOption } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [solid(), tailwindcss() as PluginOption],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    minify: false,
    outDir: '../electron/solidjs-dist',
  },
})
