import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

const manifestPath = resolve(__dirname, 'manifest.json');
const distPath = resolve(__dirname, 'dist');

function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    apply: 'build',
    writeBundle() {
      if (!existsSync(distPath)) {
        mkdirSync(distPath, { recursive: true });
      }
      copyFileSync(manifestPath, resolve(distPath, 'manifest.json'));
    },
  };
}

export default defineConfig({
  root: resolve(__dirname, 'src'),
  plugins: [vue(), tailwindcss(), copyManifestPlugin()],
  define: {
    // Force fengari to use browser mode - process detection
    'process.env.FENGARICONF': JSON.stringify('{"process":false}'),
  },
  build: {
    outDir: distPath,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/sidepanel.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        entryFileNames: '[name]/[name].js',
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
