/**
 * Run frontend and backend dev servers together (Windows, macOS, Linux).
 * From repo root: node scripts/run-dev.mjs
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of children) {
    if (c.exitCode === null && !c.killed) {
      try {
        c.kill('SIGTERM');
      } catch {
        c.kill();
      }
    }
  }
  setTimeout(() => process.exit(code), 500).unref();
}

function start(subdir) {
  const cwd = path.join(root, subdir);
  const child = spawn('npm run dev', {
    cwd,
    stdio: 'inherit',
    env: process.env,
    shell: true,
    windowsHide: true,
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    if (signal) {
      shutdown(0);
      return;
    }
    shutdown(code ?? 1);
  });
  return child;
}

start('frontend');
start('backend');

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    shutdown(0);
  });
}
