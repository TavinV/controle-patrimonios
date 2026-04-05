const itemService = require('../services/itemService');

const list = async (req, res, next) => {
  try {
    const filters = {
      name: req.query.name,
      location: req.query.location,
      quantity_available_min: req.query.quantity_available_min,
      quantity_available_max: req.query.quantity_available_max,
      quantity_total_min: req.query.quantity_total_min,
      quantity_total_max: req.query.quantity_total_max,
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
    
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    
    const result = await itemService.findAll(filters, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const item = await itemService.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.status(200).json({ data: item });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await itemService.create(req.body);
    res.status(201).json({ message: 'Item criado', data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    await itemService.update(req.params.id, req.body);
    res.status(200).json({ message: 'Item atualizado' });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await itemService.remove(req.params.id);
    res.status(200).json({ message: 'Item removido' });
  } catch (err) {
    if (err.message === 'Item possui empréstimos em aberto') {
      return res.status(err.status || 500).json({ error: err.message });
    }
    next(err);
  }
};

module.exports = { list, getOne, create, update, remove };