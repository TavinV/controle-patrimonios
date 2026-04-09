const peopleService = require('../services/peopleService');

const NIFRegex = /^\d{9}$/;

const list = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.nif)  filters.nif  = req.query.nif;
    if (req.query.name) filters.name = req.query.name;
    const result = await peopleService.findAll(filters, req.query.page, req.query.limit);
    res.json(result);
  } catch (err) { next(err); }
};

const lookup = async (req, res, next) => {
  try {
    const { nif } = req.query;
    if (!nif || !NIFRegex.test(nif)) {
      return res.status(400).json({ error: 'NIF deve conter exactamente 9 dígitos numéricos' });
    }
    const person = await peopleService.findByNif(nif);
    if (!person) return res.status(404).json({ error: 'NIF não registado' });
    res.json({ data: person });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { nif, name } = req.body;
    if (!NIFRegex.test(nif)) {
      return res.status(400).json({ error: 'NIF deve conter exactamente 9 dígitos numéricos' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    const result = await peopleService.create({ nif, name });
    res.status(201).json({ message: 'Pessoa registada', data: { id: result.insertId } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Este NIF já está registado' });
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nif, name } = req.body;
    if (!NIFRegex.test(nif)) {
      return res.status(400).json({ error: 'NIF deve conter exactamente 9 dígitos numéricos' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    const result = await peopleService.update(id, { nif, name });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    res.json({ message: 'Pessoa atualizada' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Este NIF já está registado' });
    }
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await peopleService.remove(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    res.json({ message: 'Pessoa removida' });
  } catch (err) { next(err); }
};

module.exports = { list, lookup, create, update, remove };
