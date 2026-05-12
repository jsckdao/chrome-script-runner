import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

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
  plugins: [copyManifestPlugin()],
  define: {
    // 强制 fengari 使用浏览器模式 - process 检测
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
