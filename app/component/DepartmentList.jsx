import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { getFormattedDate, getDateRange } from "../utils/dateUtils";
import { API_BASE_URL, API_KEYS } from "../utils/constants";
import { fetchTimeEntries, TimeEntry } from "../utils/apiUtils";
import { prepareDepartmentSummaryExcelData, prepareDepartmentSummaryPDFData, downloadExcel, downloadPDF } from "../utils/downloadUtils";
import Spinner from "../components/ui/Spinner";
import DateFilter from "../components/ui/DateFilter";
import DownloadDropdown from "../components/ui/DownloadDropdown";
import DataTable from "../components/ui/DataTable";

const DepartmentList = ({ setActiveButton, setView, setSelectedId, setSelectedEmployee }) => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeData, setTimeData] = useState({});
  const [departmentTimeEntries, setDepartmentTimeEntries] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(new Set());
  const [applyLoading, setApplyLoading] = useState(new Set());
  const [isTimeFetching, setIsTimeFetching] = useState(true);
  const [timeLoadingDepts, setTimeLoadingDepts] = useState(new Set());
  const dropdownRef = useRef(null);

  const [deptDateRanges, setDeptDateRanges] = useState({});
  const [deptSelectedFilters, setDeptSelectedFilters] = useState({});

  const initialFetchDoneRef = useRef(false);

  const employeeMap = employees.reduce((map, emp) => {
    map[emp.id] = emp;
    return map;
  }, {});

  const fetchInitialTimes = async () => {
    setTimeLoadingDepts(new Set(departments.map((d) => d.id)));
    const promises = departments.map(async (dept) => {
      const { from, to } = deptDateRanges[dept.id];
      await fetchTimeForDepartmentEmployees(dept.id, from, to, "Exact Date Range");
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
          from: getFormattedDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
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

    if (filter === "Today") {
      const todayEntries = [];
      for (const empId of dept.assigned) {
        try {
          const entries = await fetchTimeEntries(empId, from, to);
          const filteredEntries = entries.filter((entry) => entry.by_me === true);
          filteredEntries.forEach((entry) => {
            entry.employeeId = empId;
            const emp = employeeMap[empId];
            entry.employeeName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
          });
          todayEntries.push(...filteredEntries);
        } catch (error) {
          console.error(`Error fetching for employee ${empId}`, error);
        }
      }

      const timeSummaryToday = {};
      todayEntries.forEach((entry) => {
        const empId = entry.employeeId;
        if (!timeSummaryToday[empId]) {
          timeSummaryToday[empId] = { loggedMins: 0 };
        }
        timeSummaryToday[empId].loggedMins +=
          (entry.logged_hours || 0) * 60 + (entry.logged_mins || 0);
      });

      setDepartmentTimeEntries((prev) => ({ ...prev, [deptId]: todayEntries }));

      const newTimeData = {};
      dept.assigned.forEach((empId) => {
        const loggedMinsToday = timeSummaryToday[empId]?.loggedMins || 0;

        if (loggedMinsToday > 0) {
          newTimeData[empId] = {
            totalLogged: `${Math.floor(loggedMinsToday / 60)}h ${loggedMinsToday % 60}m`,
          };
        } else {
          newTimeData[empId] = {
            totalLogged: "0h 0m",
          };
        }
      });
      setTimeData((prev) => ({ ...prev, ...newTimeData }));
    } else {
      const allEntries = [];
      for (const empId of dept.assigned) {
        try {
          const entries = await fetchTimeEntries(empId, from, to);
          const filteredEntries = entries.filter((entry) => entry.by_me === true);
          filteredEntries.forEach((entry) => {
            entry.employeeId = empId;
            const emp = employeeMap[empId];
            entry.employeeName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
          });
          allEntries.push(...filteredEntries);
        } catch (error) {
          console.error(`Error fetching detailed time entries for employee ${empId}`, error);
        }
      }

      setDepartmentTimeEntries((prev) => ({ ...prev, [deptId]: allEntries }));

      const timeSummary = {};
      allEntries.forEach((entry) => {
        const empId = entry.employeeId;
        if (!timeSummary[empId]) {
          timeSummary[empId] = { loggedMins: 0 };
        }
        timeSummary[empId].loggedMins +=
          (entry.logged_hours || 0) * 60 + (entry.logged_mins || 0);
      });
      const newTimeData = {};
      dept.assigned.forEach((empId) => {
        const summary = timeSummary[empId];
        if (summary) {
          newTimeData[empId] = {
            totalLogged: summary.loggedMins > 0 ? `${Math.floor(summary.loggedMins / 60)}h ${summary.loggedMins % 60}m` : "0h 0m",
          };
        } else {
          newTimeData[empId] = {
            totalLogged: "0h 0m",
          };
        }
      });
      setTimeData((prev) => ({ ...prev, ...newTimeData }));
    }
  };

  const handleDownloadExcel = (deptId) => {
    setDownloadLoading((prev) => new Set(prev).add(deptId));
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    const data = prepareDepartmentSummaryExcelData(dept.assigned, employeeMap, timeData);
    downloadExcel(data, `department_summary_${deptId}_${deptDateRanges[deptId]?.from}_to_${deptDateRanges[deptId]?.to}.xlsx`, "Department Summary");
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
    const { tableData, headers } = prepareDepartmentSummaryPDFData(dept.assigned, employeeMap, timeData);
    downloadPDF(tableData, headers, `department_summary_${deptId}_${deptDateRanges[deptId]?.from}_to_${deptDateRanges[deptId]?.to}.pdf`);
    setDownloadLoading((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deptId);
      return newSet;
    });
  };

  const handleEmployeeClick = (empId) => {
    const employee = employees.find(emp => emp.id === empId);
    setSelectedEmployee(employee);
    setActiveButton("Employee");
    setSelectedId(empId);
    setView("details");
  };

  const renderDepartment = (dept) => {
    const isOpen = dropdownOpen === dept.id;
    const isLoading = downloadLoading.has(dept.id);
    const dateRange = deptDateRanges[dept.id] || { from: "", to: "" };

    const columns = [
      { key: "id", label: "ID" },
      // { key: "photo", label: "Photo" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      // { key: "title", label: "Title" },
      { key: "totalLogged", label: "Total Logged Time" },
    ];

    const tableData = dept.assigned.map((empId) => {
      const emp = employeeMap[empId];
      const time = timeData[empId] || { totalLogged: "-" };
      return emp ? {
        id: (
          <a
            className="hover:underline"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleEmployeeClick(emp.id);
            }}
          >
            {emp.id}
          </a>
        ),
        // photo: <img src={emp.image_url} alt={emp.first_name} className="w-10 h-10 rounded-full" />,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        // title: emp.title || "—",
        totalLogged: timeLoadingDepts.has(dept.id) ? <Spinner /> : time.totalLogged,
      } : null;
    }).filter(Boolean);

    const footer = [
      "Total",
      "",
      "",
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
        return totalLoggedMins > 0 ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m` : "-";
      })(),
    ];

    return (
      <div key={dept.id} className="mb-8" ref={dropdownRef}>
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          {dept.name}
        </h3>
        <div className="mb-4 flex justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <DateFilter
              selectedFilter={deptSelectedFilters[dept.id] || "Exact Date Range"}
              onFilterChange={(value) => {
                setDeptSelectedFilters((prev) => ({ ...prev, [dept.id]: value }));
                if (value !== "Exact Date Range") {
                  const range = getDateRange(value);
                  if (range) {
                    setDeptDateRanges((prev) => ({
                      ...prev,
                      [dept.id]: { from: range.from, to: range.to },
                    }));
                    setTimeLoadingDepts((prev) => new Set(prev).add(dept.id));
                    fetchTimeForDepartmentEmployees(dept.id, range.from, range.to, value).then(() => {
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
                await fetchTimeForDepartmentEmployees(dept.id, from, to, deptSelectedFilters[dept.id]);
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
            />
          </div>

          <div className="relative text-[16px]">
            <DownloadDropdown
              onExcel={() => handleDownloadExcel(dept.id)}
              onPDF={() => handleDownloadPDF(dept.id)}
              loading={isLoading || isTimeFetching}
            />
          </div>
        </div>
        <DataTable columns={columns} data={tableData} footer={footer} />
      </div>
    );
  };

  return (
    <div>
      {loading ? (
        <p>Loading departments, employees, and time data...</p>
      ) : (
        departments.map((dept) => renderDepartment(dept))
      )}
    </div>
  );
};

export default DepartmentList;
