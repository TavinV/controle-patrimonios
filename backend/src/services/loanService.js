const pool = require('../config/db');

const withdraw = async ({ item_id, borrower_name, borrower_nif, quantity }) => {
  const [itemRows] = await pool.query(
    'SELECT id, name, quantity_available FROM items WHERE id = ?',
    [item_id]
  );

  if (!itemRows[0]) {
    const err = new Error('Item não encontrado');
    err.status = 404;
    throw err;
  }

  const item = itemRows[0];
  if (item.quantity_available < quantity) {
    const err = new Error(`Estoque insuficiente. Disponível: ${item.quantity_available}`);
    err.status = 409;
    throw err;
  }

  // Sanitize NIF to max 20 chars
  const sanitizedNif = String(borrower_nif).trim().substring(0, 20);

  const [result] = await pool.query(
    'INSERT INTO loans (item_id, borrower_name, borrower_nif, quantity_withdrawn) VALUES (?, ?, ?, ?)',
    [item_id, borrower_name, sanitizedNif, quantity]
  );

  return result;
};

const findAll = async (filters = {}, page = 1, limit = 10) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const offset = (page - 1) * limit;

  let whereQuery = 'WHERE 1=1';
  const params = [];

  if (filters.borrower_name) {
    whereQuery += ' AND l.borrower_name LIKE ?';
    params.push(`%${filters.borrower_name}%`);
  }

  if (filters.borrower_nif) {
    whereQuery += ' AND l.borrower_nif = ?';
    params.push(filters.borrower_nif);
  }

  if (filters.item_id) {
    whereQuery += ' AND l.item_id = ?';
    params.push(parseInt(filters.item_id));
  }

  if (filters.item_name) {
    whereQuery += ' AND i.name LIKE ?';
    params.push(`%${filters.item_name}%`);
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM loans l JOIN items i ON i.id = l.item_id ${whereQuery}`,
    params
  );
  const totalPages = Math.ceil(total / limit);

  const [rows] = await pool.query(
    `SELECT
      l.id,
      l.borrower_name,
      l.borrower_nif,
      l.quantity_withdrawn,
      l.withdrawn_at,
      i.id AS item_id,
      i.name AS item_name,
      i.location
    FROM loans l
    JOIN items i ON i.id = l.item_id
    ${whereQuery}
    ORDER BY l.withdrawn_at DESC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows,
    pagination: { total, limit, currentPage: page, totalPages },
  };
};

module.exports = { withdraw, findAll };
