export async function onRequest(context) {
  const { request, env, next } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const url = new URL(request.url);
  const publicPaths = ['/api/login', '/api/register', '/api/init-db'];

  if (publicPaths.includes(url.pathname)) {
    try {
      const response = await next();
      return addCors(response);
    } catch (e) {
      return addCors(json({ error: e.message }, 500));
    }
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return addCors(json({ error: '未登录' }, 401));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return addCors(json({ error: '无效令牌' }, 401));
  }

  try {
    const session = await env.DB.prepare(
      `SELECT s.id as session_id, s.token,
              u.id as user_id, u.email, u.name, u.avatar
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ?`
    ).bind(token).first();

    if (!session) {
      return addCors(json({ error: '登录已过期' }, 401));
    }

    env.DB.prepare(
      'UPDATE sessions SET last_used = datetime("now") WHERE id = ?'
    ).bind(session.session_id).run();

    context.data = context.data || {};
    context.data.user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      avatar: session.avatar,
    };
    context.data.token = token;
    context.data.sessionId = session.session_id;

    const response = await next();
    return addCors(response);
  } catch (e) {
    return addCors(json({ error: '认证异常: ' + e.message }, 500));
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function addCors(response) {
  const h = new Headers(response.headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h,
  });
}
