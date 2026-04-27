/**
 * 🚀 Unified Dev Server for Harness Production
 * Frontend (live-server: 8080) + Backend (express: 3000)
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('\n--- 👥 Harness Team: Initializing Project Stack ---');

// 1. Backend Server 실행 (port: 3000)
console.log('📡 Starting AI Production Backend (Port 3000)...');
const backend = spawn('node', ['server.js'], { stdio: 'inherit', shell: true });

// 2. Frontend Server 실행 (port: 8080)
// output 폴더 무시 설정을 기본으로 포함하여 새로고침 이슈 완화
console.log('🌐 Starting Frontend Preview (Port 8080)...');
const frontend = spawn('npx', [
    'live-server', 
    '--port=8080', 
    '--ignore="projects/figma-to-image-ai/output/*"',
    '--no-browser' // 수동 접속을 위해 자동 브라우저 오픈 방지 (필요 시 제거)
], { stdio: 'inherit', shell: true });

backend.on('error', (err) => console.error('Failed to start backend:', err));
frontend.on('error', (err) => console.error('Failed to start frontend:', err));

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Harness Team Servers...');
    backend.kill();
    frontend.kill();
    process.exit();
});

console.log('✅ All systems active. Please access: http://127.0.0.1:8080\n');
