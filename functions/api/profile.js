import { createHttpError, createRoute, jsonResponse, readJsonBody } from '../_shared/http.js';
import { hashPassword, issueToken, requireAuthSession } from '../_shared/auth.js';
import {
  normalizeAvatar,
  normalizeDisplayName,
  requireSessionUser,
  toPublicUser,
  updateUserProfile
} from '../_shared/storage.js';

export const onRequest = createRoute(['POST'], async (context) => {
  const session = await requireAuthSession(context);
  const body = await readJsonBody(context.request);
  const nextName = normalizeDisplayName(body.name);
  const nextAvatar = normalizeAvatar(body.avatar);
  const newPassword = String(body.newPassword || '');
  const user = await requireSessionUser(context, session);

  if (!nextName) {
    throw createHttpError(400, '昵称不能为空', 'INVALID_NAME');
  }

  if (nextName.length > 12) {
    throw createHttpError(400, '昵称不能超过 12 个字符', 'INVALID_NAME');
  }

  if (newPassword && newPassword.length < 4) {
    throw createHttpError(400, '密码至少需要 4 位', 'INVALID_PASSWORD');
  }

  let passwordHash = user.passwordHash;
  let passwordSalt = user.passwordSalt;
  let tokenVersion = user.tokenVersion;
  let newToken = '';

  if (newPassword) {
    const passwordState = await hashPassword(newPassword);

    passwordHash = passwordState.hash;
    passwordSalt = passwordState.salt;
    tokenVersion += 1;
  }

  await updateUserProfile(context.env, {
    userId: user.id,
    name: nextName,
    avatar: nextAvatar,
    passwordHash,
    passwordSalt,
    tokenVersion
  });

  const updatedUser = {
    ...user,
    name: nextName,
    avatar: nextAvatar,
    passwordHash,
    passwordSalt,
    tokenVersion
  };

  if (newPassword) {
    newToken = await issueToken(context.env, updatedUser);
  }

  return jsonResponse(context.env, {
    ok: true,
    user: toPublicUser(updatedUser),
    newToken: newToken || undefined
  });
});
