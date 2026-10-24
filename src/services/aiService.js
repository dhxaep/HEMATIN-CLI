// Integrasi AI Financial Advisor menggunakan API Siputzx (Gemini)

import { formatRupiah } from '../utils/formatters.js';

const SIPUTZ_API_URL = 'https://ai.siputzx.my.id/';

// HELPER: Menghapus karakter emoji dari teks agar tampilan terminal tetap rapi
export const cleanEmoticons = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/gu;
  return text.replace(emojiRegex, '');
};

// PROMPT: Menyusun konteks data keuangan user (enriched prompt) untuk dikirim ke AI
export const buildEnrichedPrompt = (question, summary, dailyLimit) => {
  const { balance, totalIncome, totalExpense, todayExpense } = summary;

  return `[DATA KEUANGAN USER]
Saldo Saat Ini: ${formatRupiah(balance)}
Total Pemasukan: ${formatRupiah(totalIncome)}
Total Pengeluaran: ${formatRupiah(totalExpense)}
Limit Harian: ${formatRupiah(dailyLimit)}
Pengeluaran Hari Ini: ${formatRupiah(todayExpense)}

[PERTANYAAN USER]
${question}`;
};

// AI ADVISOR: Menghubungi API Siputz AI untuk mendapatkan saran keuangan kontekstual
export const askFinancialAdvisor = async (userQuestion, financialSummary, dailyLimit) => {
  const sysPrompt = 'Kamu adalah Financial Advisor ramah berbahasa Indonesia kasual. Berikan saran mendalam yang menyesuaikan kondisi keuangan user. DILARANG KERAS menggunakan format matematika/LaTeX dan DILARANG MENGGUNAKAN EMOTIKON/EMOJI APAPUN.';

  const enrichedContent = buildEnrichedPrompt(userQuestion, financialSummary, dailyLimit);

  try {
    const response = await fetch(SIPUTZ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: enrichedContent,
        prompt: sysPrompt,
        user: 'hematin_cli_user',
        model: 'gemini'
      })
    });

    if (!response.ok) {
      throw new Error(`Server AI mengembalikan status ${response.status}`);
    }

    const data = await response.json();
    let rawResult = data.result || 'Maaf, AI tidak memberikan respon.';

    if (rawResult.toLowerCase().includes('error: no response')) {
      rawResult = 'AI sedang sibuk, silakan coba beberapa saat lagi.';
    }

    return cleanEmoticons(rawResult).trim();

  } catch (error) {
    return `[ERROR] Gagal menghubungi layanan AI: ${error.message}. Silakan periksa koneksi internet Anda.`;
  }
};
