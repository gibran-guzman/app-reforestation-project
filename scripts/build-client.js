const { spawnSync } = require('child_process');
const { mkdirSync, cpSync, rmSync } = require('fs');
const { resolve } = require('path');

const root = resolve(__dirname, '..');
const clientDir = resolve(root, 'client');
const sourceDir = resolve(clientDir, 'dist', 'client', 'browser');
const outputDir = resolve(root, 'public');

console.log('[build-client] Compilando el cliente Angular (producción)...');
const buildResult = spawnSync('npm', ['run', 'build', '--', '--configuration', 'production'], {
  cwd: clientDir,
  stdio: 'inherit',
});

if (buildResult.status !== 0) {
  console.error('[build-client] La compilación de Angular falló.');
  process.exit(buildResult.status || 1);
}

console.log('[build-client] Copiando build a ./public para que Express lo sirva...');
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(sourceDir, outputDir, { recursive: true });

console.log(`[build-client] Build de producción copiado a ${outputDir}`);
