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
    next(err);
  }
};

const importFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }

    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      return res.status(400).json({ error: 'Arquivo Excel vazio' });
    }

    const worksheet = workbook.Sheets[sheetName];
    const items = XLSX.utils.sheet_to_json(worksheet);

    if (items.length === 0) {
      return res.status(400).json({ error: 'Nenhuma linha de dados encontrada' });
    }

    const result = await itemService.importFromExcel(items);
    res.status(200).json({
      message: 'Importação concluída',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const getTemplate = async (req, res, next) => {
  try {
    const XLSX = require('xlsx');
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Create template data with example row
    const templateData = [
      {
        name: '[EXEMPLO, REMOVER ESSA LINHA] Nome do Item',
        location: '[EXEMPLO, REMOVER ESSA LINHA] Localização',
        quantity_total: '[EXEMPLO, REMOVER ESSA LINHA] Quantidade Total',
        quantity_available: '[EXEMPLO, REMOVER ESSA LINHA] Quantidade Disponível (opcional, se vazio será igual a Quantidade Total)'
      }
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 },  // name
      { wch: 20 },  // location
      { wch: 20 },  // quantity_total
      { wch: 20 }   // quantity_available
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_items.xlsx"');
    
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, create, update, remove, importFromExcel, getTemplate };