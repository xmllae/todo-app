import { createRoute, jsonResponse } from '../_shared/http.js';
import { requireAuthSession } from '../_shared/auth.js';
import { requireSessionUser, sanitizeUserData, toPublicUser } from '../_shared/storage.js';

export const onRequest = createRoute(['GET'], async (context) => {
  const session = await requireAuthSession(context);
  const user = await requireSessionUser(context, session);

  return jsonResponse(context.env, {
    ok: true,
    user: toPublicUser(user),
    data: sanitizeUserData(user.data)
  });
});
