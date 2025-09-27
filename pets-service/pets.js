const { getPool } = require('./db');

async function list() {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT id, name, species, createdAt FROM pets ORDER BY id DESC');
  return rows;
}

async function create({ name, species }) {
  const pool = await getPool();
  const [res] = await pool.query('INSERT INTO pets (name, species) VALUES (?, ?)', [name, species]);
  const [rows] = await pool.query('SELECT id, name, species, createdAt FROM pets WHERE id = ?', [res.insertId]);
  return rows[0];
}

async function get(id) {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT id, name, species, createdAt FROM pets WHERE id = ?', [id]);
  return rows[0] || null;
}

async function update(id, data) {
  const pool = await getPool();
  const fields = []; const values = [];
  if (typeof data.name === 'string' && data.name.trim()) { fields.push('name = ?'); values.push(data.name.trim()); }
  if (typeof data.species === 'string' && data.species.trim()) { fields.push('species = ?'); values.push(data.species.trim()); }
  if (!fields.length) return await get(id);
  values.push(id);
  await pool.query(`UPDATE pets SET ${fields.join(', ')} WHERE id = ?`, values);
  return await get(id);
}

async function remove(id) {
  const pool = await getPool();
  const [res] = await pool.query('DELETE FROM pets WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

module.exports = { list, create, get, update, remove };
