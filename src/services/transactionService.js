// Service CRUD untuk mengelola transaksi keuangan

import { loadTransactions, saveTransactions } from '../data/transactions.js';
import { getTodayFormatted, formatRupiah } from '../utils/formatters.js';
import { addBudgetUsage, reduceBudgetUsage, resetDailyLimit } from '../config/budget.js';

// CREATE: Tambah transaksi baru ke dalam file JSON
export const addTransaction = (transactionData) => {
  const { type, category, amount, note, date } = transactionData;

  if (type !== 'pemasukan' && type !== 'pengeluaran') {
    throw new Error('Tipe transaksi harus "pemasukan" atau "pengeluaran"');
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Nominal transaksi harus berupa angka lebih dari 0');
  }

  // Generate ID transaksi acak unik (TX-XXX)
  const currentList = loadTransactions();
  let newId;
  do {
    const randomNum = Math.floor(Math.random() * 900 + 100);
    newId = `TX-${randomNum}`;
  } while (currentList.some((item) => item.id === newId));

  const newTransaction = {
    id: newId,
    type,
    category: category || (type === 'pemasukan' ? 'Pemasukan Lain' : 'Pengeluaran Lain'),
    amount: numericAmount,
    note: note || '-',
    date: date || getTodayFormatted()
  };

  const updatedTransactions = [...currentList, newTransaction];
  saveTransactions(updatedTransactions);

  // Jika transaksi adalah pengeluaran, tambahkan ke jajan terpakai
  if (type === 'pengeluaran') {
    addBudgetUsage(numericAmount);
  }

  console.log(`\nTransaksi ${newId} berhasil ditambahkan.`);
  return newTransaction;
};

// READ: Ambil seluruh daftar transaksi dari file JSON
export const getAllTransactions = () => {
  return loadTransactions();
};

// READ & SUMMARY: Hitung ringkasan keuangan (saldo, pemasukan, pengeluaran, pengeluaran hari ini)
export const calculateSummary = () => {
  const today = getTodayFormatted();
  const transactions = loadTransactions();

  // .filter() dan .reduce() untuk total pemasukan
  const totalIncome = transactions
    .filter((tx) => tx.type === 'pemasukan')
    .reduce((acc, cur) => acc + cur.amount, 0);

  // Total pengeluaran
  const totalExpense = transactions
    .filter((tx) => tx.type === 'pengeluaran')
    .reduce((acc, cur) => acc + cur.amount, 0);

  const balance = totalIncome - totalExpense;

  // Pengeluaran khusus hari ini (untuk evaluasi limit)
  const todayExpense = transactions
    .filter((tx) => tx.type === 'pengeluaran' && tx.date === today)
    .reduce((acc, cur) => acc + cur.amount, 0);

  return { balance, totalIncome, totalExpense, todayExpense };
};

// UPDATE: Ubah data transaksi berdasarkan ID
export const updateTransaction = (id, updates) => {
  const transactions = loadTransactions();

  // .find() untuk cari transaksi berdasarkan ID (case-insensitive)
  const existingTx = transactions.find((tx) => tx.id.toLowerCase() === id.toLowerCase());
  if (!existingTx) {
    return null;
  }

  // Spread Operator: gabungkan properti lama dan baru
  const updatedTx = {
    ...existingTx,
    ...updates,
    id: existingTx.id // ID tidak boleh berubah
  };

  // Validasi nominal jika ikut diubah
  if (updates.amount !== undefined) {
    const num = Number(updates.amount);
    if (isNaN(num) || num <= 0) {
      throw new Error('Nominal pembaruan harus berupa angka lebih dari 0');
    }
    updatedTx.amount = num;
  }

  // Jika amount pengeluaran diubah, sesuaikan pemakaian budget
  if (existingTx.type === 'pengeluaran' && updates.amount !== undefined) {
    const diff = updatedTx.amount - existingTx.amount;
    if (diff > 0) {
      addBudgetUsage(diff);
    } else if (diff < 0) {
      reduceBudgetUsage(Math.abs(diff));
    }
  }

  // .map() untuk ganti elemen dalam array dan simpan
  const updatedList = transactions.map((tx) => (tx.id.toLowerCase() === id.toLowerCase() ? updatedTx : tx));
  saveTransactions(updatedList);

  return updatedTx;
};

// DELETE: Hapus transaksi berdasarkan ID
export const deleteTransaction = (id) => {
  const transactions = loadTransactions();

  // Cari transaksi yang akan dihapus
  const targetTx = transactions.find((tx) => tx.id.toLowerCase() === id.toLowerCase());
  if (!targetTx) {
    return false;
  }

  // Jika transaksi yang dihapus adalah pengeluaran, kurangi jajan terpakai
  if (targetTx.type === 'pengeluaran') {
    reduceBudgetUsage(targetTx.amount);
  }

  // .filter() untuk buang transaksi dengan ID yang cocok
  const remaining = transactions.filter((tx) => tx.id.toLowerCase() !== id.toLowerCase());
  saveTransactions(remaining);

  return true;
};

// DELETE (RESET): Hapus seluruh data transaksi dan reset budget
export const resetAllTransactions = () => {
  saveTransactions([]);
  resetDailyLimit();
};

// READ: Format data transaksi untuk tampilan console.table()
export const getTableFormattedTransactions = () => {
  const transactions = loadTransactions();

  // .map() dan Destructuring
  return transactions.map((tx) => {
    const { id, date, type, category, amount, note } = tx;
    return {
      id,
      tanggal: date,
      tipe: type,
      kategori: category,
      nominal: formatRupiah(amount),
      catatan: note
    };
  });
};

// FILTER: Menyaring dan menampilkan riwayat transaksi berdasarkan tipe pemasukan atau pengeluaran
export const filterByType = (selectedType) => {
  const transactions = loadTransactions();
  const filtered = transactions.filter((tx) => tx.type.toLowerCase() === selectedType.toLowerCase());

  if (filtered.length === 0) {
    console.log(`\nBelum ada transaksi bertipe "${selectedType}".`);
    return;
  }

  const tableData = filtered.map((tx) => ({
    id: tx.id,
    tanggal: tx.date,
    kategori: tx.category,
    nominal: formatRupiah(tx.amount),
    catatan: tx.note
  }));

  console.log(`\n=========== TRANSAKSI: ${selectedType.toUpperCase()} ===========`);
  console.table(tableData);
};

// SEARCH: Mencari transaksi yang cocok berdasarkan kata kunci pada ID, kategori, atau catatan
export const searchTransactions = (keyword) => {
  if (!keyword || !keyword.trim()) {
    console.log('\nKata kunci pencarian tidak boleh kosong.');
    return;
  }

  const transactions = loadTransactions();
  const query = keyword.trim().toLowerCase();
  const filtered = transactions.filter((tx) =>
    tx.category.toLowerCase().includes(query) ||
    tx.note.toLowerCase().includes(query) ||
    tx.id.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    console.log(`\nTransaksi dengan kata kunci "${keyword}" tidak ditemukan.`);
    return;
  }

  const tableData = filtered.map((tx) => ({
    id: tx.id,
    tanggal: tx.date,
    tipe: tx.type,
    kategori: tx.category,
    nominal: formatRupiah(tx.amount),
    catatan: tx.note
  }));

  console.log(`\n=========== HASIL PENCARIAN: "${keyword}" ===========`);
  console.table(tableData);
};
