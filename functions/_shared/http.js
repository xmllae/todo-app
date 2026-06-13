const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;

export function createHttpError(status, message, code, meta) {
  const error = new Error(message);

  error.status = status;
  error.code = code || 'HTTP_ERROR';

  if (meta && typeof meta === 'object') {
    Object.assign(error, meta);
  }

  return error;
}

function buildCorsHeaders(env, methods) {
  const allowedOrigin =
    env && typeof env.TUOLE_CORS_ORIGIN === 'string' && env.TUOLE_CORS_ORIGIN.trim()
      ? env.TUOLE_CORS_ORIGIN.trim()
      : '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': methods.join(', '),
    Vary: 'Origin'
  };
}

export function jsonResponse(env, payload, status = 200, extraHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...buildCorsHeaders(env, ['GET', 'POST', 'OPTIONS']),
      ...(extraHeaders || {})
    }
  });
}

function errorResponse(context, error) {
  const status =
    typeof error.status === 'number' && error.status >= 400 ? error.status : 500;
  const message =
    typeof error.message === 'string' && error.message.trim()
      ? error.message.trim()
      : '服务器内部错误';
  const payload = {
    ok: false,
    error: message,
    code: error.code || 'INTERNAL_ERROR'
  };

  if (context && context.env && context.env.DEBUG_AUTH_API === '1' && error && error.stack) {
    payload.stack = error.stack;
  }

  return jsonResponse(context.env, payload, status);
}

export async function readJsonBody(request, options) {
  const maxBytes =
    options && Number.isFinite(options.maxBytes) ? options.maxBytes : DEFAULT_MAX_BODY_BYTES;
  const rawBody = await request.text();
  const bodyBytes = new TextEncoder().encode(rawBody).length;

  if (bodyBytes > maxBytes) {
    throw createHttpError(413, '请求体过大', 'BODY_TOO_LARGE');
  }

  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw createHttpError(400, '请求体必须是合法的 JSON', 'INVALID_JSON');
  }
}

export function createRoute(methods, handler) {
  const allowedMethods = Array.isArray(methods) ? methods : [methods];

  return async function onRequest(context) {
    const { request, env } = context;
    const allowHeader = [...allowedMethods, 'OPTIONS'].join(', ');

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...buildCorsHeaders(env, [...allowedMethods, 'OPTIONS']),
          Allow: allowHeader
        }
      });
    }

    if (!allowedMethods.includes(request.method)) {
      return jsonResponse(
        env,
        {
          ok: false,
          error: `不支持 ${request.method} 请求`,
          code: 'METHOD_NOT_ALLOWED'
        },
        405,
        {
          Allow: allowHeader
        }
      );
    }

    try {
      return await handler(context);
    } catch (error) {
      return errorResponse(context, error);
    }
  };
}
