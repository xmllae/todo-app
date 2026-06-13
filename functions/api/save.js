import { createHttpError, createRoute, jsonResponse, readJsonBody } from '../_shared/http.js';
import { requireAuthSession } from '../_shared/auth.js';
import { requireSessionUser, updateUserData } from '../_shared/storage.js';

export const onRequest = createRoute(['POST'], async (context) => {
  const session = await requireAuthSession(context);
  const body = await readJsonBody(context.request, {
    maxBytes: 2 * 1024 * 1024
  });

  if (!body || typeof body !== 'object' || !body.data || typeof body.data !== 'object') {
    throw createHttpError(400, '保存数据缺少 data 字段', 'INVALID_DATA');
  }

  const user = await requireSessionUser(context, session);

  await updateUserData(context.env, user.id, body.data);

  return jsonResponse(context.env, {
    ok: true
  });
});
