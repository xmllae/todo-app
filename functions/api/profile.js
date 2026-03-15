export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  try {
    const { name, avatar, newPassword } = await request.json();
    if (!name || !name.trim()) return json({ error: '昵称不能为空' }, 400);

    await env.DB.prepare(
      'UPDATE users SET name=?, avatar=? WHERE id=?'
    ).bind(name.trim(), avatar || user.avatar, user.id).run();

    let newToken = null;

    if (newPassword) {
      if (newPassword.length < 4) return json({ error: '密码至少4位' }, 400);

      const salt = genSalt();
      const hash = await hashPw(newPassword, salt);

      await env.DB.prepare(
        'UPDATE users SET password_hash=?, salt=? WHERE id=?'
      ).bind(hash, salt, user.id).run();

      // 密码修改后，删除所有会话（安全措施），重新为当前设备创建会话
      await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id).run();

      newToken = genToken();
      await env.DB.prepare(
        'INSERT INTO sessions (user_id, token) VALUES (?,?)'
      ).bind(user.id, newToken).run();
    }

    return json({
      user: { id: user.id, email: user.email, name: name.trim(), avatar: avatar || user.avatar },
      newToken,
    });
  } catch (e) {
    return json({ error: '更新失败: ' + e.message }, 500);
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
