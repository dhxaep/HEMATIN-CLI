# Hematin CLI - Aplikasi Pengatur Keuangan & Budget Harian

Aplikasi backend berbasis **Command Line Interface (CLI)** untuk pencatatan keuangan pribadi, monitoring batas limit pengeluaran harian, serta asisten finansial cerdas (AI Advisor) yang dibangun menggunakan **Node.js (ES Modules)** dengan penyimpanan data berbasis struktur **Array of Objects**.

Proyek ini dibuat untuk memenuhi tugas **Mini Project: Trial Study Club Backend Basic**.

---

## 1. Gambaran Umum (Deskripsi)

**Hematin CLI** adalah aplikasi pencatatan dan pengelolaan keuangan pribadi interaktif melalui terminal. Fitur utama aplikasi mencakup:

- **Pencatatan Keuangan (Cashflow)**: Menambah transaksi pemasukan dan pengeluaran secara terorganisir.
- **Monitoring Saldo & Sisa Budget**: Menghitung total pemasukan, total pengeluaran, saldo bersih, serta sisa budget jajan secara otomatis.
- **Atur & Reset Budget Jajan**: Pengguna dapat mengatur nominal budget jajan harian atau me-reset kembali ke nominal default (Rp 50.000) dan mengosongkan pemakaian.
- **Operasi CRUD Lengkap**: Menampilkan riwayat transaksi dalam bentuk tabel tabular (`console.table`), mengubah transaksi, menghapus transaksi berdasarkan ID unik, serta menyaring data (filter & search).
- **Sistem Peringatan Limit Real-Time**: Evaluasi otomatis persentase pengeluaran terhadap batas limit harian (peringatan waspada 90% dan peringatan darurat 100%).
- **Integrasi AI Financial Advisor**: Konsultasi finansial cerdas secara kontekstual berbasis kondisi keuangan pengguna (saldo & pengeluaran) menggunakan Siputz AI.
- **Penjadwalan Otomatis (Cron Job)**: Sinkronisasi pemakaian budget harian di latar belakang setiap pukul 00:00 tengah malam menggunakan `node-cron`.
- **Penyimpanan Permanen (JSON)**: Data transaksi dan konfigurasi anggaran tersimpan secara persisten pada file `transactions.json` dan `budget.json`.

---

## 2. Cara Menjalankan Program (How to Run)

### Prasyarat:
- Komputer telah terpasang **Node.js** (versi 18 ke atas).

### Langkah-langkah:

1. **Clone repository ini** ke komputer lokal Anda:
   ```bash
   git clone https://github.com/dhxaep/HEMATIN-CLI.git
   cd HEMATIN-CLI
   ```

2. **Pasang dependensi yang dibutuhkan** (`node-cron`):
   ```bash
   npm install
   ```

3. **Jalankan aplikasi**:
   ```bash
   node index.js
   ```
   *atau*
   ```bash
   npm start
   ```

4. Menu interaktif (0-9) akan langsung muncul di terminal.

---

## 3. Format Data

Data utama dalam aplikasi disimpan dalam file JSON menggunakan struktur **Array of Objects**:

### A. Struktur Data Transaksi (`transactions.json`)

Setiap data transaksi direpresentasikan oleh sebuah objek dengan pasangan key-value sebagai berikut:

```javascript
[
  {
    id: "TX-101",                    // String : ID unik transaksi berformat acak (TX-XXX)
    type: "pemasukan",               // String : Jenis transaksi ("pemasukan" atau "pengeluaran")
    category: "Uang Saku",           // String : Kategori transaksi (misal: "Uang Saku", "Gaji", "Makanan")
    amount: 500000,                  // Number : Nilai nominal transaksi dalam Rupiah (angka bulat)
    note: "Kiriman orang tua",       // String : Catatan atau keterangan deskripsi transaksi
    date: "25/10/2026"               // String : Tanggal transaksi dicatat dalam format lokal (DD/MM/YYYY)
  },
  {
    id: "TX-102",
    type: "pengeluaran",
    category: "Makanan",
    amount: 25000,
    note: "Makan siang ayam geprek",
    date: "25/10/2026"
  }
]
```

### B. Struktur Data Konfigurasi Anggaran (`budget.json`)

Pengaturan limit dan pemakaian anggaran harian disimpan dalam objek konfigurasi:

```javascript
{
  dailyLimit: 50000, // Number : Batas maksimal anggaran pengeluaran harian dalam Rupiah
  terpakai: 0        // Number : Akumulasi nominal pengeluaran yang telah terpakai
}
```

---

## 4. Penjelasan Function CRUD

Seluruh fungsi pada aplikasi ini didefinisikan menggunakan sintaks **ES6 Arrow Function** `() => {}` dan dipisahkan secara modular pada direktori `src/services/` dan `src/config/`:

### A. Create (Menambah Data Transaksi)
- **Nama Fungsi**: `addTransaction(transactionData)`
- **Lokasi File**: `src/services/transactionService.js`
- **Peran & Alur Eksekusi**:
  1. Menerima objek input transaksi `{ type, category, amount, note, date }` menggunakan **Destructuring Assignment**.
  2. Memvalidasi bahwa tipe transaksi valid (`'pemasukan'` atau `'pengeluaran'`) serta nominal harus berupa angka lebih dari 0.
  3. Menghasilkan ID unik acak `TX-XXX` menggunakan `Math.random()` dan perulangan `do...while` untuk menjamin tidak ada ID kembar.
  4. Menambahkan data baru ke dalam array menggunakan **Spread Operator** `[...currentList, newTransaction]`.
  5. Jika transaksi berupa pengeluaran, otomatis menambahkan nominal ke pemakaian budget jajan (`addBudgetUsage`).
  6. Menyimpan array terbaru ke file `transactions.json`.

### B. Read (Membaca & Menampilkan Data)
- **Nama Fungsi**: `getAllTransactions()`
  - **Peran**: Mengambil seluruh data transaksi dari penyimpanan file JSON.
- **Nama Fungsi**: `calculateSummary()`
  - **Peran**: Memanfaatkan array method `.filter()` dan `.reduce()` untuk menghitung total pemasukan, total pengeluaran, saldo bersih (`totalIncome - totalExpense`), serta pengeluaran hari ini.
- **Nama Fungsi**: `getTableFormattedTransactions()`
  - **Peran**: Memanfaatkan array method `.map()` untuk memformat seluruh data transaksi ke dalam tabel bersih bertuliskan format Rupiah untuk dicetak melalui **`console.table()`**.
- **Nama Fungsi**: `filterByType(selectedType)`
  - **Peran**: Menyaring dan menampilkan daftar transaksi khusus bertipe `'pemasukan'` atau `'pengeluaran'`.
- **Nama Fungsi**: `searchTransactions(keyword)`
  - **Peran**: Mencari transaksi yang cocok berdasarkan kata kunci pada ID, kategori, atau catatan menggunakan `.filter()` dan `.includes()`.

### C. Update (Mengubah Data & Budget Jajan)
- **Nama Fungsi**: `updateTransaction(id, updates)`
  - **Lokasi File**: `src/services/transactionService.js`
  - **Peran**: Mencari transaksi berdasarkan ID menggunakan array method `.find()`, menggabungkan pembaruan dengan Spread Operator `{ ...existingTx, ...updates }`, menyesuaikan pemakaian budget jika nominal pengeluaran berubah, dan memperbarui array menggunakan `.map()`.
- **Nama Fungsi**: `setDailyLimit(newLimit)`
  - **Lokasi File**: `src/config/budget.js`
  - **Peran**: Memvalidasi dan memperbarui nominal batas budget jajan harian aktif.
- **Nama Fungsi**: `resetDailyLimit()`
  - **Lokasi File**: `src/config/budget.js`
  - **Peran**: Mengembalikan nilai batas budget jajan ke default (Rp 50.000) dan mengosongkan akumulasi pemakaian (`terpakai = 0`).

### D. Delete (Menghapus Data)
- **Nama Fungsi**: `deleteTransaction(id)`
  - **Lokasi File**: `src/services/transactionService.js`
  - **Peran**: Mencari transaksi berdasarkan ID dengan `.find()`. Jika ditemukan, mengurangi pemakaian budget jika bertipe pengeluaran, lalu menghapus data menggunakan `.filter((tx) => tx.id.toLowerCase() !== id.toLowerCase())`.
- **Nama Fungsi**: `resetAllTransactions()`
  - **Peran**: Mengosongkan seluruh riwayat transaksi dan mereset status budget jajan.

---

## 5. Fitur Unggulan

### A. Sistem Peringatan Real-Time (Bebas Emotikon)
Setiap kali pengguna menambahkan transaksi pengeluaran (Menu [3]), fungsi `checkLimitStatus()` langsung mengevaluasi persentase pemakaian terhadap limit harian aktif:
$$\text{Persentase} = \left(\frac{\text{Budget Terpakai}}{\text{Limit Harian}}\right) \times 100\%$$

- **Kondisi 90% (Peringatan Waspada):**
  Terpicu saat persentase mencapai 90% hingga 99%. Menampilkan notifikasi kotak ASCII:
  ```text
  +-------------------------------------------------------------------------+
  | PERINGATAN PENGELUARAN ANGGARAN TELAH MENDEKATI BATAS 91%               |
  | PESAN: BERHEMATLAH, SISA JAJAN LO HARI INI CUMAN RP 4.500               |
  +-------------------------------------------------------------------------+
  ```

- **Kondisi 100% (Peringatan Darurat Terlampaui):**
  Terpicu saat pengeluaran telah mencapai atau melebihi 100% dari limit harian:
  ```text
  +-------------------------------------------------------------------------+
  | PERINGATAN LIMIT HARIAN TELAH TERPENUHI 104%                            |
  | PESAN: BERHENTI JAJAN MULU, NTAR DUIT LO BISA MINUS JIRR!!!             |
  +-------------------------------------------------------------------------+
  ```

### B. Penjadwalan Otomatis (Library `node-cron`)
File `src/services/cronService.js` mengimplementasikan penjadwalan otomatis tengah malam menggunakan library `node-cron` dengan pola cron `0 0 * * *`. Fitur ini otomatis mereset pemakaian budget harian saat pergantian hari dan dilengkapi fungsi `stopDailyCron()` agar proses CLI dapat ditutup secara bersih.

### C. Konsultasi AI Financial Advisor (Siputz AI)
Menu [9] (Tanya AI) terhubung langsung ke endpoint `https://ai.siputzx.my.id/` menggunakan native `fetch` bawaan Node.js. Sistem menyusun *Enriched Prompt* berisi data saldo, total pemasukan, total pengeluaran, dan batas limit hari ini, sehingga saran keuangan yang diberikan oleh AI sangat kontekstual dan akurat dengan kondisi keuangan pengguna.

---

## 6. Pemenuhan Kriteria Mini Project

### Kriteria Wajib:
1. **Operasi CRUD**: Lengkap (Create, Read, Update, Delete) di `src/services/transactionService.js`.
2. **Array of Objects**: Struktur data utama tersimpan di file `src/data/transactions.json` dan dikelola secara modular lewat `src/data/transactions.js`.
3. **Modularisasi**: Pemisahan berkas terstruktur dengan ES Modules (`import`/`export`), memisahkan alur perulangan utama di `index.js`, penanganan switch-case pilihan menu di `app.js`, konfigurasi limit di `src/config/`, data di `src/data/`, service di `src/services/`, serta helper di `src/utils/`.
4. **Alur I/O Node.js**: Interaksi dinamis menggunakan `node:readline/promises` bawaan Node.js.
5. **Logika Dasar & Variabel**: Menggunakan `const` dan `let` (tanpa `var`), logika percabangan `if/else` dan `switch`, serta perulangan `while` dan `do...while`.
6. **Arrow Function**: Seluruh fungsi didefinisikan menggunakan sintaks ES6 `() => {}`.

### Kriteria Bonus:
1. **Array Methods**: Menggunakan 5 method array: `.map()`, `.filter()`, `.reduce()`, `.find()`, dan `.some()`.
2. **Spread Operator**: Digunakan untuk immutability penambahan array `[...currentList, newTransaction]` dan pembaruan objek `{ ...existingTx, ...updates }`.
3. **Destructuring Assignment**: Digunakan dalam mengekstrak parameter objek transaksi `{ type, category, amount, note, date }`.
4. **Format Output Bersih**: Menggunakan Template Literals backticks (`` `...` ``) dengan interpolasi `${}` tanpa operator string `+` dan menggunakan `console.table()` untuk daftar riwayat.
5. **Validasi Program**: Menggunakan operator perbandingan ketat `===`, `!==`, serta operator logika `&&`, `||`, `!` untuk mencegah crash akibat input salah atau ID tidak ditemukan.

---

## 7. Ringkasan Kriteria Penilaian

| No  | Kriteria Penilaian      | Kategori |  Status   | Keterangan                                                                |
| :-: | :---------------------- | :------: | :-------: | :------------------------------------------------------------------------ |
|  1  | Operasi CRUD (Min. 4)   |  Wajib   | Terpenuhi | Create, Read, Update, Delete lengkap di `transactionService.js`           |
|  2  | Array of Objects        |  Wajib   | Terpenuhi | Data tersimpan rapi dalam array of objects di `transactions.json`         |
|  3  | Modularisasi            |  Wajib   | Terpenuhi | Terpisah terstruktur (`index.js`, `app.js`, `config`, `data`, `services`) |
|  4  | Alur I/O Node.js        |  Wajib   | Terpenuhi | Input terminal via `readline/promises`, output via `console.log`          |
|  5  | Logika Dasar & Variabel |  Wajib   | Terpenuhi | Menggunakan const/let, while, do-while, switch, if/else                   |
|  6  | Arrow Function          |  Wajib   | Terpenuhi | Seluruh fungsi menggunakan sintaks ES6 `() => {}`                         |
|  7  | Array Methods           |  Bonus   | Terpenuhi | Menggunakan `.map()`, `.filter()`, `.reduce()`, `.some()`, `.find()`      |
|  8  | Spread Operator         |  Bonus   | Terpenuhi | Menggabungkan objek dan array tanpa mutasi langsung                       |
|  9  | Destructuring           |  Bonus   | Terpenuhi | Destructuring parameter objek transaksi `{ type, amount, ... }`           |
| 10  | Template Literals       |  Bonus   | Terpenuhi | Seluruh format teks menggunakan backtick `` ` `` dan `${}`                |
| 11  | Validasi Program        |  Bonus   | Terpenuhi | Pengecekan input salah, validasi angka, dan pencegahan error ID           |

---

## Author

- **Nama**: Dhafa
- **Pembimbing**: Nadia
- **Tema Proyek**: Hematin CLI - Asisten Pengatur Keuangan & Budget Harian
- **Kelas**: Trial Study Club Backend Basic KSM VETERANTECH UPNVJ
- **Deadline**: Sabtu, 24 Oktober 2026 23.59 WIB
