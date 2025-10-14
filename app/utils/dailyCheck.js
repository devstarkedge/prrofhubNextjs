import axios from "axios";
import moment from "moment";
import { API_BASE_URL, API_KEYS } from "./constants.js";
import { sendEmail } from "./emailUtils.js";

export const fetchEmployees = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/people`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEYS[14149800188], 
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const fetchTimeEntries = async (employeeId, from, to) => {
  const apiKey = API_KEYS[employeeId];
  if (!apiKey) return [];
  try {
    const response = await axios.get(
      `${API_BASE_URL}/alltime?from_date=${from}&to_date=${to}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
      }
    );
    const data = response.data || [];
    return data.filter((entry) => entry.by_me === true);
  } catch (error) {
    console.error(`Error fetching time entries for ${employeeId}:`, error);
    return [];
  }
};

export const runDailyCheck = async () => {
  console.log("Starting daily time logging check...");
  const today = moment().format("YYYY-MM-DD");
  const employees = await fetchEmployees();
  for (const emp of employees) {
    const entries = await fetchTimeEntries(emp.id, today, today);
    const totalMins = entries.reduce(
      (sum, entry) =>
        sum + (entry.logged_hours || 0) * 60 + (entry.logged_mins || 0),
      0
    );
    const totalHours = totalMins / 60;
    if (totalHours < 8) {
      const subject = `Daily Time Report for ${emp.first_name} ${emp.last_name} - ${today}`;
      const text = `Dear ${
        emp.first_name
      },\n\nYou have logged ${totalHours.toFixed(
        2
      )} hours today (${today}). Please ensure you log at least 8 hours daily.\n\nDetailed Time Entries:\n${entries
        .map(
          (entry) =>
            `- Task: ${entry.task?.task_name || "N/A"}, Project: ${
              entry.project?.name || "N/A"
            }, Logged: ${entry.logged_hours || 0}h ${
              entry.logged_mins || 0
            }m, Description: ${entry.description || "N/A"}`
        )
        .join("\n")}\n\nBest regards,\nTime Logger System`;
      const html = `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://www.starkedge.com/hs-fs/hubfs/starkedge-theme-2019/Images/Home-page/logo_coloured_new.png?width=228&amp;height=46&amp;name=logo_coloured_new.png" alt="StarkEdge Logo" style="width: 200px; height: auto;">
          <h2>ProofHub - Daily Time Report</h2>
        </div>
        <p>Dear ${emp.first_name},</p>
        <p>You have logged <strong>${totalHours.toFixed(
          2
        )} hours</strong> today (${today}). Please ensure you log at least 8 hours daily.</p>
        <h3>Detailed Time Entries:</h3>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Project Name</th>
              <th>Logged Time</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${entries
              .map(
                (entry) => `
              <tr>
                <td>${entry.task?.task_name || "N/A"}</td>
                <td>${entry.project?.name || "N/A"}</td>
                <td>${entry.logged_hours || 0}h ${entry.logged_mins || 0}m</td>
                <td>${entry.description || "N/A"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p>Best regards,<br>Time Logger System</p>
      `;
      await sendEmail("shubhamdhatwalia2@gmail.com", subject, text, html);
    }
  }
  console.log("Daily check completed.");
};
