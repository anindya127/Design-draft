const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');

const config = {
  host: process.env.SFTP_HOST || '47.242.75.250',
  port: parseInt(process.env.SFTP_PORT || '22'),
  username: process.env.SFTP_USER || 'root',
  password: process.env.SFTP_PASSWORD,
};

const LOCAL_DIR = path.join(__dirname, '..', 'out');
const REMOTE_DIR = '/var/www/gcss-website';

function getAllFiles(dir, base = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, base));
    } else {
      results.push({
        local: fullPath,
        remote: path.posix.join(REMOTE_DIR, path.relative(base, fullPath).split(path.sep).join('/')),
        size: fs.statSync(fullPath).size,
      });
    }
  }
  return results;
}

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

async function ensureRemoteDir(sftp, remotePath) {
  const dir = path.posix.dirname(remotePath);
  try {
    await sftp.stat(dir);
  } catch {
    await sftp.mkdir(dir, true);
  }
}

async function deploy() {
  const sftp = new SftpClient();
  const startTime = Date.now();

  // Validate config
  if (!config.password) {
    console.error('Error: SFTP_PASSWORD environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('Connecting to server...');
    const connectPromise = sftp.connect(config);

    // Add 15 second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    console.log('Connected!\n');

    // Ensure remote directory exists
    console.log('Preparing remote directory...');
    try {
      await sftp.mkdir(REMOTE_DIR, true);
    } catch (e) {
      // Directory may already exist
    }

    // Scan local files
    console.log('Scanning local files...');
    const files = getAllFiles(LOCAL_DIR);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    console.log(`Found ${files.length} files (${formatSize(totalSize)})\n`);

    // Upload with progress
    let uploaded = 0;
    let uploadedSize = 0;

    for (const file of files) {
      await ensureRemoteDir(sftp, file.remote);
      await sftp.put(file.local, file.remote);

      uploaded++;
      uploadedSize += file.size;
      const pct = Math.round((uploaded / files.length) * 100);
      const bar = '█'.repeat(Math.floor(pct / 4)) + '░'.repeat(25 - Math.floor(pct / 4));
      const shortName = path.relative(LOCAL_DIR, file.local).split(path.sep).join('/');

      process.stdout.write(
        `\r  ${bar} ${pct}% (${uploaded}/${files.length}) ${formatSize(uploadedSize)}/${formatSize(totalSize)} | ${shortName.slice(-50).padEnd(50)}`
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(`\n\nDeploy complete! ${files.length} files uploaded in ${formatTime(elapsed)}`);
    console.log(`Server: ${config.host} -> ${REMOTE_DIR}`);
  } catch (err) {
    console.error('\nDeploy failed:', err.message);
    process.exit(1);
  } finally {
    await sftp.end();
  }
}

deploy();
