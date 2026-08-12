import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const rendererDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(rendererDir, '..')

export default defineConfig({
  root: projectRoot,
  ssr: {
    noExternal: true,
    external: ['vscode'],
  },
  build: {
    outDir: path.resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    ssr: path.resolve(projectRoot, 'src/extension.ts'),
    rollupOptions: {
      input: path.resolve(projectRoot, 'src/extension.ts'),
      external: ['vscode'],
      output: {
        format: 'cjs',
        entryFileNames: 'extension.js',
        inlineDynamicImports: true,
      },
    },
  },
})
