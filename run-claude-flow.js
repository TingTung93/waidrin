#!/usr/bin/env node

const { spawn } = require('child_process');

// Run claude-flow with npx
const args = process.argv.slice(2);
const child = spawn('npx', ['--yes', 'claude-flow@alpha', ...args], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Skip optional dependencies
    npm_config_optional: 'false',
    // Force non-interactive mode
    CI: 'true'
  }
});

child.on('exit', (code) => {
  process.exit(code);
});