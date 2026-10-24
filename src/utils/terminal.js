// Helper terminal untuk input/output interaktif dan kotak peringatan

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// HELPER: Mencetak baris teks dalam kotak bergaris ASCII (untuk peringatan limit harian)
export const printBox = (lines) => {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return;
  }

  const maxLen = Math.max(...lines.map((line) => line.length));
  const border = `+${'-'.repeat(maxLen + 4)}+`;

  console.log(border);
  for (const line of lines) {
    console.log(`|  ${line.padEnd(maxLen, ' ')}  |`);
  }
  console.log(border);
};

// HELPER: Merapikan teks panjang agar tidak melewati lebar batas baris terminal
export const formatTerminalText = (text, maxWidth = 75) => {
  if (!text) return '';

  // Bersihkan tanda tebal markdown **
  const clean = text.replace(/\*\*/g, '');

  return clean
    .split('\n')
    .map((paragraph) => {
      if (paragraph.length <= maxWidth) return paragraph;

      const words = paragraph.split(' ');
      let currentLine = '';
      const lines = [];

      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxWidth) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines.join('\n');
    })
    .join('\n');
};

// HELPER: Membuat instance readline untuk menangani input terminal secara asinkron
export const createPrompt = () => {
  const rl = readline.createInterface({ input, output });

  return {
    // Tanyakan pertanyaan dan tunggu input pengguna dari terminal
    ask: async (question) => {
      try {
        const answer = await rl.question(question);
        return answer.trim();
      } catch {
        // Tangani jika tombol Ctrl+C ditekan saat menunggu input
        return null;
      }
    },

    // Tutup interface readline saat alur aplikasi selesai
    close: () => {
      rl.close();
    }
  };
};
