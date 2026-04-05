const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const loanController = require('../controllers/loanController');

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Controle de empréstimos e devoluções
 */

/**
 * @swagger
 * /loans/withdraw:
 *   post:
 *     summary: Registrar retirada de item
 *     tags: [Loans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_id, borrower_name, borrower_nif, quantity]
 *             properties:
 *               item_id:
 *                 type: integer
 *                 example: 1
 *               borrower_name:
 *                 type: string
 *                 example: João Silva
 *               borrower_nif:
 *                 type: string
 *                 description: Exatamente 9 dígitos numéricos (NIF português)
 *                 example: '123456789'
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Retirada registrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Retirada registrada
 *                 data:
 *                   type: object
 *                   properties:
 *                     loanId:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: Campos inválidos (NIF mal-formatado, quantidade < 1)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Item não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Estoque insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/withdraw', validateBody(['item_id', 'borrower_name', 'borrower_nif', 'quantity']), loanController.withdraw);

/**
 * @swagger
 * /loans/return/{loanId}:
 *   post:
 *     summary: Registrar devolução (parcial ou total)
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do empréstimo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *     responses:
 *       200:
 *         description: Devolução registrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Devolução registrada
 *       400:
 *         description: Quantidade inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Empréstimo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Empréstimo já encerrado ou quantidade excede o pendente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/return/:loanId', validateBody(['quantity']), loanController.returnLoan);

/**
 * @swagger
 * /loans:
 *   get:
 *     summary: Listar todos os empréstimos com filtros opcionais
 *     tags: [Loans]
 *     parameters:
 *       - in: query
 *         name: borrower_name
 *         schema:
 *           type: string
 *         description: Filtrar por nome do tomador (busca parcial)
 *         example: João
 *       - in: query
 *         name: borrower_nif
 *         schema:
 *           type: string
 *         description: Filtrar por NIF (exatamente)
 *         example: '123456789'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
 *         description: Filtrar por status
 *         example: open
 *       - in: query
 *         name: item_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do item
 *         example: 1
 *       - in: query
 *         name: item_name
 *         schema:
 *           type: string
 *         description: Filtrar por nome do item (busca parcial)
 *         example: Projetor
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página (padrão 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de itens por página (padrão 10, máximo 100)
 *         example: 10
 *     responses:
 *       200:
 *         description: Log completo de empréstimos com informações de paginação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Loan'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total de registros
 *                       example: 42
 *                     limit:
 *                       type: integer
 *                       description: Itens por página
 *                       example: 10
 *                     currentPage:
 *                       type: integer
 *                       description: Página atual
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       description: Total de páginas
 *                       example: 5
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', auth, loanController.list);

/**
 * @swagger
 * /loans/open:
 *   get:
 *     summary: Listar apenas empréstimos em aberto com filtros opcionais
 *     tags: [Loans]
 *     parameters:
 *       - in: query
 *         name: borrower_name
 *         schema:
 *           type: string
 *         description: Filtrar por nome do tomador (busca parcial)
 *         example: João
 *       - in: query
 *         name: borrower_nif
 *         schema:
 *           type: string
 *         description: Filtrar por NIF (exatamente)
 *         example: '123456789'
 *       - in: query
 *         name: item_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do item
 *         example: 1
 *       - in: query
 *         name: item_name
 *         schema:
 *           type: string
 *         description: Filtrar por nome do item (busca parcial)
 *         example: Projetor
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página (padrão 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de itens por página (padrão 10, máximo 100)
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de empréstimos com status open e informações de paginação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Loan'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total de registros
 *                       example: 15
 *                     limit:
 *                       type: integer
 *                       description: Itens por página
 *                       example: 10
 *                     currentPage:
 *                       type: integer
 *                       description: Página atual
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       description: Total de páginas
 *                       example: 2
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/open', loanController.listOpen);

/**
 * @swagger
 * /loans/{loanId}/returns:
 *   get:
 *     summary: Histórico de devoluções de um empréstimo
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Lista de devoluções do empréstimo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LoanReturn'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:loanId/returns', auth, loanController.listReturns);

module.exports = router;