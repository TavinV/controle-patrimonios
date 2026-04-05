-- =============================================================
-- Migration: CPF → NIF
-- Tabela: loans
-- Renomeia a coluna borrower_cpf (CHAR 11) para borrower_nif (CHAR 9)
-- Execute dentro de uma transação para garantir rollback em caso de erro
-- =============================================================

START TRANSACTION;

-- 1. Adiciona a nova coluna borrower_nif
ALTER TABLE loans
  ADD COLUMN borrower_nif CHAR(9) NOT NULL DEFAULT '' AFTER borrower_name;

-- 2. Copia os dados existentes (trunca para 9 chars se houver dados legados)
UPDATE loans
  SET borrower_nif = LEFT(borrower_cpf, 9);

-- 3. Remove a coluna antiga
ALTER TABLE loans
  DROP COLUMN borrower_cpf;

COMMIT;

-- =============================================================
-- Rollback manual (caso necessário antes do COMMIT):
-- ROLLBACK;
-- =============================================================