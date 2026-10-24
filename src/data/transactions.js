// Pengelolaan data transaksi menggunakan file JSON (Array of Objects)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE_PATH = path.join(__dirname, 'transactions.json');

// READ: Membaca seluruh data transaksi dari file transactions.json
export const loadTransactions = () => {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return [];
    }
    const rawData = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch {
    return [];
  }
};

// WRITE: Menyimpan seluruh array transaksi ke file transactions.json
export const saveTransactions = (data) => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
};
