/**
 * GCSS First Deploy — one-shot script that:
 * 1. Cross-compiles Go backend for Linux
 * 2. Builds frontend static export
 * 3. Uploads everything (frontend, backend, configs) via SFTP
 * 4. Runs server setup + restart via a single SSH session
 *
 * Usage:  SFTP_PASSWORD='xxx' node deploy/first-deploy.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const frontendModules = path.resolve(ROOT, 'website', 'frontend', 'node_modules');
const { Client } = require(path.resolve(frontendModules, 'ssh2'));
const SftpClient = require(path.resolve(frontendModules, 'ssh2-sftp-client'));

// ── Load env ────────────────────────────────────────
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
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch { /* ignore */ }
}

loadEnvFile(path.join(ROOT, 'website', 'frontend', '.env.local'));
loadEnvFile(path.join(ROOT, 'website', 'frontend', '.env'));
loadEnvFile(path.join(__dirname, '.env'));

const config = {
  host: process.env.SFTP_HOST || '47.242.75.250',
  port: parseInt(process.env.SFTP_PORT || '22'),
  username: process.env.SFTP_USER || 'root',
  password: process.env.SFTP_PASSWORD,
};

const FRONTEND_DIR = path.join(ROOT, 'website', 'frontend');
const BACKEND_DIR = path.join(ROOT, 'website', 'backend');
const DEPLOY_DIR = path.join(ROOT, 'deploy');

// ── Helpers ─────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getAllFiles(dir, base = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, base));
    } else {
      results.push({
        local: fullPath,
        relative: path.relative(base, fullPath).split(path.sep).join('/'),
        size: fs.statSync(fullPath).size,
      });
    }
  }
  return results;
}

function runSSH(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) { conn.end(); return reject(err); }
        stream.on('data', (d) => {
          const s = d.toString();
          output += s;
          process.stdout.write(s);
        });
        stream.stderr.on('data', (d) => {
          const s = d.toString();
          output += s;
          process.stderr.write(s);
        });
        stream.on('close', (code) => {
          conn.end();
          if (code === 0) resolve(output);
          else reject(new Error(`Exit code ${code}`));
        });
      });
    });
    conn.on('error', reject);
    conn.connect({ ...config, readyTimeout: 30000 });
  });
}

// ── Main ────────────────────────────────────────────
async function deploy() {
  const t0 = Date.now();

  if (!config.password) {
    console.error('Error: SFTP_PASSWORD not set.');
    console.error("Set it in website/frontend/.env.local or: SFTP_PASSWORD='xxx' node deploy/first-deploy.js");
    process.exit(1);
  }

  // ── Step 1: Build backend ─────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 1/5: Compiling Go backend (linux/amd64)');
  console.log('='.repeat(60) + '\n');

  execSync('go build -ldflags="-s -w" -o bin/gcss-backend ./cmd/server', {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: { ...process.env, GOOS: 'linux', GOARCH: 'amd64', CGO_ENABLED: '0' },
  });

  const binaryPath = path.join(BACKEND_DIR, 'bin', 'gcss-backend');
  console.log(`  Binary: ${formatSize(fs.statSync(binaryPath).size)}`);

  // ── Step 2: Build frontend ────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 2/5: Building frontend static export');
  console.log('='.repeat(60) + '\n');

  execSync('node scripts/build-export.js', {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    env: process.env,
  });

  const outDir = path.join(FRONTEND_DIR, 'out');
  const frontendFiles = getAllFiles(outDir);
  const frontendSize = frontendFiles.reduce((s, f) => s + f.size, 0);
  console.log(`  ${frontendFiles.length} files (${formatSize(frontendSize)})`);

  // ── Step 3: Upload everything via SFTP ────────────
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 3/5: Uploading via SFTP');
  console.log('='.repeat(60) + '\n');

  const sftp = new SftpClient();
  try {
    await sftp.connect({ ...config, readyTimeout: 30000 });
    console.log('  Connected.\n');

    // Ensure remote dirs
    for (const d of [
      '/opt/gcss-backend',
      '/opt/gcss-backend/data',
      '/opt/gcss-backend/data/uploads',
      '/var/www/gcss-website',
    ]) {
      try { await sftp.mkdir(d, true); } catch { /* exists */ }
    }

    // Upload backend binary (to temp path first, then rename — avoids ETXTBSY if binary is running)
    process.stdout.write('  [backend] binary...');
    const tempBin = '/opt/gcss-backend/gcss-backend.new';
    await sftp.put(binaryPath, tempBin);
    // Remove old and rename new
    try { await sftp.delete('/opt/gcss-backend/gcss-backend'); } catch { /* may not exist */ }
    await sftp.rename(tempBin, '/opt/gcss-backend/gcss-backend');
    console.log(' done');

    // Upload backend .env
    process.stdout.write('  [backend] .env...');
    await sftp.put(path.join(DEPLOY_DIR, 'backend.env'), '/opt/gcss-backend/.env');
    console.log(' done');

    // Upload nginx config
    process.stdout.write('  [config]  nginx...');
    try { await sftp.mkdir('/etc/nginx/conf.d', true); } catch { /* exists */ }
    await sftp.put(
      path.join(DEPLOY_DIR, 'nginx', 'v3.gcss.hk.conf'),
      '/etc/nginx/conf.d/v3.gcss.hk.conf'
    );
    console.log(' done');

    // Upload systemd service
    process.stdout.write('  [config]  systemd...');
    await sftp.put(
      path.join(DEPLOY_DIR, 'systemd', 'gcss-backend.service'),
      '/etc/systemd/system/gcss-backend.service'
    );
    console.log(' done');

    // Upload frontend files
    console.log(`\n  [frontend] ${frontendFiles.length} files...`);
    let uploaded = 0;
    for (const file of frontendFiles) {
      const remotePath = '/var/www/gcss-website/' + file.relative;
      const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
      try { await sftp.mkdir(remoteDir, true); } catch { /* exists */ }
      await sftp.put(file.local, remotePath);
      uploaded++;
      if (uploaded % 50 === 0 || uploaded === frontendFiles.length) {
        const pct = Math.round((uploaded / frontendFiles.length) * 100);
        process.stdout.write(`\r  [frontend] ${pct}% (${uploaded}/${frontendFiles.length})`);
      }
    }
    console.log(' done');
  } finally {
    await sftp.end();
  }

  // ── Step 4: Server setup via SSH ──────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 4/5: Server setup (SSH)');
  console.log('='.repeat(60) + '\n');

  const setupCommands = `
    set -e

    echo "[1] Setting permissions..."
    chmod +x /opt/gcss-backend/gcss-backend
    chown -R www-data:www-data /opt/gcss-backend 2>/dev/null || chown -R nginx:nginx /opt/gcss-backend
    chmod 600 /opt/gcss-backend/.env

    echo "[2] Installing systemd service..."
    systemctl daemon-reload
    systemctl enable gcss-backend

    echo "[3] Validating nginx config..."
    nginx -t

    echo "[4] Reloading nginx..."
    systemctl reload nginx || systemctl restart nginx

    echo "[5] Starting backend service..."
    systemctl restart gcss-backend
    sleep 2
    systemctl status gcss-backend --no-pager -l || true

    echo ""
    echo "[6] Health check..."
    curl -s http://127.0.0.1:8080/healthz || echo "Backend not responding on :8080 yet"
    echo ""
  `.trim();

  try {
    await runSSH(setupCommands);
  } catch (err) {
    console.error('\n  Setup had issues:', err.message);
    console.error('  You may need to SSH in and check manually.');
  }

  // ── Step 5: Verify ───────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  STEP 5/5: Verification');
  console.log('='.repeat(60) + '\n');

  try {
    await runSSH('echo "nginx: $(systemctl is-active nginx)"; echo "backend: $(systemctl is-active gcss-backend)"; echo "port 8080: $(ss -tlnp | grep :8080 | head -1)"');
  } catch (err) {
    console.error('  Verification failed:', err.message);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log(`  DEPLOY COMPLETE in ${elapsed}s`);
  console.log(`  Server: ${config.host}`);
  console.log(`  Frontend: http://v3.gcss.hk/`);
  console.log(`  API: http://v3.gcss.hk/api/`);
  console.log(`  Health: http://v3.gcss.hk/healthz`);
  console.log('='.repeat(60) + '\n');
}

deploy().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
