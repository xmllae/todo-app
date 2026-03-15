export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, password, name, avatar } = await request.json();

    if (!email || !password) return json({ error: '邮箱和密码不能为空' }, 400);
    if (password.length < 4) return json({ error: '密码至少4位' }, 400);
    if (!name || !name.trim()) return json({ error: '昵称不能为空' }, 400);

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.trim().toLowerCase()).first();

    if (existing) return json({ error: '该邮箱已注册' }, 409);

    const salt = genSalt();
    const hash = await hashPw(password, salt);

    const res = await env.DB.prepare(
      'INSERT INTO users (email, password_hash, salt, name, avatar) VALUES (?,?,?,?,?)'
    ).bind(email.trim().toLowerCase(), hash, salt, name.trim(), avatar || '😊').run();

    const userId = res.meta.last_row_id;

    await env.DB.prepare(
      'INSERT INTO user_data (user_id, data) VALUES (?, ?)'
    ).bind(userId, '{}').run();

    const token = genToken();
    await env.DB.prepare(
      'INSERT INTO sessions (user_id, token) VALUES (?,?)'
    ).bind(userId, token).run();

    return json({
      token,
      user: { id: userId, email: email.trim().toLowerCase(), name: name.trim(), avatar: avatar || '😊' },
    });
  } catch (e) {
    return json({ error: '注册失败: ' + e.message }, 500);
  }
}

async function hashPw(pw, salt) {
  const data = new TextEncoder().encode(salt + ':' + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function genSalt() {
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b));
}
function genToken() {
  const b = new Uint8Array(32); crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function json(data, s = 200) {
  return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json' } });
}
