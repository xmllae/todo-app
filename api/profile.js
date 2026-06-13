const { hashPassword, issueToken, requireAuthSession, requireSessionUser } = require('./_shared/auth');
const { createHttpError, createRoute, readJsonBody, sendJson } = require('./_shared/http');
const {
  markUserUpdated,
  normalizeAvatar,
  normalizeDisplayName,
  runMutation,
  toPublicUser
} = require('./_shared/storage');

const handleProfile = createRoute(['POST'], async (req, res) => {
  const session = requireAuthSession(req);
  const body = await readJsonBody(req);
  const nextName = normalizeDisplayName(body.name);
  const nextAvatar = normalizeAvatar(body.avatar);
  const newPassword = String(body.newPassword || '');

  if (!nextName) {
    throw createHttpError(400, '昵称不能为空', 'INVALID_NAME');
  }

  if (nextName.length > 12) {
    throw createHttpError(400, '昵称不能超过 12 个字符', 'INVALID_NAME');
  }

  if (newPassword && newPassword.length < 4) {
    throw createHttpError(400, '密码至少需要 4 位', 'INVALID_PASSWORD');
  }

  const responsePayload = await runMutation(async (database) => {
    const user = requireSessionUser(database, session);

    user.name = nextName;
    user.avatar = nextAvatar;

    let newToken = '';

    if (newPassword) {
      const passwordState = hashPassword(newPassword);

      user.passwordHash = passwordState.hash;
      user.passwordSalt = passwordState.salt;
      user.tokenVersion += 1;
      newToken = issueToken(user);
    }

    markUserUpdated(user);

    return {
      ok: true,
      user: toPublicUser(user),
      newToken: newToken || undefined
    };
  });

  sendJson(res, 200, responsePayload);
});

module.exports = handleProfile;
module.exports.default = handleProfile;
