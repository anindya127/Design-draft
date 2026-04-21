/**
 * GCSS Backend Deploy Script
 *
 * 1. Cross-compiles Go binary for Linux/amd64
 * 2. Uploads binary + .env to /opt/gcss-backend/ via SFTP
 * 3. Restarts the gcss-backend systemd service via SSH
 *
 * Usage:
 *   node deploy/deploy-backend.js
 *   SFTP_PASSWORD='xxx' node deploy/deploy-backend.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Resolve ssh2 + ssh2-sftp-client from frontend's node_modules
const frontendModules = path.resolve(__dirname, '..', 'website', 'frontend', 'node_modules');
const { Client } = require(path.resolve(frontendModules, 'ssh2'));
const SftpClient = require(path.resolve(frontendModules, 'ssh2-sftp-client'));

// ── Load env files (same approach as frontend deploy) ───────────

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (!key) continue;
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch { /* ignore */ }
}

// Load from frontend .env.local (where SFTP creds live) and deploy/.env
loadEnvFile(path.join(__dirname, '..', 'website', 'frontend', '.env.local'));
loadEnvFile(path.join(__dirname, '..', 'website', 'frontend', '.env'));
loadEnvFile(path.join(__dirname, '.env'));

// ── Config ──────────────────────────────────────────────────────

const sftpConfig = {
  host: process.env.SFTP_HOST || '47.242.75.250',
  port: parseInt(process.env.SFTP_PORT || '22'),
  username: process.env.SFTP_USER || 'root',
  password: process.env.SFTP_PASSWORD,
};

const BACKEND_DIR = path.join(__dirname, '..', 'website', 'backend');
const BINARY_NAME = 'gcss-backend';
const LOCAL_BINARY = path.join(BACKEND_DIR, 'bin', BINARY_NAME);
const LOCAL_ENV = path.join(__dirname, 'backend.env');

const REMOTE_DIR = '/opt/gcss-backend';
const REMOTE_BINARY = `${REMOTE_DIR}/${BINARY_NAME}`;
const REMOTE_ENV = `${REMOTE_DIR}/.env`;
const REMOTE_DATA = `${REMOTE_DIR}/data`;

// ── Helpers ─────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatTime(ms) {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  return min + 'm ' + sec + 's';
}

function runSSHCommand(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) { conn.end(); return reject(err); }
        stream.on('data', (data) => { output += data.toString(); });
        stream.stderr.on('data', (data) => { output += data.toString(); });
        stream.on('close', (code) => {
          conn.end();
          if (code === 0) resolve(output.trim());
          else reject(new Error(`Command failed (exit ${code}): ${output.trim()}`));
        });
      });
    });
    conn.on('error', reject);
    conn.connect(sftpConfig);
  });
}

// ── Main ────────────────────────────────────────────────────────

async function deploy() {
  const startTime = Date.now();

  // Validate
  if (!sftpConfig.password) {
    console.error('Error: SFTP_PASSWORD is not set.');
    console.error('Set it in website/frontend/.env.local or pass via environment.');
    process.exit(1);
  }

  // Step 1: Cross-compile for Linux
  console.log('Step 1/4: Compiling Go binary for linux/amd64...');
  try {
    execSync(
      `go build -ldflags="-s -w" -o bin/${BINARY_NAME} ./cmd/server`,
      {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
        env: { ...process.env, GOOS: 'linux', GOARCH: 'amd64', CGO_ENABLED: '0' },
      }
    );
  } catch (err) {
    console.error('Go build failed.');
    process.exit(1);
  }

  const binarySize = fs.statSync(LOCAL_BINARY).size;
  console.log(`  Binary: ${formatSize(binarySize)}\n`);

  // Step 2: Upload via SFTP
  console.log('Step 2/4: Uploading to server...');
  const sftp = new SftpClient();
  try {
    await sftp.connect(sftpConfig);

    // Ensure directories exist
    for (const dir of [REMOTE_DIR, REMOTE_DATA, `${REMOTE_DATA}/uploads`]) {
      try { await sftp.mkdir(dir, true); } catch { /* exists */ }
    }

    // Upload binary (temp path first to avoid ETXTBSY if running)
    process.stdout.write('  Uploading binary...');
    const tempBin = REMOTE_BINARY + '.new';
    await sftp.put(LOCAL_BINARY, tempBin);
    try { await sftp.delete(REMOTE_BINARY); } catch { /* may not exist */ }
    await sftp.rename(tempBin, REMOTE_BINARY);
    console.log(` done (${formatSize(binarySize)})`);

    // Upload .env
    process.stdout.write('  Uploading .env...');
    await sftp.put(LOCAL_ENV, REMOTE_ENV);
    console.log(' done');
  } catch (err) {
    console.error('\nSFTP upload failed:', err.message);
    process.exit(1);
  } finally {
    await sftp.end();
  }

  // Step 3: Set permissions + restart service via SSH
  console.log('\nStep 3/4: Setting permissions...');
  try {
    await runSSHCommand(`chmod +x ${REMOTE_BINARY} && chown -R www-data:www-data ${REMOTE_DIR}`);
    console.log('  Permissions set.');
  } catch (err) {
    console.error('  Warning: permission setting failed:', err.message);
    console.error('  You may need to run: chmod +x /opt/gcss-backend/gcss-backend');
  }

  console.log('\nStep 4/4: Restarting gcss-backend service...');
  try {
    await runSSHCommand('systemctl restart gcss-backend');
    const status = await runSSHCommand('systemctl is-active gcss-backend');
    console.log(`  Service status: ${status}`);
  } catch (err) {
    console.error('  Warning: service restart failed:', err.message);
    console.error('  If this is the first deploy, run setup-server.sh first.');
  }

  const elapsed = Date.now() - startTime;
  console.log(`\nBackend deploy complete in ${formatTime(elapsed)}`);
  console.log(`  Server: ${sftpConfig.host}`);
  console.log(`  Binary: ${REMOTE_BINARY}`);
  console.log(`  Config: ${REMOTE_ENV}`);
}

deploy();
