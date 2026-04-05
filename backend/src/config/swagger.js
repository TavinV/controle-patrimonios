const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory API',
      version: '1.0.0',
      description: 'API REST para sistema de inventário de itens com controle de empréstimos',
    },
    servers: [{ url: 'http://localhost:3333' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Item: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Projetor Epson' },
            location: { type: 'string', example: 'Sala A1' },
            quantity_total: { type: 'integer', example: 5 },
            quantity_available: { type: 'integer', example: 3 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Loan: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            borrower_name: { type: 'string', example: 'João Silva' },
            borrower_nif: { type: 'string', example: '123456789' },
            quantity_withdrawn: { type: 'integer', example: 2 },
            quantity_returned: { type: 'integer', example: 1 },
            status: { type: 'string', enum: ['open', 'closed'], example: 'open' },
            withdrawn_at: { type: 'string', format: 'date-time' },
            item_id: { type: 'integer', example: 1 },
            item_name: { type: 'string', example: 'Projetor Epson' },
            location: { type: 'string', example: 'Sala A1' },
          },
        },
        LoanReturn: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            quantity_returned: { type: 'integer', example: 1 },
            returned_at: { type: 'string', format: 'date-time' },
            borrower_name: { type: 'string', example: 'João Silva' },
            borrower_nif: { type: 'string', example: '123456789' },
            item_name: { type: 'string', example: 'Projetor Epson' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensagem de erro' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);