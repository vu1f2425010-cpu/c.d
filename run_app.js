/**
 * VerifEye Forensic Engine - Application Launcher
 * Launches both the FastAPI Cyber-Forensics backend and Next.js frontend
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('=====================================================');
console.log('  🔍 VerifEye Cyber-Forensics Engine Launcher');
console.log('=====================================================\n');

// Helper to spawn process with styled prefix
function startProcess(name, command, args, cwd, colorCode) {
  const prefix = `\x1b[${colorCode}m[${name}]\x1b[0m`;
  console.log(`${prefix} Starting in ${cwd}...`);
  
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONPATH: backendDir }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) console.log(`${prefix} ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) console.error(`${prefix} \x1b[33m${line}\x1b[0m`);
    });
  });

  proc.on('close', (code) => {
    console.log(`${prefix} Process exited with code ${code}`);
  });

  return proc;
}

// 1. Start Frontend (Next.js)
console.log('\x1b[36m[*] Launching Next.js Frontend on http://localhost:3000...\x1b[0m');
const frontendProc = startProcess('Frontend', 'npm', ['run', 'dev'], frontendDir, '36');

// 2. Start Backend (FastAPI via uvicorn)
const fs = require('fs');
const customPython = 'C:\\Users\\shyam\\python_env\\python.exe';
const pythonCmd = fs.existsSync(customPython) ? customPython : 'python';

console.log(`\x1b[32m[*] Launching FastAPI Backend with ${pythonCmd} on http://localhost:8000...\x1b[0m`);
const backendProc = startProcess('Backend', pythonCmd, ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000'], backendDir, '32');

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\n\x1b[31m[!] Shutting down all services...\x1b[0m');
  frontendProc.kill('SIGINT');
  backendProc.kill('SIGINT');
  process.exit(0);
});
