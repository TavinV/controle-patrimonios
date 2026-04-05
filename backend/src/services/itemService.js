const pool = require('../config/db');

const findAll = async (filters = {}, page = 1, limit = 10) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 items per page
  const offset = (page - 1) * limit;

  let whereQuery = 'WHERE 1=1';
  const params = [];

  if (filters.name) {
    whereQuery += ' AND name LIKE ?';
    params.push(`%${filters.name}%`);
  }

  if (filters.location) {
    whereQuery += ' AND location LIKE ?';
    params.push(`%${filters.location}%`);
  }

  if (filters.quantity_available_min !== undefined) {
    whereQuery += ' AND quantity_available >= ?';
    params.push(parseInt(filters.quantity_available_min));
  }

  if (filters.quantity_available_max !== undefined) {
    whereQuery += ' AND quantity_available <= ?';
    params.push(parseInt(filters.quantity_available_max));
  }

  if (filters.quantity_total_min !== undefined) {
    whereQuery += ' AND quantity_total >= ?';
    params.push(parseInt(filters.quantity_total_min));
  }

  if (filters.quantity_total_max !== undefined) {
    whereQuery += ' AND quantity_total <= ?';
    params.push(parseInt(filters.quantity_total_max));
  }

  // Count total records
  const countQuery = `SELECT COUNT(*) as total FROM items ${whereQuery}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;
  const totalPages = Math.ceil(total / limit);

  // Get paginated data
  const dataQuery = `SELECT id, name, location, quantity_total, quantity_available, created_at FROM items ${whereQuery} ORDER BY name ASC LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    data: rows,
    pagination: {
      total,
      limit,
      currentPage: page,
      totalPages,
    },
  };
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, name, location, quantity_total, quantity_available, created_at, updated_at FROM items WHERE id = ?',
    [id]
  );
  return rows[0];
};

const create = async ({ name, location, quantity_total }) => {
  const [result] = await pool.query(
    'INSERT INTO items (name, location, quantity_total, quantity_available) VALUES (?, ?, ?, ?)',
    [name, location, quantity_total, quantity_total]
  );
  return result;
};

const update = async (id, updates) => {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.location !== undefined) {
    fields.push('location = ?');
    values.push(updates.location);
  }

  if (updates.quantity_total !== undefined) {
    fields.push('quantity_total = ?');
    values.push(updates.quantity_total);

    // If quantity_total is reduced, adjust quantity_available accordingly
    const [rows] = await pool.query('SELECT quantity_available FROM items WHERE id = ?', [id]);
    const item = rows[0];

    if (item && item.quantity_available > updates.quantity_total) {
      fields.push('quantity_available = ?');
      values.push(updates.quantity_total);
    }
  }

  if (fields.length === 0) {
    return { affectedRows: 0 };
  }

  values.push(id);
  const query = `UPDATE items SET ${fields.join(', ')} WHERE id = ?`;

  const [result] = await pool.query(query, values);
  return result;
};

const remove = async (id) => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as total FROM loans WHERE item_id = ? AND status = 'open'",
    [id]
  );

  if (rows[0].total > 0) {
    const err = new Error('Item possui empréstimos em aberto');
    err.status = 409;
    throw err;
  }

  const [result] = await pool.query('DELETE FROM items WHERE id = ?', [id]);
  return result;
};

module.exports = { findAll, findById, create, update, remove };