const { hashPassword, issueToken } = require('./_shared/auth');
const { createHttpError, createRoute, readJsonBody, sendJson } = require('./_shared/http');
const {
  createUser,
  findUserByEmail,
  normalizeAvatar,
  normalizeDisplayName,
  normalizeEmail,
  runMutation,
  toPublicUser
} = require('./_shared/storage');

const handleRegister = createRoute(['POST'], async (req, res) => {
  const body = await readJsonBody(req);
  const email = normalizeEmail(body.email);
  const name = normalizeDisplayName(body.name);
  const password = String(body.password || '');
  const avatar = normalizeAvatar(body.avatar);

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw createHttpError(400, '请输入有效邮箱', 'INVALID_EMAIL');
  }

  if (!name) {
    throw createHttpError(400, '请输入昵称', 'INVALID_NAME');
  }

  if (name.length > 12) {
    throw createHttpError(400, '昵称不能超过 12 个字符', 'INVALID_NAME');
  }

  if (password.length < 4) {
    throw createHttpError(400, '密码至少需要 4 位', 'INVALID_PASSWORD');
  }

  const responsePayload = await runMutation(async (database) => {
    if (findUserByEmail(database, email)) {
      throw createHttpError(409, '该邮箱已注册，请直接登录', 'EMAIL_EXISTS');
    }

    const passwordState = hashPassword(password);
    const user = createUser(database, {
      email,
      name,
      avatar,
      passwordHash: passwordState.hash,
      passwordSalt: passwordState.salt
    });

    return {
      ok: true,
      token: issueToken(user),
      user: toPublicUser(user)
    };
  });

  sendJson(res, 200, responsePayload);
});

module.exports = handleRegister;
module.exports.default = handleRegister;
