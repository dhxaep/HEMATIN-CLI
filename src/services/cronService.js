// Penjadwalan otomatis menggunakan node-cron
// Monitor pergantian hari (00:00) agar limit harian selalu sinkron

import cron from 'node-cron';
import { resetBudgetUsage } from '../config/budget.js';

let dailyCronTask = null;

// CRON: Menjalankan cron job harian pada pukul 00:00 tengah malam
export const startDailyCron = (onMidnightTrigger) => {
  if (dailyCronTask) {
    dailyCronTask.stop();
  }

  dailyCronTask = cron.schedule('0 0 * * *', () => {
    resetBudgetUsage();
    if (typeof onMidnightTrigger === 'function') {
      onMidnightTrigger();
    }
  });

  return dailyCronTask;
};

// CRON: Menghentikan cron job agar proses Node.js CLI dapat berhenti secara bersih
export const stopDailyCron = () => {
  if (dailyCronTask) {
    dailyCronTask.stop();
    dailyCronTask = null;
  }
};

// HELPER: Mengecek status keaktifan cron job saat ini
export const isCronRunning = () => {
  return dailyCronTask !== null;
};
