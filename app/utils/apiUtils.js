import axios from "axios";
import { API_BASE_URL, API_KEYS } from "./constants";

export const fetchTimeEntries = async (
  employeeId,
  from,
  to
) => {
  const apiKey = API_KEYS[employeeId];
  if (!apiKey) return [];
  const response = await axios.get(`${API_BASE_URL}/alltime?from_date=${from}&to_date=${to}`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });
  const data = response.data || [];
  console.log(data);
  return data.filter((entry) => entry.by_me === true);
};

export const fetchTodoCount = async (id) => {
  const apiKey = API_KEYS[id];
  if (!apiKey) return 0;
  const response = await axios.get(`${API_BASE_URL}/alltodo`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });
  return response.data.length;
};
