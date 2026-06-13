import { createHttpError } from './http.js';

function isPlainObject(value) {
  return !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

function cloneJson(value, fallbackValue) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return fallbackValue;
  }
}

export function toIsoNow() {
  return new Date().toISOString();
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

export function normalizeDisplayName(name) {
  return String(name || '').trim();
}

export function normalizeAvatar(avatar) {
  const value = String(avatar || '').trim();
  return value || '👤';
}

export function sanitizeUserData(data) {
  return isPlainObject(data) ? cloneJson(data, {}) : {};
}

function getDatabase(env) {
  if (!env || !env.DB) {
    throw createHttpError(500, '当前环境缺少 D1 数据库绑定 DB', 'D1_BINDING_MISSING');
  }

  return env.DB;
}

function normalizeDatabaseError(error) {
  const message = String((error && error.message) || '');

  if (/no such table/i.test(message)) {
    throw createHttpError(
      500,
      '数据库尚未初始化，请先执行 D1 迁移',
      'DB_NOT_INITIALIZED',
      { cause: error }
    );
  }

  throw error;
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    avatar: user.avatar
  };
}

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  let parsedData = {};

  try {
    parsedData = row.data_json ? JSON.parse(row.data_json) : {};
  } catch (error) {
    parsedData = {};
  }

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
    lastLoginAt: row.last_login_at || '',
    data: sanitizeUserData(parsedData)
  };
}

async function querySingleUser(env, sql, bindings) {
  try {
    const row = await getDatabase(env).prepare(sql).bind(...bindings).first();
    return mapUserRow(row);
  } catch (error) {
    normalizeDatabaseError(error);
  }
}

export async function getUserByEmail(env, email) {
  return querySingleUser(
    env,
    `SELECT
      id,
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
    FROM users
    WHERE email = ?
    LIMIT 1`,
    [normalizeEmail(email)]
  );
}

export async function getUserById(env, userId) {
  return querySingleUser(
    env,
    `SELECT
      id,
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
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [Number(userId)]
  );
}

export async function requireSessionUser(context, session) {
  const user = await getUserById(context.env, session.userId);

  if (!user || user.tokenVersion !== session.tokenVersion) {
    throw createHttpError(401, '登录状态已过期，请重新登录', 'TOKEN_EXPIRED');
  }

  return user;
}

export async function createUserRecord(env, input) {
  const database = getDatabase(env);
  const timestamp = toIsoNow();

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
        normalizeUsername(input.username),
        normalizeEmail(input.email),
        normalizeDisplayName(input.name) || '用户',
        normalizeAvatar(input.avatar),
        input.passwordHash,
        input.passwordSalt,
        timestamp,
        timestamp,
        timestamp
      )
      .run();
  } catch (error) {
    const message = String((error && error.message) || '');

    if (/UNIQUE constraint failed: users\.email/i.test(message)) {
      throw createHttpError(409, '该邮箱已注册，请直接登录', 'EMAIL_EXISTS', {
        cause: error
      });
    }

    if (/UNIQUE constraint failed: users\.username/i.test(message)) {
      throw createHttpError(409, 'Username is already taken.', 'USERNAME_EXISTS', {
        cause: error
      });
    }

    normalizeDatabaseError(error);
  }

  return getUserByEmail(env, input.email);
}

export async function touchUserLogin(env, userId) {
  const database = getDatabase(env);
  const timestamp = toIsoNow();

  try {
    await database
      .prepare(
        `UPDATE users
        SET last_login_at = ?, updated_at = ?
        WHERE id = ?`
      )
      .bind(timestamp, timestamp, Number(userId))
      .run();
  } catch (error) {
    normalizeDatabaseError(error);
  }
}

export async function updateUserData(env, userId, data) {
  const database = getDatabase(env);
  const sanitizedData = sanitizeUserData(data);

  try {
    await database
      .prepare(
        `UPDATE users
        SET data_json = ?, updated_at = ?
        WHERE id = ?`
      )
      .bind(JSON.stringify(sanitizedData), toIsoNow(), Number(userId))
      .run();
  } catch (error) {
    normalizeDatabaseError(error);
  }
}

export async function updateUserProfile(env, input) {
  const database = getDatabase(env);
  const timestamp = toIsoNow();

  try {
    await database
      .prepare(
        `UPDATE users
        SET
          name = ?,
          avatar = ?,
          password_hash = ?,
          password_salt = ?,
          token_version = ?,
          updated_at = ?
        WHERE id = ?`
      )
      .bind(
        normalizeDisplayName(input.name) || '用户',
        normalizeAvatar(input.avatar),
        input.passwordHash,
        input.passwordSalt,
        Number(input.tokenVersion),
        timestamp,
        Number(input.userId)
      )
      .run();
  } catch (error) {
    normalizeDatabaseError(error);
  }
}

export async function invalidateUserToken(env, userId, nextTokenVersion) {
  const database = getDatabase(env);

  try {
    await database
      .prepare(
        `UPDATE users
        SET token_version = ?, updated_at = ?
        WHERE id = ?`
      )
      .bind(Number(nextTokenVersion), toIsoNow(), Number(userId))
      .run();
  } catch (error) {
    normalizeDatabaseError(error);
  }
}

export async function getHealthSummary(env) {
  const database = getDatabase(env);

  try {
    const tableRow = await database
      .prepare(
        `SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'users'
        LIMIT 1`
      )
      .first();

    if (!tableRow) {
      return {
        migrationsApplied: false,
        users: 0
      };
    }

    const countRow = await database
      .prepare('SELECT COUNT(*) AS total FROM users')
      .first();

    return {
      migrationsApplied: true,
      users: Number((countRow && countRow.total) || 0)
    };
  } catch (error) {
    normalizeDatabaseError(error);
  }
}

export { toPublicUser };
