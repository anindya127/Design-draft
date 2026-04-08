const { Client } = require('ssh2');

const config = {
  host: '47.242.75.250',
  port: 22,
  username: 'root',
  password: 'Gcss123.',
  keepaliveInterval: 10000,
  readyTimeout: 30000,
};

function runCommand(conn, command) {
  return new Promise((resolve, reject) => {
    let output = '';
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => {
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
}

async function setup() {
  const conn = new Client();

  conn.on('error', (err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });

  conn.on('ready', async () => {
    try {
      console.log('Connected to server!\n');

      // All commands in one go
      const commands = [
        'echo "=== [1/6] Cleaning web directory ===" && rm -rf /var/www/gcss-website/*',
        'echo "=== [2/6] Pulling latest from GitHub ===" && cd /root/gcss-repo && git checkout -- . && git pull origin main',
        'echo "=== [3/6] Installing dependencies ===" && cd /root/gcss-repo/website/frontend && npm install --production=false 2>&1 | tail -5',
        'echo "=== [4/6] Building site ===" && cd /root/gcss-repo/website/frontend && npm run build 2>&1 | tail -20',
        'echo "=== [5/6] Deploying to web root ===" && cp -r /root/gcss-repo/website/frontend/out/* /var/www/gcss-website/',
        'echo "=== [6/6] Verifying ===" && ls /var/www/gcss-website/ && echo "" && echo "Deploy complete! Site live at http://47.242.75.250"',
      ];

      for (const cmd of commands) {
        console.log('');
        const result = await runCommand(conn, cmd);
        if (result.code !== 0) {
          console.error(`\nCommand failed with exit code ${result.code}`);
          conn.end();
          process.exit(1);
        }
      }

      console.log('\n\n=== ALL DONE ===');
      conn.end();
    } catch (err) {
      console.error('Error:', err.message);
      conn.end();
      process.exit(1);
    }
  });

  console.log('Connecting to server...');
  conn.connect(config);
}

setup();
