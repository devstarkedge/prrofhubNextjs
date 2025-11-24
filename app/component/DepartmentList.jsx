import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  getFormattedDate,
  getDateRange,
  getDaysBetween,
  getWeekdaysBetween,
} from "../utils/dateUtils";
import { API_BASE_URL, API_KEYS } from "../utils/constants";
import { fetchTimeEntries, TimeEntry } from "../utils/apiUtils";
import {
  prepareDepartmentSummaryExcelData,
  prepareDepartmentSummaryPDFData,
  downloadExcel,
  downloadPDF,
} from "../utils/downloadUtils";
import Spinner from "../components/ui/Spinner";
import DateFilter from "../components/ui/DateFilter";
import DownloadDropdown from "../components/ui/DownloadDropdown";
import DataTable from "../components/ui/DataTable";

const DepartmentList = ({
  setActiveButton,
  setView,
  setSelectedId,
  setSelectedEmployee,
}) => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeData, setTimeData] = useState({});
  const [departmentTimeEntries, setDepartmentTimeEntries] = useState({});
  const [leaveDays, setLeaveDays] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(new Set());
  const [applyLoading, setApplyLoading] = useState(new Set());
  const [isTimeFetching, setIsTimeFetching] = useState(true);
  const [timeLoadingDepts, setTimeLoadingDepts] = useState(new Set());
  const dropdownRef = useRef(null);

  const [deptDateRanges, setDeptDateRanges] = useState({});
  const [deptSelectedFilters, setDeptSelectedFilters] = useState({});

  const initialFetchDoneRef = useRef(false);

  const getColorClass = (timeStr) => {
    if (!timeStr || timeStr === "0h 0m" || timeStr === "-")
      return "text-red-500";
    const parts = timeStr.split("h ");
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]?.replace("m", "")) || 0;
    const totalMins = h * 60 + m;
    if (totalMins < 480) return "text-red-500";
    if (totalMins === 480) return "text-green-500";
    return "text-yellow-500";
  };

  const employeeMap = employees.reduce((map, emp) => {
    map[emp.id] = emp;
    return map;
  }, {});

  const fetchInitialTimes = async () => {
    setTimeLoadingDepts(new Set(departments.map((d) => d.id)));
    const promises = departments.map(async (dept) => {
      const { from, to } = deptDateRanges[dept.id];
      await fetchTimeForDepartmentEmployees(
        dept.id,
        from,
        to,
        "Exact Date Range"
      );
    });
    await Promise.all(promises);
    setTimeLoadingDepts(new Set());
    setIsTimeFetching(false);
  };

  useEffect(() => {
    if (departments.length > 0) {
      const initialRanges = {};
      const initialFilters = {};
      departments.forEach((dept) => {
        initialRanges[dept.id] = {
          from: getFormattedDate(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ),
          to: getFormattedDate(new Date()),
        };
        initialFilters[dept.id] = "Exact Date Range";
      });
      setDeptDateRanges(initialRanges);
      setDeptSelectedFilters(initialFilters);
    }
  }, [departments]);

  useEffect(() => {
    if (
      departments.length > 0 &&
      Object.keys(deptDateRanges).length === departments.length &&
      !initialFetchDoneRef.current
    ) {
      initialFetchDoneRef.current = true;
      fetchInitialTimes();
    }
  }, [departments, deptDateRanges]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsResponse, peopleResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/groups`, {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": API_KEYS[14149800188],
          },
        }),
        axios.get(`${API_BASE_URL}/people`, {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": API_KEYS[14149800188],
          },
        }),
      ]);
      setDepartments(groupsResponse.data);
      setEmployees(peopleResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeForDepartmentEmployees = async (
    deptId,
    from,
    to,
    filter = "Exact Date Range"
  ) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    const allEntries = [];
    for (const empId of dept.assigned) {
      try {
        const entries = await fetchTimeEntries(empId, from, to);
        const filteredEntries = entries.filter((entry) => entry.by_me === true);
        filteredEntries.forEach((entry) => {
          entry.employeeId = empId;
          const emp = employeeMap[empId];
          entry.employeeName = emp
            ? `${emp.first_name} ${emp.last_name}`
            : "Unknown";
        });
        allEntries.push(...filteredEntries);
      } catch (error) {
        console.error(
          `Error fetching detailed time entries for employee ${empId}`,
          error
        );
      }
    }

    setDepartmentTimeEntries((prev) => ({ ...prev, [deptId]: allEntries }));

    const timeSummary = {};
    const dailySummary = {};
    const newLeaveDays = {};
    allEntries.forEach((entry) => {
      const empId = entry.employeeId;
      const date = entry.date; 
      if (!timeSummary[empId]) {
        timeSummary[empId] = { loggedMins: 0 };
        dailySummary[empId] = {};
        newLeaveDays[empId] = {};
      }
      const mins = (entry.logged_hours || 0) * 60 + (entry.logged_mins || 0);

      let isLeave = false;
      if (entry.timesheet && entry.timesheet.title) {
        const title = entry.timesheet.title.toLowerCase();
        let shortType = '';
        if (title.includes('full day leave')) {
          shortType = 'DL';
        } else if (title.includes('half day leave')) {
          shortType = 'HL';
        } else if (title.includes('short leave')) {
          shortType = 'SL';
        }
        if (shortType) {
          isLeave = true;
          const loggedStr = mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "0h 0m";
          newLeaveDays[empId][date] = {
            type: shortType,
            logged: loggedStr,
          };
        }
      }

      if (!isLeave) {
        timeSummary[empId].loggedMins += mins;
        if (!dailySummary[empId][date]) {
          dailySummary[empId][date] = 0;
        }
        dailySummary[empId][date] += mins;
      }
    });
    setLeaveDays((prev) => ({ ...prev, ...newLeaveDays }));

    const newTimeData = {};
    dept.assigned.forEach((empId) => {
      const summary = timeSummary[empId];
      const daily = dailySummary[empId] || {};
      if (summary) {
        newTimeData[empId] = {
          totalLogged:
            summary.loggedMins > 0
              ? `${Math.floor(summary.loggedMins / 60)}h ${
                  summary.loggedMins % 60
                }m`
              : "0h 0m",
          daily: Object.keys(daily).reduce((acc, date) => {
            acc[date] =
              daily[date] > 0
                ? `${Math.floor(daily[date] / 60)}h ${daily[date] % 60}m`
                : "0h 0m";
            return acc;
          }, {}),
        };
      } else {
        newTimeData[empId] = {
          totalLogged: "0h 0m",
          daily: {},
        };
      }
    });
    setTimeData((prev) => ({ ...prev, ...newTimeData }));
  };

  const handleDownloadExcel = (deptId) => {
    setDownloadLoading((prev) => new Set(prev).add(deptId));
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    const dateRange = deptDateRanges[deptId] || { from: "", to: "" };
    const dates = dateRange.from && dateRange.to ? getWeekdaysBetween(dateRange.from, dateRange.to) : [];
    const data = prepareDepartmentSummaryExcelData(
      dept.assigned,
      employeeMap,
      timeData,
      dates,
      leaveDays
    );
    downloadExcel(
      data,
      `${dept.name}_${dateRange.from}_to_${dateRange.to}.xlsx`,
      "Department Summary"
    );
    setDownloadLoading((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deptId);
      return newSet;
    });
  };

  const handleDownloadPDF = (deptId) => {
    setDownloadLoading((prev) => new Set(prev).add(deptId));
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    const dateRange = deptDateRanges[deptId] || { from: "", to: "" };
    const dates = dateRange.from && dateRange.to ? getWeekdaysBetween(dateRange.from, dateRange.to) : [];
    const { tableData, headers } = prepareDepartmentSummaryPDFData(
      dept.assigned,
      employeeMap,
      timeData,
      dates,
      leaveDays
    );
    downloadPDF(
      tableData,
      headers,
      `${dept.name}_${dateRange.from}_to_${dateRange.to}.pdf`,
      false,
      null,
      null,
      dept.name
    );
    setDownloadLoading((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deptId);
      return newSet;
    });
  };

  const handleEmployeeClick = (empId) => {
    const employee = employees.find((emp) => emp.id === empId);
    setSelectedEmployee(employee);
    setActiveButton("Employee");
    setSelectedId(empId);
    setView("details");
  };

  const renderDepartment = (dept) => {
    const isOpen = dropdownOpen === dept.id;
    const isLoading = downloadLoading.has(dept.id);
    const dateRange = deptDateRanges[dept.id] || { from: "", to: "" };

    // Generate list of weekdays between from and to
    const dates = dateRange.from && dateRange.to ? getWeekdaysBetween(dateRange.from, dateRange.to) : [];

    const columns = [
      // { key: "photo", label: "Photo" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      // { key: "title", label: "Title" },
      ...dates.map((date) => ({ key: date, label: date })),
      { key: "totalLogged", label: "Total Logged Time" },
    ];

    const tableData = dept.assigned
      .map((empId) => {
        const emp = employeeMap[empId];
        const time = timeData[empId] || { totalLogged: "-", daily: {} };
        const row = {
          // photo: <img src={emp.image_url} alt={emp.first_name} className="w-10 h-10 rounded-full" />,
          name: (
            <a
              className="hover:underline"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleEmployeeClick(emp.id);
              }}
            >
              {emp.first_name} {emp.last_name}
            </a>
          ),
          email: (
            <div className="relative group w-full h-full">
              <span className="truncate max-w-[100px] inline-block cursor-pointer">
                {emp.email}
              </span>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-10 shadow-xl border border-white/20">
                {emp.email}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-600"></div>
              </div>
            </div>
          ),
          
          totalLogged: timeLoadingDepts.has(dept.id) ? (
            <Spinner />
          ) : (
            time.totalLogged
          ),
        };
        dates.forEach((date) => {
          const leave = leaveDays[empId] && leaveDays[empId][date];
          if (leave) {
            row[date] = timeLoadingDepts.has(dept.id) ? (
              <Spinner />
            ) : (
              <div className="relative group w-full h-full flex justify-center items-center">
                <span className="truncate flex items-center justify-center max-w-[100px]  cursor-pointer font-semibold text-red-600 bg-red-100 h-[30px] w-[30px] rounded-full">
                  {leave.type}
                </span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-10 shadow-xl border border-white/20">
                  {leave.logged}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-600"></div>
                </div>
              </div>
            );
          } else {
            const dailyTime = time.daily[date] || "0h 0m";
            row[date] = timeLoadingDepts.has(dept.id) ? (
              <Spinner />
            ) : (
              <span className={getColorClass(dailyTime)}>{dailyTime}</span>
            );
          }
        });
        return emp ? row : null;
      })
      .filter(Boolean);

    const footer = [
      "Total",
      "",
      ...dates.map((date) => {
        const totalMins = dept.assigned.reduce((sum, empId) => {
          const time = timeData[empId];
          if (time && time.daily[date]) {
            const parts = time.daily[date].split("h ");
            const h = parseInt(parts[0]) || 0;
            const m = parseInt(parts[1]?.replace("m", "")) || 0;
            return sum + h * 60 + m;
          }
          return sum;
        }, 0);
        const totalStr =
          totalMins > 0
            ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
            : "-";
        return <span>{totalStr}</span>;
      }),
      (() => {
        const totalLoggedMins = dept.assigned.reduce((sum, empId) => {
          const time = timeData[empId];
          if (time && time.totalLogged !== "-") {
            const parts = time.totalLogged.split("h ");
            const h = parseInt(parts[0]) || 0;
            const m = parseInt(parts[1]?.replace("m", "")) || 0;
            return sum + h * 60 + m;
          }
          return sum;
        }, 0);
        const totalStr =
          totalLoggedMins > 0
            ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m`
            : "-";
        return <span>{totalStr}</span>;
      })(),
    ];

    return (
      <div key={dept.id} className="mb-8" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold ">
            {dept.name}
          </h3>

          <span className="bg-green-100 text-green-600 text-sm font-semibold px-2 py-1 rounded-full ">
            Employee Count: {dept.assigned.length}
          </span>
        </div>
        <div className="mb-4 flex justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <DateFilter
              selectedFilter={
                deptSelectedFilters[dept.id] || "Exact Date Range"
              }
              onFilterChange={(value) => {
                setDeptSelectedFilters((prev) => ({
                  ...prev,
                  [dept.id]: value,
                }));
                if (value !== "Exact Date Range") {
                  const range = getDateRange(value);
                  if (range) {
                    setDeptDateRanges((prev) => ({
                      ...prev,
                      [dept.id]: { from: range.from, to: range.to },
                    }));
                    setTimeLoadingDepts((prev) => new Set(prev).add(dept.id));
                    fetchTimeForDepartmentEmployees(
                      dept.id,
                      range.from,
                      range.to,
                      value
                    ).then(() => {
                      setTimeLoadingDepts((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(dept.id);
                        return newSet;
                      });
                    });
                  }
                }
              }}
              dateRange={dateRange}
              onDateRangeChange={(range) =>
                setDeptDateRanges((prev) => ({ ...prev, [dept.id]: range }))
              }
              onApply={async () => {
                setApplyLoading((prev) => new Set(prev).add(dept.id));
                setTimeLoadingDepts((prev) => new Set(prev).add(dept.id));
                const { from, to } = deptDateRanges[dept.id];
                await fetchTimeForDepartmentEmployees(
                  dept.id,
                  from,
                  to,
                  deptSelectedFilters[dept.id]
                );
                setApplyLoading((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(dept.id);
                  return newSet;
                });
                setTimeLoadingDepts((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(dept.id);
                  return newSet;
                });
              }}
              loading={applyLoading.has(dept.id)}
              disabled={
                loading ||
                timeLoadingDepts.has(dept.id) ||
                applyLoading.has(dept.id)
              }
            />
          </div>

          <div className="relative text-[16px]">
            <DownloadDropdown
              onExcel={() => handleDownloadExcel(dept.id)}
              onPDF={() => handleDownloadPDF(dept.id)}
              loading={downloadLoading.has(dept.id) || timeLoadingDepts.has(dept.id)}
            />
          </div>
        </div>
        <DataTable columns={columns} data={tableData} footer={footer} />
      </div>
    );
  };

  return (
    <div>
      {!loading && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-2">Time Entry Color Legend</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span className="text-sm">Green: Exactly 8 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
              <span className="text-sm">Yellow: More than 8 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 rounded-full"></span>
              <span className="text-sm">Red: Less than 8 hours, DL (Full Day Leave), HL (Half Day Leave), SL (Short Leave)</span>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <p>Loading departments, employees, and time data...</p>
      ) : (
        departments.map((dept) => renderDepartment(dept))
      )}
    </div>
  );
};

export default DepartmentList;
