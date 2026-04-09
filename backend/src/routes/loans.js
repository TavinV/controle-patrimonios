const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const loanController = require('../controllers/loanController');

// Public — kiosk withdrawal (no auth required)
router.post('/withdraw', validateBody(['item_id', 'borrower_name', 'borrower_nif', 'quantity']), loanController.withdraw);

// Admin — list all loans
router.get('/', auth, loanController.list);

module.exports = router;