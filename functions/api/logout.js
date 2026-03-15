export async function onRequestPost(context) {
  const { env, data } = context;

  try {
    // ★ 只删除当前设备的 session，其他设备不受影响
    await env.DB.prepare(
      'DELETE FROM sessions WHERE token = ?'
    ).bind(data.token).run();

    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

function json(data, s = 200) {
  return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json' } });
}