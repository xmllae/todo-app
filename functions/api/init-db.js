export async function onRequestGet(context) {
  const { env } = context;

  // 先检查 D1 绑定是否存在
  if (!env.DB) {
    return new Response(JSON.stringify({
      error: '❌ D1 数据库未绑定！请在 Cloudflare Pages → Settings → Functions → D1 database bindings 中添加变量名 DB'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = [];

  try {
    // 第1张表：users
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'user',
        avatar TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
    results.push('✅ users 表已创建');
  } catch (e) {
    results.push('❌ users 表失败: ' + e.message);
  }

  try {
    // 第2张表：sessions
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        last_used TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    results.push('✅ sessions 表已创建');
  } catch (e) {
    results.push('❌ sessions 表失败: ' + e.message);
  }

  try {
    // 第3张表：user_data
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id INTEGER PRIMARY KEY,
        data TEXT DEFAULT '{}',
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    results.push('✅ user_data 表已创建');
  } catch (e) {
    results.push('❌ user_data 表失败: ' + e.message);
  }

  try {
    // 索引
    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`
    ).run();
    results.push('✅ 索引已创建');
  } catch (e) {
    results.push('❌ 索引失败: ' + e.message);
  }

  // 验证：查询所有表
  let tables = [];
  try {
    const res = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    ).all();
    tables = res.results.map(r => r.name);
    results.push('📋 当前所有表: ' + tables.join(', '));
  } catch (e) {
    results.push('❌ 查表失败: ' + e.message);
  }

  const allOk = results.every(r => r.startsWith('✅') || r.startsWith('📋'));

  return new Response(JSON.stringify({
    success: allOk,
    message: allOk ? '🎉 数据库初始化完成！' : '⚠️ 部分操作失败，请检查',
    details: results,
    tables: tables
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
