const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const { sendError } = require('./api/_shared/http');

const projectRoot = process.cwd();
const indexFile = path.join(projectRoot, 'index.html');
const port = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 3000;

const apiRoutes = {
  '/api/health': require('./api/health'),
  '/api/login': require('./api/login'),
  '/api/register': require('./api/register'),
  '/api/load': require('./api/load'),
  '/api/save': require('./api/save'),
  '/api/profile': require('./api/profile'),
  '/api/logout': require('./api/logout')
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp'
};

function isSafePath(targetPath) {
  const relativePath = path.relative(projectRoot, targetPath);
  return !!relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

async function sendFile(res, filePath, method) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[extension] || 'application/octet-stream';
  const content = await fs.readFile(filePath);

  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', extension === '.html' ? 'no-cache' : 'public, max-age=300');

  if (method === 'HEAD') {
    res.end();
    return;
  }

  res.end(content);
}

async function serveStatic(req, res, pathname) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
  let filePath = path.join(projectRoot, relativePath);

  if (!isSafePath(filePath) && filePath !== indexFile) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    await sendFile(res, filePath, req.method);
    return;
  } catch (error) {}

  await sendFile(res, indexFile, req.method);
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const routeHandler = apiRoutes[requestUrl.pathname];

    if (routeHandler) {
      await routeHandler(req, res);
      return;
    }

    await serveStatic(req, res, requestUrl.pathname);
  } catch (error) {
    sendError(res, error);
  }
});

server.listen(port, () => {
  process.stdout.write(`Tuole server is running on http://localhost:${port}\n`);
});
