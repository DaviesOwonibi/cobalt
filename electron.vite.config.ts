import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), renderer()]
  },
  preload: {
    plugins: [externalizeDepsPlugin(), renderer()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), renderer()]
  }
})
