const { spawnSync } = require('child_process');
const { existsSync, mkdirSync, cpSync, rmSync } = require('fs');
const { resolve } = require('path');

const root = resolve(__dirname, '..');
const serverDir = resolve(root, 'server');
const clientDir = resolve(root, 'client');
const sourceDir = resolve(clientDir, 'dist', 'client', 'browser');
const outputDir = resolve(root, 'public');

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', cwd: opts.cwd || root });
  if (res.status !== 0) {
    console.error(`\n[build] FALLO ejecutando: ${cmd} ${args.join(' ')} (code ${res.status})`);
    process.exit(res.status || 1);
  }
}

function pnpmAvailable() {
  return spawnSync('pnpm', ['--version'], { stdio: 'ignore' }).status === 0;
}

// 1. Instalar dependencias del SERVER
console.log('\n[build] 1/4 Instalando dependencias del server...');
if (pnpmAvailable()) {
  run('pnpm', ['--dir', 'server', 'install', '--prod'], { cwd: root });
} else {
  // Sin pnpm: cayendo a npm. Genera lockfile si hace falta.
  if (!existsSync(resolve(serverDir, 'package-lock.json'))) {
    run('npm', ['install', '--package-lock-only'], { cwd: serverDir });
  }
  run('npm', ['install', '--omit=dev'], { cwd: serverDir });
}

// 2. Instalar dependencias del CLIENT
console.log('\n[build] 2/4 Instalando dependencias del client...');
if (existsSync(resolve(clientDir, 'package-lock.json'))) {
  run('npm', ['ci'], { cwd: clientDir });
} else {
  run('npm', ['install'], { cwd: clientDir });
}

// 3. Compilar Angular en producción
console.log('\n[build] 3/4 Compilando Angular (producción)...');
run('npm', ['run', 'build', '--', '--configuration', 'production'], { cwd: clientDir });

// 4. Copiar el build a ./public (lo que sirve Express)
console.log('\n[build] 4/4 Copiando build a ./public...');
if (!existsSync(sourceDir)) {
  console.error(`[build] No se encontró el build de Angular en ${sourceDir}`);
  process.exit(1);
}
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(sourceDir, outputDir, { recursive: true });

console.log(`\n[build] Build completado. Estáticos en: ${outputDir}`);
