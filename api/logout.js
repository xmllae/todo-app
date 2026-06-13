const { requireAuthSession, requireSessionUser } = require('./_shared/auth');
const { createRoute, sendJson } = require('./_shared/http');
const { markUserUpdated, runMutation } = require('./_shared/storage');

const handleLogout = createRoute(['POST'], async (req, res) => {
  const session = requireAuthSession(req);

  await runMutation(async (database) => {
    const user = requireSessionUser(database, session);

    user.tokenVersion += 1;
    markUserUpdated(user);
  });

  sendJson(res, 200, {
    ok: true
  });
});

module.exports = handleLogout;
module.exports.default = handleLogout;
