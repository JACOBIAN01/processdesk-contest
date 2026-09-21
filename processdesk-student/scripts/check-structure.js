const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const problems = [];

const REQUIRED_FILES = [
  'electron/main.js',
  'electron/preload.js',
  'electron/ipc/channels.js',
  'src/app/App.jsx',
  'docs/ARCHITECTURE.md',
];

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(root, file))) problems.push(`Missing required file: ${file}`);
}

// Security boundary: the window must keep context isolation on and Node off.
const { APP_CONFIG } = require('../electron/config/appConfig');
if (APP_CONFIG.webPreferences.contextIsolation !== true)
  problems.push('contextIsolation must be true');
if (APP_CONFIG.webPreferences.nodeIntegration !== false)
  problems.push('nodeIntegration must be false');

// Renderer code must never import Electron or Node built-ins directly.
function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return /\.(js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

const FORBIDDEN = /(from\s+|require\()\s*['"](electron|node:[\w/]+|fs|path|child_process|os)['"]/;
for (const file of listSourceFiles(path.join(root, 'src'))) {
  if (FORBIDDEN.test(fs.readFileSync(file, 'utf8'))) {
    problems.push(`Renderer file imports a privileged module: ${path.relative(root, file)}`);
  }
}

if (problems.length) {
  console.error(problems.map((p) => `✖ ${p}`).join('\n'));
  process.exit(1);
}
console.log('Structure OK');
