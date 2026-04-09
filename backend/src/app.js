const dotenv = require('dotenv');
const path = require('path');

// Carrega .env do diretório backend (relativo ao repo root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { initializeDatabase } = require('./scripts/initDb');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const loanRoutes = require('./routes/loans');
const peopleRoutes = require('./routes/people');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/items', itemRoutes);
app.use('/loans', loanRoutes);
app.use('/people', peopleRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erro interno' });
});

const PORT = process.env.PORT || 3333;

// Inicializa banco de dados e depois inicia o servidor
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Swagger disponível em http://localhost:${PORT}/docs`);
    });
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err.message);
    process.exit(1);
  }
};

startServer();