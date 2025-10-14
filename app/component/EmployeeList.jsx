import React, { useState, useEffect } from "react";
import axios from "axios";
import { getFormattedDate, getDateRange } from "../utils/dateUtils";
import { API_BASE_URL, API_KEYS } from "../utils/constants";
import { fetchTodoCount, fetchTodos, TimeEntry } from "../utils/apiUtils";
import { useTimeEntries } from "../hooks/useTimeEntries";
import { prepareTimeEntryExcelData, prepareTimeEntryPDFData, prepareTodoExcelData, prepareTodoPDFData, downloadExcel, downloadPDF } from "../utils/downloadUtils";
import Spinner from "../components/ui/Spinner";
import DateFilter from "../components/ui/DateFilter";
import DownloadDropdown from "../components/ui/DownloadDropdown";

const EmployeeList = ({ view, setView, selectedId, setSelectedId, setSelectedEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todoCounts, setTodoCounts] = useState({});
  const [loadingTodoIds, setLoadingTodoIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState("Exact Date Range");
  const [fromDate, setFromDate] = useState(getFormattedDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [toDate, setToDate] = useState(getFormattedDate(new Date()));
  const [applyLoading, setApplyLoading] = useState(false);
  const [todos, setTodos] = useState([]);
  const [loadingTodos, setLoadingTodos] = useState(false);

  const { data: timeEntries, loading: loadingEntries, refetch } = useTimeEntries(selectedId, fromDate, toDate);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const currentEmployees = employees.slice(start, end);
      const ids = currentEmployees.map((emp) => emp.id);
      const idsToFetch = ids.filter((id) => !(id in todoCounts));
      if (idsToFetch.length > 0) {
        fetchTodoCountsForEmployees(idsToFetch);
      }
    }
  }, [currentPage, employees]);

  useEffect(() => {
    if (selectedId) {
      fetchTodosForEmployee(selectedId);
    }
  }, [selectedId, fromDate, toDate]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/people`, {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_KEYS[14149800188],
        },
      });
      const data = response.data;
      setEmployees(data);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodoCountsForEmployees = async (ids) => {
    setLoadingTodoIds(new Set(ids));
    try {
      const promises = ids.map((id) => fetchTodoCount(id));
      const counts = await Promise.all(promises);
      setTodoCounts((prev) => {
        const newCounts = { ...prev };
        ids.forEach((id, index) => {
          newCounts[id] = counts[index];
        });
        return newCounts;
      });
    } catch (error) {
      console.error("Error fetching todo counts:", error);
    } finally {
      setLoadingTodoIds(new Set());
    }
  };

  const fetchTodosForEmployee = async (id) => {
    setLoadingTodos(true);
    try {
      const data = await fetchTodos(id, fromDate, toDate);
      setTodos(data);
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoadingTodos(false);
    }
  };

  const handleFilterChange = (value) => {
    setSelectedFilter(value);
    if (value !== "Exact Date Range") {
      const range = getDateRange(value);
      if (range) {
        setFromDate(range.from);
        setToDate(range.to);
      }
    }
  };

  const handleDateRangeChange = (range) => {
    setFromDate(range.from);
    setToDate(range.to);
  };

  const handleApply = async () => {
    setApplyLoading(true);
    await refetch();
    setApplyLoading(false);
  };

  const handleClick = (id) => {
    const employee = employees.find(emp => emp.id === id);
    setSelectedEmployee(employee);
    setSelectedId(id);
    setView("details");
  };

  const handleBack = () => {
    setSelectedEmployee(null);
    setSelectedId(null);
    setView("list");
  };

  const currentEmployees = employees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDownloadExcel = () => {
    const data = prepareTimeEntryExcelData(timeEntries || []);
    downloadExcel(data, `time_entries_${selectedId}_${fromDate}_to_${toDate}.xlsx`, "Time Entries");
  };

  const handleDownloadPDF = () => {
    const { tableData, headers } = prepareTimeEntryPDFData(timeEntries || []);
    downloadPDF(tableData, headers, `time_entries_${selectedId}_${fromDate}_to_${toDate}.pdf`);
  };

  const downloadTodoExcel = () => {
    const data = prepareTodoExcelData(todos || []);
    downloadExcel(data, `todo_tasks_${selectedId}_${fromDate}_to_${toDate}.xlsx`, "Todo Tasks");
  };

  const downloadTodoPDF = () => {
    const { tableData, headers } = prepareTodoPDFData(todos || []);
    downloadPDF(tableData, headers, `todo_tasks_${selectedId}_${fromDate}_to_${toDate}.pdf`);
  };

  if (view === "list") {
    if (loading) {
      return <Spinner />;
    }

    return (
      <>
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
          <table className="min-w-full text-sm text-left text-gray-700 rounded-lg table-fixed">
            <thead className="bg-gray-200 text-gray-900 font-semibold">
              <tr>
                <th className="w-1/6 px-4 py-3 border-b border-gray-300">ID</th>
                {/* <th className="w-1/6 px-4 py-3 border-b border-gray-300">Photo</th> */}
                <th className="w-1/4 px-4 py-3 border-b border-gray-300">Name</th>
                <th className="w-1/4 px-4 py-3 border-b border-gray-300">Email</th>
                <th className="w-1/6 px-4 py-3 border-b border-gray-300">Todo Count</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map((emp, index) => (
                <tr
                  key={emp.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-100 transition-colors duration-200`}
                >
                  <td className="w-1/6 px-4 py-2 border-b border-gray-200">
                    <a
                      className="hover:underline"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick(emp.id);
                      }}
                    >
                      {emp.id}
                    </a>
                  </td>
                  {/* <td className="w-1/6 px-4 py-2 border-b border-gray-200">
                    <img
                      src={emp.image_url}
                      alt={emp.first_name}
                      className="w-10 h-10 rounded-full"
                    />
                  </td> */}
                  <td className="w-1/4 px-4 py-2 border-b border-gray-200">
                    {emp.first_name} {emp.last_name}
                  </td>
                  <td className="w-1/4 px-4 py-2 border-b border-gray-200">
                    {emp.email}
                  </td>
                  <td className="w-1/6 px-4 py-2 border-b border-gray-200">
                    {loadingTodoIds.has(emp.id) ? (
                      <div className="flex">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      todoCounts[emp.id] || 0
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center items-center mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Previous
          </button>
          <span className="mx-4">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Next
          </button>
        </div>
      </>
    );
  }

  if (view === "details") {
    return (
      <div className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Back to Employee List
          </button>
          <select
            value={selectedId || ""}
            onChange={(e) => {
              const id = e.target.value ? parseInt(e.target.value) : null;
              if (id) {
                const employee = employees.find(emp => emp.id === id);
                setSelectedEmployee(employee);
                setSelectedId(id);
              } else {
                setSelectedEmployee(null);
                setSelectedId(null);
              }
            }}
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select Employee
            </option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>

          <DateFilter
            selectedFilter={selectedFilter}
            onFilterChange={handleFilterChange}
            dateRange={{ from: fromDate, to: toDate }}
            onDateRangeChange={handleDateRangeChange}
            onApply={handleApply}
            loading={applyLoading}
          />

          <DownloadDropdown onExcel={handleDownloadExcel} onPDF={handleDownloadPDF} loading={loadingEntries} />
        </div>

        {loadingEntries ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
            <table className="min-w-full text-sm text-left text-gray-700 rounded-lg table-fixed">
              <thead className="bg-gray-200 text-gray-900 font-semibold">
                <tr>
                  <th className=" px-4 py-3 border-b border-gray-300">Date</th>
                  <th className=" px-4 py-3 border-b border-gray-300">Task Name</th>
                  <th className=" px-4 py-3 border-b border-gray-300">Subtask Name</th>
                  <th className=" px-4 py-3 border-b border-gray-300">Project Name</th>
                  <th className=" px-4 py-3 border-b border-gray-300">Logged</th>
                  <th className=" px-4 py-3 border-b border-gray-300">Estimated</th>
                  <th className=" py-3 border-b border-gray-300">Description</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries?.map((entry, index) => {
                  const formattedDate = new Date(entry.date).toLocaleDateString();
                  const projectUrl = entry.project
                    ? `https://projects.starkedge.com/bappswift/#app/todos/project-${entry.project.id}`
                    : null;
                  const taskUrl = entry.task && entry.project
                    ? `https://projects.starkedge.com/bappswift/#app/todos/project-${entry.project.id}/list-${entry.task.list_id}/task-${entry.task.task_id}`
                    : null;
                  const subtaskUrl = entry.task && entry.task.subtask_id && entry.project
                    ? `https://projects.starkedge.com/bappswift/#app/todos/project-${entry.project.id}/list-${entry.task.list_id}/task-${entry.task.subtask_id}`
                    : null;
                  const loggedHours = entry.logged_hours || 0;
                  const loggedMins = entry.logged_mins || 0;
                  const totalLoggedMins = loggedHours * 60 + loggedMins;
                  const loggedDisplay = totalLoggedMins > 0 ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m` : "-";
                  const estimated = entry.timesheet
                    ? (entry.timesheet.estimated_hours || 0) * 60 + (entry.timesheet.estimated_mins || 0)
                    : 0;
                  const description = entry.description || "-";
                  return (
                    <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-4 py-2 border-b border-gray-200">{formattedDate}</td>
                      <td className="px-4 py-2 border-b border-gray-200">
                        {entry.task && entry.task.task_name ? (
                          <a className="hover:underline" href={taskUrl} target="_blank" rel="noreferrer">
                            {entry.task.task_name}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200">
                        {entry.task?.subtask_name ? (
                          <a className="hover:underline" href={subtaskUrl} target="_blank" rel="noreferrer">
                            {entry.task.subtask_name}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200">
                        {entry.project && entry.project.name ? (
                          <a className="hover:underline" href={projectUrl} target="_blank" rel="noreferrer">
                            {entry.project.name}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200">{loggedDisplay}</td>
                      <td className="px-4 py-2 border-b border-gray-200">
                        {estimated > 0 ? `${Math.floor(estimated / 60)}h ${estimated % 60}m` : "-"}
                      </td>
                      <td className="max-w-[350px] break-words px-4 py-2 border-b border-gray-200">{description}</td>
                    </tr>
                  );
                }) || null}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td colSpan={4} className="px-4 py-2 border-t border-gray-300 text-right">Total:</td>
                  <td className="px-4 py-2 border-t border-gray-300">
                    {(() => {
                      const totalLoggedMins = timeEntries?.reduce(
                        (sum, entry) => sum + ((entry.logged_hours || 0) * 60 + (entry.logged_mins || 0)),
                        0
                      ) || 0;
                      return totalLoggedMins > 0 ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m` : "-";
                    })()}
                  </td>
                  <td className="px-4 py-2 border-t border-gray-300">
                    {(() => {
                      const totalMins = timeEntries?.reduce((sum, entry) => {
                        if (entry.timesheet) {
                          return sum + (entry.timesheet.estimated_hours || 0) * 60 + (entry.timesheet.estimated_mins || 0);
                        }
                        return sum;
                      }, 0) || 0;
                      return totalMins > 0 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m` : "-";
                    })()}
                  </td>
                  <td className="px-4 py-2 border-t border-gray-300"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {loadingTodos ? (
          <Spinner />
        ) : (
          <>
            <div className="mt-6 mb-2 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Due Tasks</h2>
              <DownloadDropdown onExcel={downloadTodoExcel} onPDF={downloadTodoPDF} loading={loadingTodos} />
            </div>
            <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
              <table className="min-w-full text-sm text-left text-gray-700 rounded-lg table-fixed">
                <thead className="bg-gray-200 text-gray-900 font-semibold">
                  <tr>
                    <th className="px-4 py-3 border-b border-gray-300">ID</th>
                    <th className="px-4 py-3 border-b border-gray-300">Name</th>
                    <th className="px-4 py-3 border-b border-gray-300">Project</th>
                    <th className="px-4 py-3 border-b border-gray-300">Logged</th>
                    <th className="px-4 py-3 border-b border-gray-300">Due Date</th>

                  </tr>
                </thead>
                <tbody>
                  {todos?.map((todo, index) => {
                    const loggedHours = todo.logged_hours || 0;
                    const loggedMins = todo.logged_mins || 0;
                    const totalLoggedMins = loggedHours * 60 + loggedMins;
                    const loggedDisplay = totalLoggedMins > 0 ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m` : "-";
                    return (
                      <tr key={todo.id || index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-2 border-b border-gray-200">{todo.id || "-"}</td>
                        <td className="px-4 py-2 border-b border-gray-200">{todo.title || "-"}</td>
                        <td className="px-4 py-2 border-b border-gray-200">{todo.project?.name || "-"}</td>
                        <td className="px-4 py-2 border-b border-gray-200">{loggedDisplay || "-"}</td>
                        <td className="px-4 py-2 border-b border-gray-200">{todo.due_date || "-"}</td>
                      </tr>
                    );
                  }) || null}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 border-t border-gray-300 text-right">Total:</td>
                    <td className="px-4 py-2 border-t border-gray-300">
                      {(() => {
                        const totalLoggedMins = todos?.reduce(
                          (sum, todo) => sum + ((todo.logged_hours || 0) * 60 + (todo.logged_mins || 0)),
                          0
                        ) || 0;
                        return totalLoggedMins > 0 ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m` : "-";
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default EmployeeList;
