const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Carrega .env do diretório backend (relativo ao repo root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Inicializa o banco de dados executando o script init_db.sql e criando admin
 */
const initializeDatabase = async () => {
  let connection;
  let dbConnection;
  try {
    console.log('[DB] Conectando ao MySQL com credenciais do .env...');
    console.log(`[DB] Host: ${process.env.DB_HOST}, User: ${process.env.DB_USER}`);
    
    // Conexão inicial para criar banco (sem selecionar database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });

    console.log('[DB] ✓ Conectado ao MySQL');
    console.log('[DB] Criando banco de dados...');

    // Cria o banco
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
    console.log(`[DB] ✓ Banco ${process.env.DB_NAME} criado/verificado`);

    // Fecha primeira conexão
    await connection.end();

    // Nova conexão já selecionando o banco
    console.log('[DB] Conectando ao banco de dados específico...');
    dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    });

    console.log('[DB] ✓ Conectado ao banco de dados');
    console.log('[DB] Iniciando criação de tabelas...');

    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, 'init_db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Parse statements mais cuidadoso
    // Remove linhas de comentário
    let cleanContent = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');

    // Remove CREATE DATABASE e USE statements (já foram feitos)
    cleanContent = cleanContent
      .replace(/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+[^;]*;/gi, '')
      .replace(/USE\s+[^;]*;/gi, '');

    // Separa statements por ponto-e-vírgula
    const statements = cleanContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Executa cada statement
    for (const statement of statements) {
      try {
        await dbConnection.query(statement);
      } catch (err) {
        // Ignora erros esperados
        if (!err.message.includes('already exists') && !err.code === 'ER_TRG_DOES_NOT_EXIST') {
          if (err.message.includes("doesn't exist")) {
            // Silenciosamente ignora tabelas não encontradas
          } else {
            console.warn(`[DB] Aviso: ${err.message}`);
          }
        }
      }
    }

    console.log('[DB] ✓ Tabelas criadas com sucesso');

    // Cria admin com credenciais do .env (se não existir)
    console.log('[DB] Verificando/criando usuário administrativo...');
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const [existing] = await dbConnection.query(
      'SELECT id FROM admin_users WHERE username = ?',
      [adminUsername]
    );

    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await dbConnection.query(
        'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
        [adminUsername, passwordHash]
      );
      console.log(`[DB] ✓ Admin "${adminUsername}" criado com sucesso`);
    } else {
      console.log(`[DB] ✓ Admin "${adminUsername}" já existe`);
    }

    console.log('[DB] ✓ Banco de dados inicializado com sucesso');
  } catch (err) {
    console.error('[DB] ✗ Erro ao inicializar banco de dados:', err.message);
    throw err;
  } finally {
    if (connection) {
      await connection.end().catch(() => {});
    }
    if (dbConnection) {
      await dbConnection.end().catch(() => {});
    }
  }
};

module.exports = { initializeDatabase };