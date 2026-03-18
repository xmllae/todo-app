// DELETE /api/clear
// 清除当前用户的所有订阅数据，并将云端 data.subscriptions 置为空数组
export async function onRequestDelete(context) {
  const { env, data } = context;
  const user = data.user;

  try {
    // 读取当前数据
    const row = await env.DB.prepare(
      'SELECT data FROM user_data WHERE user_id = ?'
    ).bind(user.id).first();

    let userData = {};
    if (row && row.data) {
      try { userData = JSON.parse(row.data); } catch (e) { userData = {}; }
    }

    // 清空订阅数据
    userData.subscriptions = [];
    userData.subSort = 'days';

    const jsonStr = JSON.stringify(userData);

    await env.DB.prepare(
      `INSERT INTO user_data (user_id, data, updated_at) VALUES (?,?,datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`
    ).bind(user.id, jsonStr).run();

    return json({ success: true, message: '订阅数据已清除' });
  } catch (e) {
    return json({ error: '清除失败: ' + e.message }, 500);
  }
}

function json(data, s = 200) {
  return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json' } });
}
