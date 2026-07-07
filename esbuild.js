const esbuild = require('esbuild')

esbuild
    .build({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        outfile: 'dist/extension.js',
        external: ['vscode'],
        format: 'cjs',
        platform: 'node',
        minify: true,
        sourcemap: false,
    })
    .then(() => {
        console.log('esbuild: build succeeded ✅');
        process.exit(0);
    })
    .catch((err) => {
        console.error('esbuild: build failed ❌');
        console.error(err);
        process.exit(1);
    });