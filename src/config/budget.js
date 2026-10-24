import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatRupiah } from '../utils/formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BUDGET_FILE = path.join(__dirname, 'budget.json');

const DEFAULT_BUDGET = 50000;

// STATE: Konfigurasi limit harian dan nominal terpakai
export const budgetConfig = {
  dailyLimit: DEFAULT_BUDGET,
  terpakai: 0
};

// HELPER: Memuat konfigurasi limit dari file budget.json jika ada
export const loadBudget = () => {
  try {
    if (fs.existsSync(BUDGET_FILE)) {
      const raw = fs.readFileSync(BUDGET_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (typeof parsed.dailyLimit === 'number' && parsed.dailyLimit > 0) {
        budgetConfig.dailyLimit = parsed.dailyLimit;
      }
      if (typeof parsed.terpakai === 'number' && parsed.terpakai >= 0) {
        budgetConfig.terpakai = parsed.terpakai;
      }
    }
  } catch {}
};

// HELPER: Memuat data budget secara otomatis saat file budget.js pertama kali dijalankan
loadBudget();

// HELPER: Menyimpan konfigurasi limit ke file budget.json
export const saveBudget = () => {
  try {
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(budgetConfig, null, 2), 'utf-8');
  } catch {}
};

// READ: Mengambil nominal limit harian aktif
export const getDailyLimit = () => {
  return budgetConfig.dailyLimit;
};

// READ: Mengambil nominal budget jajan yang sudah terpakai
export const getBudgetUsage = () => {
  return budgetConfig.terpakai || 0;
};

// UPDATE: Menambahkan nominal pengeluaran ke pemakaian budget jajan
export const addBudgetUsage = (amount) => {
  budgetConfig.terpakai = (budgetConfig.terpakai || 0) + Number(amount);
  saveBudget();
};

// UPDATE: Mengurangi nominal pemakaian budget jajan jika ada pembatalan/penghapusan
export const reduceBudgetUsage = (amount) => {
  if (budgetConfig.terpakai) {
    budgetConfig.terpakai = Math.max(0, budgetConfig.terpakai - Number(amount));
    saveBudget();
  }
};

// UPDATE: Memperbarui limit harian (harus angka positif > 0)
export const setDailyLimit = (newLimit) => {
  if (typeof newLimit !== 'number' || isNaN(newLimit) || newLimit <= 0) {
    return false;
  }
  budgetConfig.dailyLimit = newLimit;
  saveBudget();
  return true;
};

// RESET: Mengembalikan budget jajan ke default (Rp 50.000) dan mengosongkan pemakaian
export const resetDailyLimit = () => {
  budgetConfig.dailyLimit = DEFAULT_BUDGET;
  budgetConfig.terpakai = 0;
  saveBudget();
  return true;
};

// RESET: Mengosongkan pemakaian budget (misal saat pergantian hari)
export const resetBudgetUsage = () => {
  budgetConfig.terpakai = 0;
  saveBudget();
};

// EVALUASI: Mengevaluasi persentase penggunaan limit dan menghasilkan pesan peringatan
export const checkLimitStatus = (customExpense) => {
  const currentLimit = budgetConfig.dailyLimit;
  const currentExpense = typeof customExpense === 'number' ? customExpense : (budgetConfig.terpakai || 0);

  if (currentLimit <= 0) {
    return { percent: 0, isWarning90: false, isDanger100: false, remaining: 0, messageLines: null };
  }

  const percent = Math.round((currentExpense / currentLimit) * 100);
  const remaining = Math.max(0, currentLimit - currentExpense);
  const isDanger100 = percent >= 100;
  const isWarning90 = percent >= 90 && percent < 100;

  let messageLines = null;

  // Peringatan darurat 100%
  if (isDanger100) {
    messageLines = [
      `PERINGATAN LIMIT HARIAN TELAH TERPENUHI ${percent}%`,
      `PESAN: BERHENTI JAJAN MULU, NTAR DUIT LO BISA MINUS JIRR!!!`
    ];
  // Peringatan waspada 90%
  } else if (isWarning90) {
    messageLines = [
      `PERINGATAN PENGELUARAN ANGGARAN TELAH MENDEKATI BATAS ${percent}%`,
      `PESAN: BERHEMATLAH, SISA JAJAN LO HARI INI CUMAN ${formatRupiah(remaining).toUpperCase()}`
    ];
  }

  return { percent, isWarning90, isDanger100, remaining, messageLines };
};
