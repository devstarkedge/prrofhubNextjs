import axios from "axios";
import { API_BASE_URL, API_KEYS } from "./constants";
import { getFormattedDate } from "./dateUtils";

export const fetchTimeEntries = async (employeeId, from, to) => {
  const apiKey = API_KEYS[employeeId];
  if (!apiKey) return [];
  const response = await axios.get(
    `${API_BASE_URL}/alltime?from_date=${from}&to_date=${to}&user_id=${employeeId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    }
  );
  const data = response.data;

  // console.log("data", data);
  if (!Array.isArray(data)) {
    console.warn(`fetchTimeEntries: Expected array but got ${typeof data}`, data);
    return [];
  }
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
  const data = response.data;
  if (!Array.isArray(data)) {
    console.warn(`fetchTodoCount: Expected array but got ${typeof data}`, data);
    return 0;
  }
  const filtered = data.filter((todo) => {
    return todo.assigned && todo.assigned.includes(id);
  });
  return filtered.length;
};

export const fetchTodos = async (id, from, to) => {
  const apiKey = API_KEYS[id];
  if (!apiKey) return [];
  const response = await axios.get(`${API_BASE_URL}/alltodo`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });
  const data = response.data;

  if (!Array.isArray(data)) {
    console.warn(`fetchTodos: Expected array but got ${typeof data}`, data);
    return [];
  }

  // Filter by assigned
  const assignedFiltered = data.filter((todo) => {
    return todo.assigned && todo.assigned.includes(id);
  });

  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return assignedFiltered.filter((todo) => {
      if (todo.due_date) {
        const todoDate = new Date(todo.due_date);
        return todoDate >= fromDate && todoDate <= toDate;
      }
      return false;
    });
  }

  return assignedFiltered;
};

export const fetchTaskEstimatedTime = async (
  projectId,
  todolistId,
  taskId,
  employeeId
) => {
  const apiKey = API_KEYS[employeeId];
  if (!apiKey) return null;
  const response = await axios.get(
    `${API_BASE_URL}/projects/${projectId}/todolists/${todolistId}/tasks/${taskId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    }
  );
  const data = response.data;
  return {
    estimated_hours: data.estimated_hours,
    estimated_mins: data.estimated_mins,
  };
};

export const fetchSubtaskEstimatedTime = async (
  projectId,
  todolistId,
  taskId,
  subtaskId,
  employeeId
) => {
  const apiKey = API_KEYS[employeeId];
  if (!apiKey) return null;
  const response = await axios.get(
    `${API_BASE_URL}/projects/${projectId}/todolists/${todolistId}/tasks/${taskId}/subtasks/${subtaskId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    }
  );
  const data = response.data;
  return {
    estimated_hours: data.estimated_hours,
    estimated_mins: data.estimated_mins,
  };
};
