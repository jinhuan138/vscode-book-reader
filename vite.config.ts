import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// https://cn.vitejs.dev/
export default defineConfig(({ command }) => ({
  plugins: [vue(), viteSingleFile()],
  server: {
    port: 8025,
  },
  root: './resource',
  base: './resource',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resource/src')
    }
  },
  publicDir: command === 'serve' ? 'public' : false,
}))
