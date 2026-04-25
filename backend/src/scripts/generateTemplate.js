#!/usr/bin/env node
/**
 * Script para gerar o arquivo template.xlsx para importação de itens
 * Uso: node src/scripts/generateTemplate.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Create template data with example row
const templateData = [
  {
    name: 'Exemplo: Projetor',
    location: 'Exemplo: Sala A',
    quantity_total: 5,
    quantity_available: 3
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

// Save file
const outputPath = path.join(__dirname, '../../template_items.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Template gerado com sucesso: ${outputPath}`);
