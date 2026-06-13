const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_ALLOWED_ORIGIN = process.env.TUOLE_CORS_ORIGIN || '*';

function createHttpError(status, message, code, meta) {
  const error = new Error(message);

  error.status = status;
  error.code = code || 'HTTP_ERROR';

  if (meta && typeof meta === 'object') {
    Object.assign(error, meta);
  }

  return error;
}

function setCorsHeaders(res, methods) {
  res.setHeader('Access-Control-Allow-Origin', DEFAULT_ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Vary', 'Origin');
}

function sendJson(res, status, payload, extraHeaders) {
  const body = JSON.stringify(payload);

  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (extraHeaders && typeof extraHeaders === 'object') {
    Object.entries(extraHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  res.end(body);
}

function sendError(res, error) {
  const status =
    typeof error.status === 'number' && error.status >= 400 ? error.status : 500;
  const message =
    typeof error.message === 'string' && error.message.trim()
      ? error.message
      : '服务器内部错误';
  const payload = {
    ok: false,
    error: message,
    code: error.code || 'INTERNAL_ERROR'
  };

  if (process.env.NODE_ENV !== 'production' && error && error.stack) {
    payload.stack = error.stack;
  }

  sendJson(res, status, payload);
}

async function readRawBody(req, options) {
  if (typeof req.body === 'string') {
    return req.body;
  }

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  const maxBytes =
    options && Number.isFinite(options.maxBytes) ? options.maxBytes : DEFAULT_MAX_BODY_BYTES;
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    totalBytes += buffer.length;

    if (totalBytes > maxBytes) {
      throw createHttpError(413, '请求体过大', 'BODY_TOO_LARGE');
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function readJsonBody(req, options) {
  const rawBody = await readRawBody(req, options);
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) {
    return {};
  }

  try {
    return JSON.parse(trimmedBody);
  } catch (error) {
    throw createHttpError(400, '请求体必须是合法的 JSON', 'INVALID_JSON');
  }
}

function createRoute(methods, handler) {
  const allowedMethods = Array.isArray(methods) ? methods : [methods];

  return async function routeHandler(req, res) {
    setCorsHeaders(res, [...allowedMethods, 'OPTIONS']);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Allow', [...allowedMethods, 'OPTIONS'].join(', '));
      res.end();
      return;
    }

    if (!allowedMethods.includes(req.method)) {
      sendJson(
        res,
        405,
        {
          ok: false,
          error: `不支持 ${req.method} 请求`,
          code: 'METHOD_NOT_ALLOWED'
        },
        {
          Allow: [...allowedMethods, 'OPTIONS'].join(', ')
        }
      );
      return;
    }

    try {
      await handler(req, res);
    } catch (error) {
      sendError(res, error);
    }
  };
}

module.exports = {
  createHttpError,
  createRoute,
  readJsonBody,
  sendError,
  sendJson
};
