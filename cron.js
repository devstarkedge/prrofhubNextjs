import cron from 'node-cron';
import { runDailyCheck } from './app/utils/dailyCheck.js';

// Schedule the daily check to run every day at 4:40 PM
cron.schedule('40 16 * * *', async () => {
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

console.log('Cron job scheduled: Daily check at 4:40 PM daily.');
