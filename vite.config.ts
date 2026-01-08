import { defineConfig, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { version } from './package.json'
// https://cn.vitejs.dev/
export default defineConfig({
  plugins: [
    vue(),
    viteSingleFile(),
    visualizer({
      filename: `stats${version}.html`,
    }) as PluginOption,
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  server: {
    port: 8025,
  },
  root: './resource',
  base: './resource',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resource/src'),
    },
  },
  build: {
    copyPublicDir: false,
  },
})
