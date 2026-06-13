import { createRoute, jsonResponse } from '../_shared/http.js';
import { requireAuthSession } from '../_shared/auth.js';
import { invalidateUserToken, requireSessionUser } from '../_shared/storage.js';

export const onRequest = createRoute(['POST'], async (context) => {
  const session = await requireAuthSession(context);
  const user = await requireSessionUser(context, session);

  await invalidateUserToken(context.env, user.id, user.tokenVersion + 1);

  return jsonResponse(context.env, {
    ok: true
  });
});
