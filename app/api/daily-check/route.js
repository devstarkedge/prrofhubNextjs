import { runDailyCheck } from '../../utils/dailyCheck.js';

export async function GET(request) {
  return POST(request);
}

export async function POST(request) {
  try {
    console.log('Running daily check via API...');
    await runDailyCheck();
    console.log('Daily check completed via API.');
    return new Response(JSON.stringify({ message: 'Daily check completed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error running daily check:', error);
    return new Response(JSON.stringify({ error: 'Failed to run daily check' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
