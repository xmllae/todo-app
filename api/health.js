const { createRoute, sendJson } = require('./_shared/http');
const { DB_FILE, readDatabase } = require('./_shared/storage');

const handleHealth = createRoute(['GET'], async (req, res) => {
  const database = await readDatabase();

  sendJson(res, 200, {
    ok: true,
    runtime: 'node',
    storage: {
      driver: 'file',
      path: DB_FILE,
      users: Array.isArray(database.users) ? database.users.length : 0
    }
  });
});

module.exports = handleHealth;
module.exports.default = handleHealth;
