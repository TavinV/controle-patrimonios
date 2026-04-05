const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query('SELECT id, username, password_hash FROM admin_users WHERE username = ?', [username]);
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({ token, expiresIn: process.env.JWT_EXPIRES_IN });
  } catch (err) {
    next(err);
  }
};

const setup = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    res.status(201).json({ message: 'Admin criado com sucesso', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username já existe' });
    }
    next(err);
  }
};

module.exports = { login, setup };
