import { createHttpError, createRoute, jsonResponse, readJsonBody } from '../_shared/http.js';
import { issueToken, verifyPassword } from '../_shared/auth.js';
import {
  getUserByEmail,
  normalizeEmail,
  toPublicUser,
  touchUserLogin
} from '../_shared/storage.js';

export const onRequest = createRoute(['POST'], async (context) => {
  const body = await readJsonBody(context.request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email) {
    throw createHttpError(400, '请输入邮箱', 'INVALID_EMAIL');
  }

  if (!password) {
    throw createHttpError(400, '请输入密码', 'INVALID_PASSWORD');
  }

  const user = await getUserByEmail(context.env, email);

  if (!user || !(await verifyPassword(password, user))) {
    throw createHttpError(401, '账号或密码不正确', 'LOGIN_FAILED');
  }

  await touchUserLogin(context.env, user.id);

  return jsonResponse(context.env, {
    ok: true,
    token: await issueToken(context.env, user),
    user: toPublicUser(user)
  });
});
