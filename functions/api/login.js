export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, password } = await request.json();
    if (!email || !password) return json({ error: '邮箱和密码不能为空' }, 400);

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.trim().toLowerCase()).first();

    if (!user) return json({ error: '邮箱或密码错误' }, 401);

    const hash = await hashPw(password, user.salt);
    if (hash !== user.password_hash) return json({ error: '邮箱或密码错误' }, 401);

    /*
     * ★ 关键：每次登录创建一条新 session，不删除旧 session
     *   这样电脑、手机、平板可以同时保持登录
     */
    const token = genToken();
    await env.DB.prepare(
      'INSERT INTO sessions (user_id, token) VALUES (?,?)'
    ).bind(user.id, token).run();

    // 清理90天未使用的旧会话（可选）
    await env.DB.prepare(
      `DELETE FROM sessions WHERE user_id = ? AND last_used < datetime('now','-90 days')`
    ).bind(user.id).run();

    return json({
      token,
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    });
  } catch (e) {
    return json({ error: '登录失败: ' + e.message }, 500);
  }
}

async function hashPw(pw, salt) {
  const data = new TextEncoder().encode(salt + ':' + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function genToken() {
  const b = new Uint8Array(32); crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function json(data, s = 200) {
  return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json' } });
}
