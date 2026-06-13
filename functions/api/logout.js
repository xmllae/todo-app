import { createRoute, jsonResponse } from '../_shared/http.js';
import { requireAuthSession, revokeAuthSession } from '../_shared/auth.js';
import { requireSessionUser } from '../_shared/storage.js';

export const onRequest = createRoute(['POST'], async (context) => {
  const session = await requireAuthSession(context);
  await requireSessionUser(context, session);

  await revokeAuthSession(context);

  return jsonResponse(context.env, {
    ok: true
  });
});
