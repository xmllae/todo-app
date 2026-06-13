const { requireAuthSession, requireSessionUser } = require('./_shared/auth');
const { createHttpError, createRoute, readJsonBody, sendJson } = require('./_shared/http');
const { markUserUpdated, runMutation, sanitizeUserData } = require('./_shared/storage');

const handleSave = createRoute(['POST'], async (req, res) => {
  const session = requireAuthSession(req);
  const body = await readJsonBody(req, { maxBytes: 2 * 1024 * 1024 });

  if (!body || typeof body !== 'object' || !body.data || typeof body.data !== 'object') {
    throw createHttpError(400, '保存数据缺少 data 字段', 'INVALID_DATA');
  }

  await runMutation(async (database) => {
    const user = requireSessionUser(database, session);

    user.data = sanitizeUserData(body.data);
    markUserUpdated(user);
  });

  sendJson(res, 200, {
    ok: true
  });
});

module.exports = handleSave;
module.exports.default = handleSave;
