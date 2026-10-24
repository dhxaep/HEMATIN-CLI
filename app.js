// Modul penanganan aksi setiap pilihan menu CLI

import { printBox, formatTerminalText } from './src/utils/terminal.js';
import { formatRupiah } from './src/utils/formatters.js';
import {
  getDailyLimit,
  setDailyLimit,
  resetDailyLimit,
  checkLimitStatus
} from './src/config/budget.js';
import {
  addTransaction,
  getAllTransactions,
  calculateSummary,
  updateTransaction,
  deleteTransaction,
  getTableFormattedTransactions,
  resetAllTransactions,
  filterByType,
  searchTransactions
} from './src/services/transactionService.js';
import { askFinancialAdvisor } from './src/services/aiService.js';

// Menu [1]: Lihat semua riwayat transaksi
export const handleViewHistory = () => {
  const allTx = getAllTransactions();

  console.log('\n================ DAFTAR RIWAYAT TRANSAKSI ================');

  if (allTx.length === 0) {
    console.log('Belum ada transaksi yang tercatat.');
    return;
  }

  const tableData = getTableFormattedTransactions();
  console.table(tableData);
};

// Menu [2]: Catat pemasukan baru
export const handleAddIncome = async (prompt) => {
  console.log('\n--- CATAT PEMASUKAN BARU ---');
  const amountInput = await prompt.ask('Nominal pemasukan (contoh: 100000): ');
  if (amountInput === null) return;

  const amount = Number(amountInput.replace(/\D/g, ''));
  if (!amount || amount <= 0) {
    console.log('Nominal harus berupa angka lebih dari 0.');
    return;
  }

  const category = await prompt.ask('Kategori (contoh: Gaji / Uang Saku) [Default: Uang Saku]: ');
  if (category === null) return;

  const note = await prompt.ask('Catatan / Keterangan: ');
  if (note === null) return;

  addTransaction({
    type: 'pemasukan',
    category: category.trim() || 'Uang Saku',
    amount,
    note: note.trim() || 'Pemasukan'
  });
};

// Menu [3]: Catat pengeluaran baru
export const handleAddExpense = async (prompt) => {
  console.log('\n--- CATAT PENGELUARAN BARU ---');
  const amountInput = await prompt.ask('Nominal pengeluaran (contoh: 25000): ');
  if (amountInput === null) return;

  const amount = Number(amountInput.replace(/\D/g, ''));
  if (!amount || amount <= 0) {
    console.log('Nominal harus berupa angka lebih dari 0.');
    return;
  }

  const category = await prompt.ask('Kategori (contoh: Makanan / Transport) [Default: Makanan]: ');
  if (category === null) return;

  const note = await prompt.ask('Catatan / Keterangan: ');
  if (note === null) return;

  addTransaction({
    type: 'pengeluaran',
    category: category.trim() || 'Makanan',
    amount,
    note: note.trim() || 'Pengeluaran'
  });

  // Cek peringatan limit setelah pengeluaran baru
  const limitStatus = checkLimitStatus();

  if (limitStatus.messageLines) {
    console.log('');
    printBox(limitStatus.messageLines);
  }
};

// Menu [4]: Ubah data transaksi
export const handleUpdateTransaction = async (prompt) => {
  console.log('\n--- UBAH DATA TRANSAKSI ---');
  const allTx = getAllTransactions();

  if (allTx.length === 0) {
    console.log('Belum ada transaksi yang dapat diubah.');
    return;
  }

  console.table(getTableFormattedTransactions());

  const idInput = await prompt.ask('\nMasukkan ID transaksi yang ingin diubah: ');
  if (!idInput || !idInput.trim()) {
    console.log('ID transaksi tidak boleh kosong.');
    return;
  }

  const existingTx = allTx.find((tx) => tx.id.toLowerCase() === idInput.trim().toLowerCase());
  if (!existingTx) {
    console.log(`\nTransaksi dengan ID "${idInput}" tidak ditemukan.`);
    return;
  }

  console.log('\n(Kosongkan jika tidak ingin mengubah nilai)');
  const newCategory = await prompt.ask('Kategori baru: ');
  const newAmount = await prompt.ask('Nominal baru: ');
  const newNote = await prompt.ask('Catatan baru: ');

  const updatedFields = {};
  if (newCategory && newCategory.trim()) updatedFields.category = newCategory.trim();
  if (newAmount && newAmount.trim()) {
    const num = Number(newAmount);
    if (num > 0) {
      updatedFields.amount = num;
    } else {
      console.log('Nominal baru harus berupa angka lebih dari 0.');
    }
  }
  if (newNote && newNote.trim()) updatedFields.note = newNote.trim();

  if (Object.keys(updatedFields).length === 0) {
    console.log('Tidak ada data yang diubah.');
  } else {
    updateTransaction(existingTx.id, updatedFields);
    console.log(`\nData transaksi ${existingTx.id} berhasil diperbarui.`);
  }
};

// Menu [5]: Hapus transaksi
export const handleDeleteTransaction = async (prompt) => {
  console.log('\n--- HAPUS TRANSAKSI ---');
  const allTx = getAllTransactions();

  if (allTx.length === 0) {
    console.log('Belum ada transaksi yang dapat dihapus.');
    return;
  }

  console.table(getTableFormattedTransactions());

  console.log('Ketik "RESET" untuk menghapus seluruh riwayat.\n');

  const idInput = await prompt.ask('Masukkan ID transaksi yang ingin dihapus: ');
  if (!idInput || !idInput.trim()) return;

  // Reset seluruh data
  if (idInput.toUpperCase() === 'RESET') {
    const confirm = await prompt.ask('Yakin ingin menghapus SELURUH transaksi? (y/n): ');
    if (confirm !== null && confirm.toLowerCase() === 'y') {
      resetAllTransactions();
      console.log('\nSeluruh data transaksi berhasil di-reset.');
    }
    return;
  }

  // Hapus berdasarkan ID
  const confirm = await prompt.ask(`Yakin ingin menghapus transaksi "${idInput}"? (y/n): `);
  if (confirm !== null && confirm.toLowerCase() === 'y') {
    const success = deleteTransaction(idInput.trim());
    if (success) {
      console.log(`\nTransaksi "${idInput}" berhasil dihapus.`);
    } else {
      console.log(`\nTransaksi dengan ID "${idInput}" tidak ditemukan.`);
    }
  }
};

// Menu [6]: Filter transaksi berdasarkan tipe
export const handleFilterTransactions = async (prompt) => {
  console.log('\n--- FILTER TRANSAKSI ---');
  console.log(' [1] Pemasukan');
  console.log(' [2] Pengeluaran');
  const filterChoice = await prompt.ask('Pilih tipe (1/2): ');

  if (filterChoice === '1') {
    filterByType('pemasukan');
  } else if (filterChoice === '2') {
    filterByType('pengeluaran');
  } else {
    console.log('Pilihan tidak valid.');
  }
};

// Menu [7]: Cari transaksi
export const handleSearchTransactions = async (prompt) => {
  console.log('\n--- CARI TRANSAKSI ---');
  const keyword = await prompt.ask('Masukkan kata kunci pencarian (ID/Kategori/Catatan): ');
  if (!keyword || !keyword.trim()) {
    console.log('Kata kunci pencarian tidak boleh kosong.');
    return;
  }

  searchTransactions(keyword.trim());
};

// Menu [8]: Atur / reset budget jajan
export const handleBudgetJajan = async (prompt) => {
  console.log('\n--- ATUR / RESET BUDGET JAJAN ---');
  const currentLimit = getDailyLimit();
  console.log(`Budget jajan saat ini: ${formatRupiah(currentLimit)}`);
  console.log(' [1] Atur nominal baru');
  console.log(' [2] Reset ke default (Rp 50.000)');
  const subChoice = await prompt.ask('Pilih opsi (1/2): ');

  if (subChoice === '1') {
    const inputLimit = await prompt.ask('Masukkan nominal budget jajan baru (contoh: 75000): ');
    if (inputLimit === null) return;

    const num = Number(inputLimit.replace(/\D/g, ''));
    const success = setDailyLimit(num);
    if (success) {
      console.log(`\nBudget jajan berhasil diubah menjadi ${formatRupiah(num)}.`);
    } else {
      console.log('\nBudget jajan harus berupa angka lebih dari 0.');
    }
  } else if (subChoice === '2') {
    resetDailyLimit();
    console.log('\nBudget jajan berhasil di-reset ke default (Rp 50.000). Sisa budget kembali utuh.');
  } else {
    console.log('Pilihan tidak valid.');
  }
};

// Menu [9]: Tanya AI
export const handleAskAiAdvisor = async (prompt) => {
  console.log('\n--- TANYA AI ---');
  console.log('Tanyakan saran keuangan atau evaluasi rencana beli barang.\n');

  const question = await prompt.ask('Pertanyaan: ');
  if (question === null || !question) {
    console.log('Pertanyaan tidak boleh kosong.');
    return;
  }

  console.log('\nMenghubungi AI... Mohon tunggu sebentar.\n');

  const summary = calculateSummary();
  const currentLimit = getDailyLimit();
  const answer = await askFinancialAdvisor(question, summary, currentLimit);

  console.log('-----------------------------------------------------');
  console.log(formatTerminalText(answer));
  console.log('-----------------------------------------------------');
};

// Menangani pilihan menu pengguna
export const handleMenuChoice = async (choice, prompt, exitApp) => {
  switch (choice.trim()) {
    case '1':
      handleViewHistory();
      break;

    case '2':
      await handleAddIncome(prompt);
      break;

    case '3':
      await handleAddExpense(prompt);
      break;

    case '4':
      await handleUpdateTransaction(prompt);
      break;

    case '5':
      await handleDeleteTransaction(prompt);
      break;

    case '6':
      await handleFilterTransactions(prompt);
      break;

    case '7':
      await handleSearchTransactions(prompt);
      break;

    case '8':
      await handleBudgetJajan(prompt);
      break;

    case '9':
      await handleAskAiAdvisor(prompt);
      break;

    case '0':
      exitApp(prompt);
      return false;

    default:
      console.log('\nPilihan tidak valid. Silakan pilih menu antara 0 sampai 9.');
      break;
  }

  await prompt.ask('\nTekan [Enter] untuk kembali ke menu utama...');
  return true;
};
