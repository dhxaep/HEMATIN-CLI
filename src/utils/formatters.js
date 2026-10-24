// Helper format teks mata uang dan tanggal

// HELPER: Memformat angka nominal menjadi format mata uang Rupiah (contoh: 50000 -> "Rp 50.000")
export const formatRupiah = (amount) => {
  if (!amount || isNaN(amount)) {
    return 'Rp 0';
  }
  const formattedNumber = Math.round(amount).toLocaleString('id-ID');
  return `Rp ${formattedNumber}`;
};

// HELPER: Mengambil tanggal hari ini dalam format lokal Indonesia (DD/MM/YYYY)
export const getTodayFormatted = () => {
  const now = new Date();
  return now.toLocaleDateString('id-ID');
};
