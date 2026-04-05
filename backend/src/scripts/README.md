# Scripts de Banco de Dados

Pasta contendo scripts de inicialização e migração do banco de dados.

## Arquivos

### `init_db.sql`
Script SQL que cria o banco de dados, tabelas e triggers automaticamente.

**Conteúdo:**
- CREATE DATABASE inventory_db (se não existir)
- Tabelas: admin_users, items, loans, loan_returns
- Triggers: trg_after_loan_withdraw, trg_after_loan_return
- Índices para performance

**Uso manual:**
```bash
mysql -h 127.0.0.1 -u root -p < src/scripts/init_db.sql
```

### `initDb.js`
Script Node.js que executa `init_db.sql` automaticamente.

**Ativado automaticamente:**
- Chamado ao iniciar o servidor (`npm start`)
- Cria banco de dados e tabelas se não existirem
- Sem necessidade de execução manual em produção

### `migrate_cpf_to_nif.sql`
Script de migração que renomeia a coluna `borrower_cpf` para `borrower_nif`.

**Uso manual (se necessário):**
```bash
mysql -h 127.0.0.1 -u root -p inventory_db < src/scripts/migrate_cpf_to_nif.sql
```

## Fluxo de Inicialização

1. **App start:** `npm start` ou `node src/app.js`
2. **Variáveis de ambiente carregadas:** `.env`
3. **initDb.js executado:**
   - Conecta ao MySQL (sem selecionar DB)
   - Lê e executa `init_db.sql`
   - Ignora erros de "já existe"
   - Confirma sucesso no console
4. **Servidor inicia:** escuta na porta 3333
5. **Swagger docs:** disponível em http://localhost:3333/docs