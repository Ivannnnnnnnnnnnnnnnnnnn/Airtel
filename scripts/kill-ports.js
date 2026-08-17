const { execSync } = require('child_process');

const PORTS = [3000, 3001];

function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      console.log(`   Port ${port}: free`);
      return;
    }
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`   Port ${port}: killed PID ${pid}`);
      }
    }
  } catch (e) {
    console.log(`   Port ${port}: free or could not check`);
  }
}

console.log('Cleaning ports...');
for (const port of PORTS) {
  killPort(port);
}
console.log('Done.\n');
