import { createHttpError } from './http.js';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_ALGORITHM = 'SHA-256';
const PASSWORD_HASH_SALT_BYTES = 16;

const encoder = new TextEncoder();

let cachedSecretKeyPromise = null;
let cachedSecretValue = '';

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

function base64UrlEncodeText(value) {
  return base64UrlEncodeBytes(encoder.encode(String(value)));
}

function base64UrlDecodeText(value) {
  return new TextDecoder().decode(base64UrlDecodeBytes(value));
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

async function getTokenSecretKey(env) {
  const secret = String((env && env.TUOLE_TOKEN_SECRET) || '').trim();

  if (!secret) {
    throw createHttpError(
      500,
      '服务端缺少 TUOLE_TOKEN_SECRET 配置，无法签发登录令牌',
      'MISSING_TOKEN_SECRET'
    );
  }

  if (!cachedSecretKeyPromise || cachedSecretValue !== secret) {
    cachedSecretValue = secret;
    cachedSecretKeyPromise = crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      {
        name: 'HMAC',
        hash: 'SHA-256'
      },
      false,
      ['sign', 'verify']
    );
  }

  return cachedSecretKeyPromise;
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

async function signPayload(env, encodedPayload) {
  const secretKey = await getTokenSecretKey(env);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(encodedPayload)
  );

  return base64UrlEncodeBytes(new Uint8Array(signatureBuffer));
}

export async function issueToken(env, user) {
  const payload = {
    sub: Number(user.id),
    ver: Number.isInteger(user.tokenVersion) ? user.tokenVersion : 0,
    iat: Date.now(),
    exp: Date.now() + getTokenTtlMs(env)
  };
  const encodedPayload = base64UrlEncodeText(JSON.stringify(payload));
  const signature = await signPayload(env, encodedPayload);

  return `tuole.${encodedPayload}.${signature}`;
}

export async function verifyToken(env, token) {
  const parts = String(token || '').split('.');

  if (parts.length !== 3 || parts[0] !== 'tuole') {
    throw createHttpError(401, '登录凭证无效，请重新登录', 'INVALID_TOKEN');
  }

  const encodedPayload = parts[1];
  const providedSignature = parts[2];
  const expectedSignature = await signPayload(env, encodedPayload);

  if (
    !secureEqualBytes(
      base64UrlDecodeBytes(providedSignature),
      base64UrlDecodeBytes(expectedSignature)
    )
  ) {
    throw createHttpError(401, '登录凭证无效，请重新登录', 'INVALID_TOKEN');
  }

  let payload;

  try {
    payload = JSON.parse(base64UrlDecodeText(encodedPayload));
  } catch (error) {
    throw createHttpError(401, '登录凭证无效，请重新登录', 'INVALID_TOKEN');
  }

  if (!Number.isInteger(payload.sub) || !Number.isInteger(payload.ver)) {
    throw createHttpError(401, '登录凭证无效，请重新登录', 'INVALID_TOKEN');
  }

  if (!Number.isFinite(payload.exp) || Date.now() >= payload.exp) {
    throw createHttpError(401, '登录状态已过期，请重新登录', 'TOKEN_EXPIRED');
  }

  return {
    userId: payload.sub,
    tokenVersion: payload.ver
  };
}

export async function requireAuthSession(context) {
  const headerValue = context.request.headers.get('Authorization') || '';
  const matched = String(headerValue).match(/^Bearer\s+(.+)$/i);

  if (!matched || !matched[1]) {
    throw createHttpError(401, '缺少登录凭证，请重新登录', 'AUTH_REQUIRED');
  }

  return verifyToken(context.env, matched[1].trim());
}
