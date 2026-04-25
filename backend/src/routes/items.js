const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const itemController = require('../controllers/itemController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Gerenciamento de itens do inventário
 */

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Listar todos os itens com filtros opcionais
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nome (busca parcial)
 *         example: Projetor
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filtrar por localização (busca parcial)
 *         example: Sala A
 *       - in: query
 *         name: quantity_available_min
 *         schema:
 *           type: integer
 *         description: Quantidade disponível mínima
 *         example: 1
 *       - in: query
 *         name: quantity_available_max
 *         schema:
 *           type: integer
 *         description: Quantidade disponível máxima
 *         example: 10
 *       - in: query
 *         name: quantity_total_min
 *         schema:
 *           type: integer
 *         description: Quantidade total mínima
 *         example: 5
 *       - in: query
 *         name: quantity_total_max
 *         schema:
 *           type: integer
 *         description: Quantidade total máxima
 *         example: 20
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
 *         description: Lista de itens com informações de paginação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Item'
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
router.get('/', itemController.list);

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Buscar item por ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     responses:
 *       200:
 *         description: Dados do item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item não encontrado
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
router.get('/:id', auth, itemController.getOne);

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Criar novo item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location, quantity_total]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Projetor Epson
 *               location:
 *                 type: string
 *                 example: Sala A1
 *               quantity_total:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Item criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Item criado
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Campos obrigatórios ausentes
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
router.post('/', auth, validateBody(['name', 'location', 'quantity_total']), itemController.create);

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Atualizar item (patch parcial)
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Projetor Epson XL
 *               location:
 *                 type: string
 *                 example: Sala B2
 *               quantity_total:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Item atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Item atualizado
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', auth, itemController.update);

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Remover item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     responses:
 *       200:
 *         description: Item removido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Item removido
 *       409:
 *         description: Item possui empréstimos em aberto
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
router.delete('/:id', auth, itemController.remove);

/**
 * @swagger
 * /items/template/download:
 *   get:
 *     summary: Descarregar template Excel para importação de itens
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Arquivo template em formato Excel
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/template/download', auth, itemController.getTemplate);

/**
 * @swagger
 * /items/import:
 *   post:
 *     summary: Importar itens de arquivo Excel
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo Excel (.xlsx) com os itens
 *     responses:
 *       200:
 *         description: Importação concluída
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Importação concluída
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: integer
 *                       description: Número de itens importados com sucesso
 *                       example: 5
 *                     failed:
 *                       type: integer
 *                       description: Número de itens com erro
 *                       example: 1
 *                     errors:
 *                       type: array
 *                       description: Lista de erros encontrados
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                             description: Número da linha no Excel
 *                           error:
 *                             type: string
 *                             description: Mensagem de erro
 *       400:
 *         description: Arquivo inválido ou vazio
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
router.post('/import', auth, upload.single('file'), itemController.importFromExcel);

module.exports = router;