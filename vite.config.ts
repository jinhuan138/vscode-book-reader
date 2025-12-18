import { defineConfig,PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'
import { visualizer } from "rollup-plugin-visualizer";
// https://cn.vitejs.dev/
export default defineConfig({
  plugins: [vue(), viteSingleFile(), visualizer() as PluginOption],
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
  build: {
    copyPublicDir: false
  }
})
