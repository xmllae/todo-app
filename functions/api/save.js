export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;

  try {
    const body = await request.json();
    if (!body.data) return json({ error: '数据为空' }, 400);

    const jsonStr = JSON.stringify(body.data);

    await env.DB.prepare(
      `INSERT INTO user_data (user_id, data, updated_at) VALUES (?,?,datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`
    ).bind(user.id, jsonStr).run();

    return json({ success: true });
  } catch (e) {
    return json({ error: '保存失败: ' + e.message }, 500);
  }
}

function json(data, s = 200) {
  return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json' } });
}
