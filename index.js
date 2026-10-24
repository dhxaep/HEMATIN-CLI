import { createPrompt } from './src/utils/terminal.js';
import { formatRupiah, getTodayFormatted } from './src/utils/formatters.js';
import { getDailyLimit, getBudgetUsage, checkLimitStatus } from './src/config/budget.js';
import { calculateSummary } from './src/services/transactionService.js';
import { startDailyCron, stopDailyCron } from './src/services/cronService.js';
import { handleMenuChoice } from './app.js';

// Menampilkan dashboard dan ringkasan keuangan
const showDashboard = () => {
  const summary = calculateSummary();
  const budget = getDailyLimit();
  const terpakai = getBudgetUsage();
  const sisaBudget = Math.max(0, budget - terpakai);
  const status = checkLimitStatus(terpakai);

  let statusPengeluaran = 'Aman';
  if (status.isDanger100) {
    statusPengeluaran = `Melebihi Limit (${status.percent}%)`;
  } else if (status.isWarning90) {
    statusPengeluaran = `Mendekati Limit (${status.percent}%)`;
  }

  console.log('\n=====================================================');
  console.log('       HEMATIN CLI - ASISTEN PENGATUR KEUANGAN       ');
  console.log(`                 Tanggal: ${getTodayFormatted()}`);
  console.log('=====================================================');
  console.log(` Saldo Saat Ini     : ${formatRupiah(summary.balance)}`);
  console.log(` Total Pemasukan    : ${formatRupiah(summary.totalIncome)}`);
  console.log(` Total Pengeluaran  : ${formatRupiah(summary.totalExpense)}`);
  console.log(` Budget Jajan       : ${formatRupiah(budget)}`);
  console.log(` Sisa Budget Jajan  : ${formatRupiah(sisaBudget)}`);
  console.log(` Status Pengeluaran : ${statusPengeluaran}`);
  console.log('-----------------------------------------------------');
};

// Menampilkan daftar pilihan menu
const showMenu = () => {
  console.log('PILIHAN MENU:');
  console.log(' [1] Lihat Semua Riwayat Transaksi (Tabel)');
  console.log(' [2] Catat Pemasukan');
  console.log(' [3] Catat Pengeluaran');
  console.log(' [4] Ubah Data Transaksi');
  console.log(' [5] Hapus Transaksi');
  console.log(' [6] Filter Transaksi (Pemasukan / Pengeluaran)');
  console.log(' [7] Cari Transaksi');
  console.log(' [8] Atur / Reset Budget Jajan');
  console.log(' [9] Tanya AI');
  console.log(' [0] Keluar Aplikasi');
  console.log('=====================================================');
};

const exitApp = (prompt) => {
  stopDailyCron();
  prompt.close();
  console.log('\nTerima kasih telah menggunakan Hematin CLI. Sampai jumpa!');
  process.exit(0);
};

// Fungsi utama alur program
const main = async () => {
  const prompt = createPrompt();

  startDailyCron();

  process.on('SIGINT', () => {
    exitApp(prompt);
  });

  let isRunning = true;

  while (isRunning) {
    showDashboard();
    showMenu();

    const choice = await prompt.ask('\nPilih menu (0-9): ');

    if (choice === null) {
      exitApp(prompt);
      return;
    }

    isRunning = await handleMenuChoice(choice, prompt, exitApp);
  }
};

// Jalankan program
main();
