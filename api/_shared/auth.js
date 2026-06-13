const crypto = require('node:crypto');

const { createHttpError } = require('./http');

const TOKEN_TTL_MS = Number(process.env.TUOLE_TOKEN_TTL_MS) > 0
  ? Number(process.env.TUOLE_TOKEN_TTL_MS)
  : 30 * 24 * 60 * 60 * 1000;

function getTokenSecret() {
  const secret = String(process.env.TUOLE_TOKEN_SECRET || '').trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw createHttpError(
      500,
      '服务端缺少 TUOLE_TOKEN_SECRET 配置，无法签发登录令牌',
      'MISSING_TOKEN_SECRET'
    );
  }

  return 'tuole-dev-secret';
}

function toBase64Url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
  return buffer.toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(String(value), 'base64url').toString('utf8');
}

function signPayload(encodedPayload) {
  return crypto
    .createHmac('sha256', getTokenSecret())
    .update(encodedPayload)
    .digest('base64url');
}

function hashPassword(password, salt) {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), finalSalt, 64).toString('hex');

  return {
    salt: finalSalt,
    hash
  };
}

function verifyPassword(password, user) {
  const hashedAttempt = hashPassword(password, user.passwordSalt);
  const expected = Buffer.from(user.passwordHash, 'hex');
  const actual = Buffer.from(hashedAttempt.hash, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}

function issueToken(user) {
  const payload = {
    sub: user.id,
    ver: Number.isInteger(user.tokenVersion) ? user.tokenVersion : 0,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `tuole.${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');

  if (parts.length !== 3 || parts[0] !== 'tuole') {
    throw createHttpError(401, '登录凭证无效，请重新登录', 'INVALID_TOKEN');
  }

  const encodedPayload = parts[1];
  const signature = parts[2];
  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw createHttpError(401, '登录凭证无效，请重新登录', 'INVALID_TOKEN');
  }

  let payload;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
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

function readBearerToken(req) {
  const headerValue = req.headers.authorization || req.headers.Authorization || '';
  const matched = String(headerValue).match(/^Bearer\s+(.+)$/i);

  return matched ? matched[1].trim() : '';
}

function requireAuthSession(req) {
  const token = readBearerToken(req);

  if (!token) {
    throw createHttpError(401, '缺少登录凭证，请重新登录', 'AUTH_REQUIRED');
  }

  return verifyToken(token);
}

function requireSessionUser(database, session) {
  const { findUserById } = require('./storage');
  const user = findUserById(database, session.userId);

  if (!user || user.tokenVersion !== session.tokenVersion) {
    throw createHttpError(401, '登录状态已过期，请重新登录', 'TOKEN_EXPIRED');
  }

  return user;
}

module.exports = {
  hashPassword,
  issueToken,
  requireAuthSession,
  requireSessionUser,
  verifyPassword
};
