const fs = require('node:fs/promises');
const path = require('node:path');

const DATA_DIR = process.env.TUOLE_DATA_DIR
  ? path.resolve(process.env.TUOLE_DATA_DIR)
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tuole-db.json');
const EMPTY_DATABASE = {
  nextUserId: 1,
  users: []
};

let mutationQueue = Promise.resolve();

function isPlainObject(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype;
}

function cloneJson(value, fallbackValue) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return fallbackValue;
  }
}

function normalizeDatabase(rawDatabase) {
  const source = isPlainObject(rawDatabase) ? rawDatabase : EMPTY_DATABASE;
  const nextUserId = Number.isInteger(source.nextUserId) && source.nextUserId > 0
    ? source.nextUserId
    : 1;
  const users = Array.isArray(source.users)
    ? source.users
        .filter((user) => isPlainObject(user))
        .map((user) => ({
          id: Number.isInteger(user.id) ? user.id : 0,
          email: typeof user.email === 'string' ? user.email : '',
          name: typeof user.name === 'string' ? user.name : '用户',
          avatar: typeof user.avatar === 'string' && user.avatar.trim() ? user.avatar : '👤',
          passwordHash: typeof user.passwordHash === 'string' ? user.passwordHash : '',
          passwordSalt: typeof user.passwordSalt === 'string' ? user.passwordSalt : '',
          tokenVersion:
            Number.isInteger(user.tokenVersion) && user.tokenVersion >= 0
              ? user.tokenVersion
              : 0,
          createdAt: typeof user.createdAt === 'string' ? user.createdAt : '',
          updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : '',
          lastLoginAt: typeof user.lastLoginAt === 'string' ? user.lastLoginAt : '',
          data: isPlainObject(user.data) ? cloneJson(user.data, {}) : {}
        }))
        .filter((user) => user.id > 0 && user.email)
    : [];

  return {
    nextUserId,
    users
  };
}

function toIsoNow() {
  return new Date().toISOString();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeDisplayName(name) {
  return String(name || '').trim();
}

function normalizeAvatar(avatar) {
  const value = String(avatar || '').trim();
  return value || '👤';
}

function sanitizeUserData(data) {
  return isPlainObject(data) ? cloneJson(data, {}) : {};
}

async function ensureDatabaseFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
      await fs.access(DB_FILE);
    } catch (error) {
      await fs.writeFile(DB_FILE, `${JSON.stringify(EMPTY_DATABASE, null, 2)}\n`, 'utf8');
    }
  } catch (error) {
    if (['EROFS', 'EPERM', 'EACCES'].includes(error.code)) {
      const { createHttpError } = require('./http');

      throw createHttpError(
        500,
        '当前部署环境不支持本地文件持久化，请改用带持久磁盘的 Node 部署或数据库存储',
        'PERSISTENCE_UNAVAILABLE',
        { cause: error }
      );
    }

    throw error;
  }
}

async function readDatabase() {
  await ensureDatabaseFile();

  const rawText = await fs.readFile(DB_FILE, 'utf8');

  if (!rawText.trim()) {
    return normalizeDatabase(EMPTY_DATABASE);
  }

  try {
    return normalizeDatabase(JSON.parse(rawText));
  } catch (error) {
    const { createHttpError } = require('./http');

    throw createHttpError(
      500,
      '数据文件已损坏，无法读取，请先修复或恢复备份',
      'DATA_CORRUPTED',
      { cause: error }
    );
  }
}

async function writeDatabase(database) {
  const normalizedDatabase = normalizeDatabase(database);
  const payload = `${JSON.stringify(normalizedDatabase, null, 2)}\n`;
  const tempFile = `${DB_FILE}.tmp`;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(tempFile, payload, 'utf8');
    await fs.rename(tempFile, DB_FILE);
  } catch (error) {
    if (['EROFS', 'EPERM', 'EACCES'].includes(error.code)) {
      const { createHttpError } = require('./http');

      throw createHttpError(
        500,
        '当前部署环境不支持本地文件持久化，请改用带持久磁盘的 Node 部署或数据库存储',
        'PERSISTENCE_UNAVAILABLE',
        { cause: error }
      );
    }

    throw error;
  }
}

function runMutation(task) {
  const nextTask = async () => {
    const database = await readDatabase();
    const result = await task(database);

    await writeDatabase(database);
    return result;
  };

  mutationQueue = mutationQueue.then(nextTask, nextTask);
  return mutationQueue;
}

function findUserByEmail(database, email) {
  const normalizedEmail = normalizeEmail(email);
  return database.users.find((user) => user.email === normalizedEmail) || null;
}

function findUserById(database, userId) {
  return database.users.find((user) => user.id === Number(userId)) || null;
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar
  };
}

function createUser(database, input) {
  const timestamp = toIsoNow();
  const user = {
    id: database.nextUserId,
    email: normalizeEmail(input.email),
    name: normalizeDisplayName(input.name) || '用户',
    avatar: normalizeAvatar(input.avatar),
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
    tokenVersion: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: timestamp,
    data: {}
  };

  database.nextUserId += 1;
  database.users.push(user);

  return user;
}

function markUserUpdated(user) {
  user.updatedAt = toIsoNow();
}

module.exports = {
  DB_FILE,
  createUser,
  findUserByEmail,
  findUserById,
  normalizeAvatar,
  normalizeDisplayName,
  normalizeEmail,
  readDatabase,
  runMutation,
  sanitizeUserData,
  toIsoNow,
  toPublicUser,
  markUserUpdated
};
