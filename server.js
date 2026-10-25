// server.js - Minimal zero-dependency local HTTP server for StudioMagico
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Only the app's own files are public: never the server, tests, package files or dotfiles (.git, .env)
const BLOCKED_FILES = new Set(['server.js', 'test.js', 'package.json', 'package-lock.json']);

function resolvePublicPath(url) {
  let reqPath;
  try {
    reqPath = decodeURIComponent(url.split('?')[0]);
  } catch (e) {
    return null; // malformed URL such as "/%"
  }
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath.includes('\0')) return null;

  const safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));
  if (!safePath.startsWith(PUBLIC_DIR + path.sep)) return null;

  const relative = path.relative(PUBLIC_DIR, safePath);
  const segments = relative.split(path.sep);
  if (segments.some(seg => seg.startsWith('.') || seg === 'node_modules')) return null;
  if (BLOCKED_FILES.has(relative)) return null;
  if (!MIME_TYPES[path.extname(safePath).toLowerCase()]) return null;
  return safePath;
}

const server = http.createServer((req, res) => {
  const safePath = resolvePublicPath(req.url);
  if (!safePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Accesso negato');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('File non trovato');
    }

    const contentType = MIME_TYPES[path.extname(safePath).toLowerCase()];
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(safePath).pipe(res);
  });
});

// Detect local network IP for tablet/mobile access
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

if (require.main === module) {
  server.listen(PORT, () => {
    const localIP = getLocalNetworkIP();
    console.log('\n======================================================');
    console.log(' ✨  StudioMagico - Compagno di Studio per Bambini  ✨');
    console.log('======================================================');
    console.log(` 💻 Sul tuo PC:        http://localhost:${PORT}`);
    console.log(` 📱 Su Tablet / Tel:   http://${localIP}:${PORT}`);
    console.log(' ⚠️  Raggiungibile da tutti i dispositivi della tua rete Wi-Fi.');
    console.log('======================================================\n');
  });
}

module.exports = { server, resolvePublicPath };
