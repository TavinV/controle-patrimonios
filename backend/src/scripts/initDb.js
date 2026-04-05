const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs');

// Carrega .env do diretório backend (relativo ao repo root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Inicializa o banco de dados executando o script init_db.sql
 */
const initializeDatabase = async () => {
  let connection;
  try {
    console.log('[DB] Conectando ao MySQL com credenciais do .env...');
    console.log(`[DB] Host: ${process.env.DB_HOST}, User: ${process.env.DB_USER}`);
    
    // Conexão inicial para criar banco se não existir
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });

    console.log('[DB] ✓ Conectado ao MySQL');
    console.log('[DB] Iniciando criação de banco de dados e tabelas...');

    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, 'init_db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Divide por "CREATE TRIGGER" ou "DROP TRIGGER" para evitar problemas com BEGIN/END
    const triggerMatches = sqlContent.match(/CREATE TRIGGER[\s\S]*?END;/g) || [];
    const dropTriggerMatches = sqlContent.match(/DROP TRIGGER IF EXISTS[\s\S]*?;/g) || [];
    
    // Remove triggers do conteúdo principal
    let mainSql = sqlContent;
    triggerMatches.forEach(trigger => {
      mainSql = mainSql.replace(trigger, '');
    });
    dropTriggerMatches.forEach(dropTrigger => {
      mainSql = mainSql.replace(dropTrigger, '');
    });

    // Executa SQL principal (sem triggers)
    const mainStatements = mainSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of mainStatements) {
      try {
        await connection.query(statement);
      } catch (err) {
        if (err.code !== 'ER_DB_CREATE_EXISTS' && err.code !== 'ER_TABLE_EXISTS_ERROR') {
          console.warn(`[DB] Aviso ao executar statement: ${err.message}`);
        }
      }
    }

    // Executa DROP TRIGGER (se houver)
    for (const dropTrigger of dropTriggerMatches) {
      try {
        await connection.query(dropTrigger);
      } catch (err) {
        // Ignora erros ao dropar triggers que não existem
        if (err.code !== 'ER_TRG_DOES_NOT_EXIST') {
          console.warn(`[DB] Aviso ao dropar trigger: ${err.message}`);
        }
      }
    }

    // Executa CREATE TRIGGER
    for (const trigger of triggerMatches) {
      try {
        await connection.query(trigger);
      } catch (err) {
        console.warn(`[DB] Aviso ao criar trigger: ${err.message}`);
      }
    }

    console.log('[DB] ✓ Banco de dados inicializado com sucesso');
  } catch (err) {
    console.error('[DB] ✗ Erro ao inicializar banco de dados:', err.message);
    throw err;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = { initializeDatabase };