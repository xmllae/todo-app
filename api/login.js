const { issueToken, verifyPassword } = require('./_shared/auth');
const { createHttpError, createRoute, readJsonBody, sendJson } = require('./_shared/http');
const {
  findUserByEmail,
  normalizeEmail,
  readDatabase,
  toPublicUser
} = require('./_shared/storage');

const handleLogin = createRoute(['POST'], async (req, res) => {
  const body = await readJsonBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email) {
    throw createHttpError(400, '请输入邮箱', 'INVALID_EMAIL');
  }

  if (!password) {
    throw createHttpError(400, '请输入密码', 'INVALID_PASSWORD');
  }

  const database = await readDatabase();
  const user = findUserByEmail(database, email);

  if (!user || !verifyPassword(password, user)) {
    throw createHttpError(401, '账号或密码不正确', 'LOGIN_FAILED');
  }

  sendJson(res, 200, {
    ok: true,
    token: issueToken(user),
    user: toPublicUser(user)
  });
});

module.exports = handleLogin;
module.exports.default = handleLogin;
