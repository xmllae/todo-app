import { createHttpError } from './http.js';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_ALGORITHM = 'SHA-256';
const PASSWORD_HASH_SALT_BYTES = 16;
const SESSION_TOKEN_BYTES = 32;

const encoder = new TextEncoder();

function getDatabase(env) {
  if (!env || !env.DB) {
    throw createHttpError(500, 'Missing D1 binding: DB.', 'D1_BINDING_MISSING');
  }

  return env.DB;
}

function normalizeDatabaseError(error) {
  const message = String((error && error.message) || '');

  if (/no such table/i.test(message)) {
    throw createHttpError(
      500,
      'D1 session table is missing. Run the auth session migration first.',
      'DB_NOT_INITIALIZED',
      { cause: error }
    );
  }

  throw error;
}

function base64UrlEncodeBytes(bytes) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeBytes(value) {
  const normalized = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function secureEqualBytes(left, right) {
  const a = left instanceof Uint8Array ? left : new Uint8Array(left);
  const b = right instanceof Uint8Array ? right : new Uint8Array(right);

  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }

  return diff === 0;
}

function getTokenTtlMs(env) {
  const rawValue = Number(env && env.TUOLE_TOKEN_TTL_MS);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : TOKEN_TTL_MS;
}

function createSessionToken() {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_BYTES));
  return `tuole_${base64UrlEncodeBytes(tokenBytes)}`;
}

async function hashSessionToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(token)));
  return base64UrlEncodeBytes(new Uint8Array(digest));
}

function readBearerToken(request) {
  const headerValue = request.headers.get('Authorization') || '';
  const matched = String(headerValue).match(/^Bearer\s+(.+)$/i);

  return matched && matched[1] ? matched[1].trim() : '';
}

export async function hashPassword(password, saltBase64Url) {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const saltBytes = saltBase64Url
    ? base64UrlDecodeBytes(saltBase64Url)
    : crypto.getRandomValues(new Uint8Array(PASSWORD_HASH_SALT_BYTES));
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: PASSWORD_HASH_ALGORITHM,
      salt: saltBytes,
      iterations: PASSWORD_HASH_ITERATIONS
    },
    passwordKey,
    256
  );

  return {
    salt: base64UrlEncodeBytes(saltBytes),
    hash: base64UrlEncodeBytes(new Uint8Array(derivedBits))
  };
}

export async function verifyPassword(password, user) {
  const attempt = await hashPassword(password, user.passwordSalt);
  return secureEqualBytes(
    base64UrlDecodeBytes(attempt.hash),
    base64UrlDecodeBytes(user.passwordHash)
  );
}

export async function issueToken(env, user) {
  const database = getDatabase(env);
  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const timestamp = new Date().toISOString();
  const expiresAt = new Date(Date.now() + getTokenTtlMs(env)).toISOString();

  try {
    await database
      .prepare(
        `INSERT INTO auth_sessions (
          user_id,
          token_hash,
          token_version,
          created_at,
          expires_at,
          last_seen_at
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        Number(user.id),
        tokenHash,
        Number.isInteger(user.tokenVersion) ? user.tokenVersion : 0,
        timestamp,
        expiresAt,
        timestamp
      )
      .run();
  } catch (error) {
    normalizeDatabaseError(error);
  }

  return token;
}

export async function verifyToken(env, token) {
  const tokenValue = String(token || '').trim();

  if (!tokenValue) {
    throw createHttpError(401, 'Login token is missing.', 'AUTH_REQUIRED');
  }

  const database = getDatabase(env);
  const tokenHash = await hashSessionToken(tokenValue);
  let session;

  try {
    session = await database
      .prepare(
        `SELECT user_id, token_version, expires_at
        FROM auth_sessions
        WHERE token_hash = ?
        LIMIT 1`
      )
      .bind(tokenHash)
      .first();
  } catch (error) {
    normalizeDatabaseError(error);
  }

  if (!session) {
    throw createHttpError(401, 'Login token is invalid. Please sign in again.', 'INVALID_TOKEN');
  }

  if (!session.expires_at || Date.now() >= Date.parse(session.expires_at)) {
    try {
      await database
        .prepare('DELETE FROM auth_sessions WHERE token_hash = ?')
        .bind(tokenHash)
        .run();
    } catch (error) {
      normalizeDatabaseError(error);
    }

    throw createHttpError(401, 'Login token has expired. Please sign in again.', 'TOKEN_EXPIRED');
  }

  try {
    await database
      .prepare('UPDATE auth_sessions SET last_seen_at = ? WHERE token_hash = ?')
      .bind(new Date().toISOString(), tokenHash)
      .run();
  } catch (error) {
    normalizeDatabaseError(error);
  }

  return {
    userId: Number(session.user_id),
    tokenVersion: Number(session.token_version || 0)
  };
}

export async function revokeToken(env, token) {
  const tokenValue = String(token || '').trim();

  if (!tokenValue) {
    return;
  }

  try {
    await getDatabase(env)
      .prepare('DELETE FROM auth_sessions WHERE token_hash = ?')
      .bind(await hashSessionToken(tokenValue))
      .run();
  } catch (error) {
    normalizeDatabaseError(error);
  }
}

export async function requireAuthSession(context) {
  const token = readBearerToken(context.request);

  if (!token) {
    throw createHttpError(401, 'Login token is missing.', 'AUTH_REQUIRED');
  }

  return verifyToken(context.env, token);
}

export async function revokeAuthSession(context) {
  await revokeToken(context.env, readBearerToken(context.request));
}
