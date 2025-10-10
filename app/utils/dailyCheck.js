import axios from 'axios';
import moment from 'moment';
import { API_BASE_URL, API_KEYS } from './constants.js';
import { sendEmail } from './emailUtils.js';

export const fetchEmployees = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/people`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEYS[14149800188], // Use a fixed key to fetch all employees
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const fetchTimeEntries = async (employeeId, from, to) => {
  const apiKey = API_KEYS[employeeId];
  if (!apiKey) return [];
  try {
    const response = await axios.get(`${API_BASE_URL}/alltime?from_date=${from}&to_date=${to}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    });
    const data = response.data || [];
    return data.filter((entry) => entry.by_me === true);
  } catch (error) {
    console.error(`Error fetching time entries for ${employeeId}:`, error);
    return [];
  }
};

export const runDailyCheck = async () => {
  console.log('Starting daily time logging check...');
  const today = moment().format('YYYY-MM-DD');
  const employees = await fetchEmployees();
  for (const emp of employees) {
    const entries = await fetchTimeEntries(emp.id, today, today);
    const totalMins = entries.reduce((sum, entry) => sum + ((entry.logged_hours || 0) * 60) + (entry.logged_mins || 0), 0);
    const totalHours = totalMins / 60;
    if (totalHours < 8) {
      const subject = 'Reminder: Low Time Logged Today';
      const text = `Dear ${emp.first_name},\n\nYou have logged ${totalHours.toFixed(2)} hours today (${today}). Please ensure you log at least 8 hours daily.\n\nBest regards,\nTime Logger System`;
      await sendEmail('shubhamdhatwalia2@gmail.com', subject, text);
    }
  }
  console.log('Daily check completed.');
};
