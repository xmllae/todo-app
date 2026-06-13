import { createRoute, jsonResponse } from '../_shared/http.js';
import { getHealthSummary } from '../_shared/storage.js';

export const onRequest = createRoute(['GET'], async (context) => {
  const health = await getHealthSummary(context.env);

  return jsonResponse(context.env, {
    ok: true,
    runtime: 'cloudflare-pages-functions',
    storage: {
      driver: 'd1',
      binding: 'DB',
      migrationsApplied: health.migrationsApplied,
      users: health.users
    }
  });
});
