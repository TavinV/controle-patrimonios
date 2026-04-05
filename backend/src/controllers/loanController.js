const loanService = require('../services/loanService');

const withdraw = async (req, res, next) => {
  try {
    const { item_id, borrower_name, borrower_nif, quantity } = req.body;

    // Validate NIF (9 digits)
    if (!/^\d{9}$/.test(borrower_nif)) {
      return res.status(400).json({ error: 'NIF deve conter exatamente 9 dígitos numéricos' });
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

const returnLoan = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
    }

    await loanService.returnLoan(loanId, quantity);
    res.status(200).json({ message: 'Devolução registrada' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const filters = {
      borrower_name: req.query.borrower_name,
      borrower_nif: req.query.borrower_nif,
      status: req.query.status,
      item_id: req.query.item_id,
      item_name: req.query.item_name,
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
    
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    
    const result = await loanService.findAll(filters, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listOpen = async (req, res, next) => {
  try {
    const filters = {
      borrower_name: req.query.borrower_name,
      borrower_nif: req.query.borrower_nif,
      item_id: req.query.item_id,
      item_name: req.query.item_name,
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
    
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    
    const result = await loanService.findOpen(filters, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listReturns = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const returns = await loanService.findReturns(loanId);
    res.status(200).json({ data: returns });
  } catch (err) {
    next(err);
  }
};

module.exports = { withdraw, returnLoan, list, listOpen, listReturns };