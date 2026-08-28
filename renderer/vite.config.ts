import { defineConfig, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import pkg from '../package.json' with { type: 'json' }
// https://cn.vitejs.dev/
export default defineConfig({
  plugins: [
    vue(),
    // visualizer({
    //   filename: `stats${pkg.version}.html`,
    // }) as PluginOption,
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  base: './',
  server: {
    port: 8025,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    copyPublicDir: false,
  },
})
