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
  const [result] = await pool.query('DELETE FROM items WHERE id = ?', [id]);
  return result;
};

const importFromExcel = async (items) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    const rowNumber = i + 2; // Excel row number (1-based, +1 for header)

    try {
      // Validate required fields
      if (!row.name || !row.name.trim()) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: 'Coluna "name" é obrigatória'
        });
        continue;
      }

      if (!row.location || !row.location.trim()) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: 'Coluna "location" é obrigatória'
        });
        continue;
      }

      if (row.quantity_total === undefined || row.quantity_total === '' || row.quantity_total === null) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: 'Coluna "quantity_total" é obrigatória'
        });
        continue;
      }

      const quantity_total = parseInt(row.quantity_total);
      if (isNaN(quantity_total) || quantity_total < 1) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: 'quantity_total deve ser um número maior que zero'
        });
        continue;
      }

      // quantity_available defaults to quantity_total if not provided
      let quantity_available = quantity_total;
      if (row.quantity_available !== undefined && row.quantity_available !== '' && row.quantity_available !== null) {
        quantity_available = parseInt(row.quantity_available);
        if (isNaN(quantity_available) || quantity_available < 0 || quantity_available > quantity_total) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'quantity_available deve estar entre 0 e quantity_total'
          });
          continue;
        }
      }

      // Insert item
      await pool.query(
        'INSERT INTO items (name, location, quantity_total, quantity_available) VALUES (?, ?, ?, ?)',
        [row.name.trim(), row.location.trim(), quantity_total, quantity_available]
      );

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        row: rowNumber,
        error: err.message || 'Erro ao processar linha'
      });
    }
  }

  return results;
};

module.exports = { findAll, findById, create, update, remove, importFromExcel };