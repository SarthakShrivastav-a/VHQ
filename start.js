const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

console.log(`${colors.bright}${colors.blue}Starting Virtual HQ...${colors.reset}\n`);

// Check if backend directory exists
const backendDir = path.join(__dirname, 'backend');
if (!fs.existsSync(backendDir)) {
  console.error(`${colors.red}❌ Backend directory not found.${colors.reset}`);
  process.exit(1);
}

// Function to spawn a process and handle its output
function spawnProcess(command, args, options, name) {
  const proc = spawn(command, args, options);
  
  proc.stdout.on('data', (data) => {
    console.log(`${colors.green}[${name}]${colors.reset} ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`${colors.red}[${name} ERROR]${colors.reset} ${data.toString().trim()}`);
  });
  
  proc.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[${name}]${colors.reset} Process exited with code ${code}`);
    }
  });
  
  return proc;
}

// Start backend server
console.log(`${colors.yellow}Starting backend server...${colors.reset}`);
const backendProcess = spawnProcess(
  /^win/.test(process.platform) ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  { cwd: backendDir },
  'Backend'
);

// Start frontend server
console.log(`${colors.yellow}Starting frontend server...${colors.reset}`);
const frontendProcess = spawnProcess(
  /^win/.test(process.platform) ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  { cwd: __dirname },
  'Frontend'
);

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.bright}${colors.blue}Shutting down Virtual HQ...${colors.reset}`);
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});

console.log(`\n${colors.bright}${colors.blue}Virtual HQ is starting up. Wait for both servers to be ready.${colors.reset}`);
console.log(`${colors.yellow}Press Ctrl+C to stop all servers.${colors.reset}\n`); 