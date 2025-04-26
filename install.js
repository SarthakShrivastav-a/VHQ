const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing Virtual HQ dependencies...');

// Install frontend dependencies
console.log('\n1. Installing frontend dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies:', error.message);
  process.exit(1);
}

// Check if backend directory exists
const backendDir = path.join(__dirname, 'backend');
if (!fs.existsSync(backendDir)) {
  console.error('❌ Backend directory not found. Please make sure the backend directory exists.');
  process.exit(1);
}

// Install backend dependencies
console.log('\n2. Installing backend dependencies...');
try {
  process.chdir(backendDir);
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Backend dependencies installed successfully');
  process.chdir(__dirname);
} catch (error) {
  console.error('❌ Failed to install backend dependencies:', error.message);
  process.exit(1);
}

console.log('\n✅ Installation completed successfully!');
console.log('\nTo run the application:');
console.log('1. Start the backend server:');
console.log('   cd backend && npm run dev');
console.log('2. In a new terminal, start the frontend:');
console.log('   npm run dev'); 