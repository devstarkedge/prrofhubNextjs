import cron from 'node-cron';
import { runDailyCheck } from './app/utils/dailyCheck.js';

cron.schedule('24 19 * * *', async () => {
  console.log('Running scheduled daily check...');
  try {
    await runDailyCheck();
    console.log('Scheduled daily check completed successfully.');
  } catch (error) {
    console.error('Error during scheduled daily check:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

console.log('Cron job scheduled: Daily check at 10:00 PM daily.');



