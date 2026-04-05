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

  const [result] = await pool.query(
    'INSERT INTO loans (item_id, borrower_name, borrower_nif, quantity_withdrawn) VALUES (?, ?, ?, ?)',
    [item_id, borrower_name, borrower_nif, quantity]
  );

  return result;
};

const returnLoan = async (loanId, quantity) => {
  const [loanRows] = await pool.query(
    'SELECT id, status, quantity_withdrawn, quantity_returned FROM loans WHERE id = ?',
    [loanId]
  );

  if (!loanRows[0]) {
    const err = new Error('Empréstimo não encontrado');
    err.status = 404;
    throw err;
  }

  const loan = loanRows[0];

  if (loan.status === 'closed') {
    const err = new Error('Este empréstimo já foi encerrado');
    err.status = 409;
    throw err;
  }

  const pendente = loan.quantity_withdrawn - loan.quantity_returned;
  if (quantity > pendente) {
    const err = new Error(`Quantidade a devolver (${quantity}) excede o pendente (${pendente})`);
    err.status = 409;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO loan_returns (loan_id, quantity_returned) VALUES (?, ?)',
    [loanId, quantity]
  );

  return result;
};

const findAll = async (filters = {}, page = 1, limit = 10) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 items per page
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

  if (filters.status) {
    whereQuery += ' AND l.status = ?';
    params.push(filters.status);
  }

  if (filters.item_id) {
    whereQuery += ' AND l.item_id = ?';
    params.push(parseInt(filters.item_id));
  }

  if (filters.item_name) {
    whereQuery += ' AND i.name LIKE ?';
    params.push(`%${filters.item_name}%`);
  }

  // Count total records
  const countQuery = `
    SELECT COUNT(*) as total FROM loans l
    JOIN items i ON i.id = l.item_id
    ${whereQuery}
  `;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;
  const totalPages = Math.ceil(total / limit);

  // Get paginated data
  const dataQuery = `
    SELECT
      l.id,
      l.borrower_name,
      l.borrower_nif,
      l.quantity_withdrawn,
      l.quantity_returned,
      l.status,
      l.withdrawn_at,
      i.id AS item_id,
      i.name AS item_name,
      i.location
    FROM loans l
    JOIN items i ON i.id = l.item_id
    ${whereQuery}
    ORDER BY l.withdrawn_at DESC
    LIMIT ? OFFSET ?
  `;
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

const findOpen = async (filters = {}, page = 1, limit = 10) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 items per page
  const offset = (page - 1) * limit;

  let whereQuery = 'WHERE l.status = \'open\'';
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

  // Count total records
  const countQuery = `
    SELECT COUNT(*) as total FROM loans l
    JOIN items i ON i.id = l.item_id
    ${whereQuery}
  `;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;
  const totalPages = Math.ceil(total / limit);

  // Get paginated data
  const dataQuery = `
    SELECT
      l.id,
      l.borrower_name,
      l.borrower_nif,
      l.quantity_withdrawn,
      l.quantity_returned,
      l.status,
      l.withdrawn_at,
      i.id AS item_id,
      i.name AS item_name,
      i.location
    FROM loans l
    JOIN items i ON i.id = l.item_id
    ${whereQuery}
    ORDER BY l.withdrawn_at DESC
    LIMIT ? OFFSET ?
  `;
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

const findReturns = async (loanId) => {
  const [rows] = await pool.query(`
    SELECT
      lr.id,
      lr.quantity_returned,
      lr.returned_at,
      l.borrower_name,
      l.borrower_nif,
      i.name AS item_name
    FROM loan_returns lr
    JOIN loans l ON l.id = lr.loan_id
    JOIN items i ON i.id = l.item_id
    WHERE lr.loan_id = ?
    ORDER BY lr.returned_at ASC
  `, [loanId]);
  return rows;
};

module.exports = { withdraw, returnLoan, findAll, findOpen, findReturns };