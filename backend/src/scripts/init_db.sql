-- =============================================================
-- Database Initialization Script
-- Cria banco de dados, tabelas e triggers para o sistema de inventário
-- =============================================================

-- 1. Cria o banco de dados (se não existir)
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- 2. Tabela: admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela: items
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  quantity_total INT NOT NULL DEFAULT 0,
  quantity_available INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela: people (registo de titulares de NIF)
CREATE TABLE IF NOT EXISTS people (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nif VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabela: loans
CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  borrower_name VARCHAR(150) NOT NULL,
  borrower_nif VARCHAR(20) NOT NULL,
  quantity_withdrawn INT NOT NULL,
  withdrawn_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- TRIGGERS (sem DELIMITER para compatibilidade com mysql2)
-- =============================================================

-- 6. Trigger: ao inserir em loans, desconta quantity_available em items
DROP TRIGGER IF EXISTS trg_after_loan_withdraw;
CREATE TRIGGER trg_after_loan_withdraw
  AFTER INSERT ON loans
  FOR EACH ROW
  UPDATE items SET quantity_available = quantity_available - NEW.quantity_withdrawn WHERE id = NEW.item_id;

-- =============================================================
-- Índices adicionais para performance (podem falhar se já existem - isso é normal)
-- =============================================================
ALTER TABLE loans ADD INDEX idx_loans_borrower_nif (borrower_nif);
ALTER TABLE items ADD INDEX idx_items_name (name);
ALTER TABLE people ADD INDEX idx_people_nif (nif);

-- =============================================================
-- Script concluído com sucesso
-- =============================================================