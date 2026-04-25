-- =============================================================
-- Migration: Alterar NIF de CHAR(9) para VARCHAR(20)
-- =============================================================

USE inventory_db;

-- 1. Alterar tabela people
ALTER TABLE people MODIFY COLUMN nif VARCHAR(20) NOT NULL;

-- 2. Alterar tabela loans
ALTER TABLE loans MODIFY COLUMN borrower_nif VARCHAR(20) NOT NULL;

-- =============================================================
-- Migration concluída com sucesso
-- =============================================================
