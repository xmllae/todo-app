export async function onRequestGet(context) {
  const { env, data } = context;
  const user = data.user;

  try {
    const row = await env.DB.prepare(
      'SELECT data FROM user_data WHERE user_id = ?'
    ).bind(user.id).first();

    let userData = {};
    if (row && row.data) {
      try { userData = JSON.parse(row.data); } catch (e) { userData = {}; }
    }

    return json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      data: userData,
    });
  } catch (e) {
    return json({ error: '加载失败: ' + e.message }, 500);
  }
}

function json(data, s = 200) {
  return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json' } });
}
