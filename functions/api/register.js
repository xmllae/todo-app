import { createHttpError, createRoute, jsonResponse, readJsonBody } from '../_shared/http.js';
import { hashPassword, issueToken } from '../_shared/auth.js';
import {
  normalizeAvatar,
  normalizeDisplayName,
  normalizeEmail,
  normalizeUsername,
  toPublicUser
} from '../_shared/storage.js';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

function getDatabase(env) {
  if (!env || !env.DB) {
    throw createHttpError(500, 'Missing D1 binding: DB.', 'D1_BINDING_MISSING');
  }

  return env.DB;
}

function createFallbackUsername(email) {
  const localPart = normalizeUsername(String(email).split('@')[0])
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[^a-z0-9]+$/, '')
    .slice(0, 20);
  const base = USERNAME_PATTERN.test(localPart) ? localPart : 'user';

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function toUserRecord(row) {
  return {
    id: Number(row.id),
    username: row.username || '',
    email: row.email || '',
    name: row.name || '用户',
    avatar: row.avatar || '👤',
    passwordHash: row.password_hash || '',
    passwordSalt: row.password_salt || '',
    tokenVersion: Number(row.token_version || 0),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    lastLoginAt: row.last_login_at || ''
  };
}

function throwDatabaseError(error) {
  const message = String((error && error.message) || '');

  if (/UNIQUE constraint failed: users\.email/i.test(message)) {
    throw createHttpError(409, 'Email is already registered.', 'EMAIL_EXISTS', {
      cause: error
    });
  }

  if (/UNIQUE constraint failed: users\.username/i.test(message)) {
    throw createHttpError(409, 'Username is already taken.', 'USERNAME_EXISTS', {
      cause: error
    });
  }

  if (/no such table/i.test(message)) {
    throw createHttpError(500, 'D1 database is not initialized. Run migrations first.', 'DB_NOT_INITIALIZED', {
      cause: error
    });
  }

  throw error;
}

export const onRequest = createRoute(['POST'], async (context) => {
  const body = await readJsonBody(context.request);
  const email = normalizeEmail(body.email);

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw createHttpError(400, 'Please enter a valid email address.', 'INVALID_EMAIL');
  }

  const requestedUsername = normalizeUsername(body.username);
  const username = requestedUsername || createFallbackUsername(email);
  const name = normalizeDisplayName(body.name || username.slice(0, 12));
  const password = String(body.password || '');
  const avatar = normalizeAvatar(body.avatar);

  if (!USERNAME_PATTERN.test(username)) {
    throw createHttpError(
      400,
      'Username must be 3-32 characters and use letters, numbers, dots, underscores, or hyphens.',
      'INVALID_USERNAME'
    );
  }

  if (!name) {
    throw createHttpError(400, 'Please enter a display name.', 'INVALID_NAME');
  }

  if (name.length > 12) {
    throw createHttpError(400, 'Display name cannot exceed 12 characters.', 'INVALID_NAME');
  }

  if (password.length < 4) {
    throw createHttpError(400, 'Password must be at least 4 characters.', 'INVALID_PASSWORD');
  }

  const database = getDatabase(context.env);
  let existingUser;

  try {
    existingUser = await database
      .prepare(
        `SELECT email, username
        FROM users
        WHERE email = ? OR username = ?
        LIMIT 1`
      )
      .bind(email, username)
      .first();
  } catch (error) {
    throwDatabaseError(error);
  }

  if (existingUser) {
    const code = normalizeEmail(existingUser.email) === email ? 'EMAIL_EXISTS' : 'USERNAME_EXISTS';
    const message = code === 'EMAIL_EXISTS'
      ? 'Email is already registered.'
      : 'Username is already taken.';

    throw createHttpError(409, message, code);
  }

  const passwordState = await hashPassword(password);
  const timestamp = new Date().toISOString();

  try {
    await database
      .prepare(
        `INSERT INTO users (
          username,
          email,
          name,
          avatar,
          password_hash,
          password_salt,
          token_version,
          data_json,
          created_at,
          updated_at,
          last_login_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, '{}', ?, ?, ?)`
      )
      .bind(
        username,
        email,
        name,
        avatar,
        passwordState.hash,
        passwordState.salt,
        timestamp,
        timestamp,
        timestamp
      )
      .run();
  } catch (error) {
    throwDatabaseError(error);
  }

  let userRow;

  try {
    userRow = await database
      .prepare(
        `SELECT
          id,
          username,
          email,
          name,
          avatar,
          password_hash,
          password_salt,
          token_version,
          created_at,
          updated_at,
          last_login_at
        FROM users
        WHERE email = ?
        LIMIT 1`
      )
      .bind(email)
      .first();
  } catch (error) {
    throwDatabaseError(error);
  }

  if (!userRow) {
    throw createHttpError(500, 'User was created but could not be loaded.', 'USER_LOAD_FAILED');
  }

  const user = toUserRecord(userRow);

  return jsonResponse(context.env, {
    ok: true,
    token: await issueToken(context.env, user),
    user: toPublicUser(user)
  });
});
