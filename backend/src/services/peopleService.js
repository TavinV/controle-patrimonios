const pool = require('../config/db');

const findAll = async (filters = {}, page = 1, limit = 20) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit) || 20));
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  if (filters.nif) {
    where += ' AND nif LIKE ?';
    params.push(`%${filters.nif}%`);
  }
  if (filters.name) {
    where += ' AND name LIKE ?';
    params.push(`%${filters.name}%`);
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM people ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT id, nif, name, created_at FROM people ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows,
    pagination: { total, limit, currentPage: page, totalPages: Math.ceil(total / limit) },
  };
};

const findByNif = async (nif) => {
  const [rows] = await pool.query('SELECT id, nif, name FROM people WHERE nif = ?', [nif]);
  return rows[0] || null;
};

const create = async ({ nif, name }) => {
  const [result] = await pool.query(
    'INSERT INTO people (nif, name) VALUES (?, ?)',
    [nif, name.trim()]
  );
  return result;
};

const update = async (id, { nif, name }) => {
  const [result] = await pool.query(
    'UPDATE people SET nif = ?, name = ? WHERE id = ?',
    [nif, name.trim(), id]
  );
  return result;
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM people WHERE id = ?', [id]);
  return result;
};

module.exports = { findAll, findByNif, create, update, remove };
