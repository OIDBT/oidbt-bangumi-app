import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueJsx(),
        vueDevTools(),
        monkey({
            entry: 'src/main.tsx',
            userscript: {
                name: 'OIDBT Bangumi App',
                namespace: 'https://github.com/OIDBT/oidbt-bangumi-app',
                match: [
                    '*://bgm.tv/subject/*',
                    '*://bangumi.tv/subject/*',
                    '*://chii.in/subject/*',
                ],
                grant: 'none',
                'run-at': 'document-end',
            },
        }),
    ],
    build: {
        target: 'es2024',
        outDir: 'dist',
        emptyOutDir: true,
        minify: process.env.NODE_ENV === 'production' ? 'terser' : 'esbuild',
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    optimizeDeps: {
        exclude: ['@bokuweb/zstd-wasm'],
        esbuildOptions: {
            target: 'es2024',
        },
    },
})
