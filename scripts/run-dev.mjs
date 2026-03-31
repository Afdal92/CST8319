import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// this script starts frontend and backend dev servers together
// run it from repo root with: node scripts/run-dev.mjs

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsFolder = path.dirname(currentFilePath);
const projectRootFolder = path.resolve(scriptsFolder, '..');

const runningProcesses = [];
let isShuttingDown = false;

function stopAllProcesses(exitCode) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (let i = 0; i < runningProcesses.length; i++) {
    const processItem = runningProcesses[i];
    const stillRunning = processItem.exitCode === null && !processItem.killed;

    if (stillRunning) {
      try {
        processItem.kill('SIGTERM');
      } catch {
        processItem.kill();
      }
    }
  }

  setTimeout(function () {
    process.exit(exitCode);
  }, 500).unref();
}

function startDevServer(folderName) {
  const folderPath = path.join(projectRootFolder, folderName);

  const childProcess = spawn('npm run dev', {
    cwd: folderPath,
    stdio: 'inherit',
    env: process.env,
    shell: true,
    windowsHide: true,
  });

  runningProcesses.push(childProcess);

  childProcess.on('exit', function (code, signal) {
    if (isShuttingDown) {
      return;
    }

    if (signal) {
      stopAllProcesses(0);
      return;
    }

    if (code === null || code === undefined) {
      stopAllProcesses(1);
      return;
    }

    stopAllProcesses(code);
  });
}

startDevServer('frontend');
startDevServer('backend');

process.on('SIGINT', function () {
  stopAllProcesses(0);
});

process.on('SIGTERM', function () {
  stopAllProcesses(0);
});
