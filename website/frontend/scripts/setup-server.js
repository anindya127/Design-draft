const SftpClient = require('ssh2-sftp-client');
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const config = {
  host: '47.242.75.250',
  port: 22,
  username: 'root',
  password: 'Gcss123.',
};

function runSSH(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) return reject(err);
        stream.on('close', (code) => {
          conn.end();
          resolve({ code, output });
        });
        stream.on('data', (data) => {
          const text = data.toString();
          process.stdout.write(text);
          output += text;
        });
        stream.stderr.on('data', (data) => {
          const text = data.toString();
          process.stderr.write(text);
          output += text;
        });
      });
    });
    conn.on('error', reject);
    conn.connect(config);
  });
}

async function setup() {
  try {
    // Step 1: Clean web directory
    console.log('=== Cleaning /var/www/gcss-website ===\n');
    await runSSH('rm -rf /var/www/gcss-website/* && echo "Cleaned!"');

    // Step 2: Check if Node.js is installed
    console.log('\n=== Checking Node.js ===\n');
    const nodeCheck = await runSSH('node --version 2>/dev/null || echo "NOT_FOUND"');

    if (nodeCheck.output.includes('NOT_FOUND')) {
      console.log('\n=== Installing Node.js (this may take a few minutes) ===\n');
      await runSSH('curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && yum install -y nodejs');
      console.log('\n=== Verifying Node.js ===\n');
      await runSSH('node --version && npm --version');
    }

    // Step 3: Upload deploy script
    console.log('\n=== Uploading deploy script ===\n');
    const sftp = new SftpClient();
    await sftp.connect(config);
    const scriptPath = path.join(__dirname, 'server-deploy.sh');
    await sftp.put(scriptPath, '/root/deploy.sh');
    await sftp.end();
    console.log('Uploaded deploy.sh to server');

    // Step 4: Make it executable
    console.log('\n=== Making script executable ===\n');
    await runSSH('chmod +x /root/deploy.sh');

    // Step 5: Run the deploy
    console.log('\n=== Running first deploy ===\n');
    const result = await runSSH('bash /root/deploy.sh');

    if (result.code !== 0) {
      console.error('\nDeploy failed with exit code:', result.code);
      process.exit(1);
    }

    console.log('\n\n=== SETUP COMPLETE ===');
    console.log('To deploy in the future, just SSH to the server and run:');
    console.log('  bash /root/deploy.sh');
    console.log('\nOr from your local machine:');
    console.log('  node scripts/setup-server.js');

  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
}

setup();
