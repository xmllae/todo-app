const { requireAuthSession, requireSessionUser } = require('./_shared/auth');
const { createRoute, sendJson } = require('./_shared/http');
const { readDatabase, sanitizeUserData, toPublicUser } = require('./_shared/storage');

const handleLoad = createRoute(['GET'], async (req, res) => {
  const session = requireAuthSession(req);
  const database = await readDatabase();
  const user = requireSessionUser(database, session);

  sendJson(res, 200, {
    ok: true,
    user: toPublicUser(user),
    data: sanitizeUserData(user.data)
  });
});

module.exports = handleLoad;
module.exports.default = handleLoad;
