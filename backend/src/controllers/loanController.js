const loanService = require('../services/loanService');

const withdraw = async (req, res, next) => {
  try {
    const { item_id, borrower_name, borrower_nif, quantity } = req.body;

    // Validate NIF (1-20 digits)
    if (!/^\d{1,20}$/.test(borrower_nif)) {
      return res.status(400).json({ error: 'NIF deve conter entre 1 e 20 dígitos numéricos' });
    }

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
    }

    const result = await loanService.withdraw({ item_id, borrower_name, borrower_nif, quantity });
    res.status(201).json({ message: 'Retirada registrada', data: { loanId: result.insertId } });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.borrower_name) filters.borrower_name = req.query.borrower_name;
    if (req.query.borrower_nif)  filters.borrower_nif  = req.query.borrower_nif;
    if (req.query.item_id)       filters.item_id        = req.query.item_id;
    if (req.query.item_name)     filters.item_name      = req.query.item_name;

    const result = await loanService.findAll(filters, req.query.page, req.query.limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { withdraw, list };
