import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadExcel = (
  data,
  filename,
  sheetName = "Sheet1",
  isSummary = false,
  totalLogged,
  totalEstimated
) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPDF = (
  tableData,
  headers,
  filename,
  isSummary = false,
  totalLogged,
  totalEstimated
) => {
  const doc = new jsPDF();
  const body = [...tableData];
  if (isSummary && totalLogged && totalEstimated) {
    body.push(["Total", "", "", "", totalLogged, totalEstimated, ""]);
  }
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14; 
  const marginRight = 14; 
  const availableWidth = pageWidth - marginLeft - marginRight;
  const columnWidth = availableWidth / headers.length;

  autoTable(doc, {
    head: [headers],
    body,
    columnStyles: headers.reduce((styles, _, index) => {
      styles[index] = { cellWidth: columnWidth };
      return styles;
    }, {}),
  });
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const prepareTimeEntryExcelData = (timeEntries) => {
  const data = timeEntries.map((entry) => ({
    Date: new Date(entry.date).toLocaleDateString(),
    "Task Name": entry.task?.task_name || "-",
    "Subtask Name": entry.task?.subtask_name || "-",
    "Project Name": entry.project?.name || "-",
    Logged: (() => {
      const mins = (entry.logged_hours || 0) * 60 + (entry.logged_mins || 0);
      return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "-";
    })(),
    Estimated: (() => {
      const mins = entry.timesheet
        ? (entry.timesheet.estimated_hours || 0) * 60 +
          (entry.timesheet.estimated_mins || 0)
        : 0;
      return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "-";
    })(),
    Description: entry.description || "-",
  }));

  const totalLogged = timeEntries.reduce(
    (sum, entry) =>
      sum + ((entry.logged_hours || 0) * 60 + (entry.logged_mins || 0)),
    0
  );
  const totalEst = timeEntries.reduce((sum, entry) => {
    if (entry.timesheet) {
      return (
        sum +
        (entry.timesheet.estimated_hours || 0) * 60 +
        (entry.timesheet.estimated_mins || 0)
      );
    }
    return sum;
  }, 0);

  data.push({
    Date: "Total",
    "Task Name": "",
    "Subtask Name": "",
    "Project Name": "",
    Logged:
      totalLogged > 0
        ? `${Math.floor(totalLogged / 60)}h ${totalLogged % 60}m`
        : "-",
    Estimated:
      totalEst > 0 ? `${Math.floor(totalEst / 60)}h ${totalEst % 60}m` : "-",
    Description: "",
  });

  return data;
};

export const prepareTimeEntryPDFData = (timeEntries) => {
  const tableData = timeEntries.map((entry) => [
    new Date(entry.date).toLocaleDateString(),
    entry.task?.task_name || "-",
    entry.task?.subtask_name || "-",
    entry.project?.name || "-",
    (() => {
      const mins = (entry.logged_hours || 0) * 60 + (entry.logged_mins || 0);
      return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "-";
    })(),
    (() => {
      const mins = entry.timesheet
        ? (entry.timesheet.estimated_hours || 0) * 60 +
          (entry.timesheet.estimated_mins || 0)
        : 0;
      return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "-";
    })(),
    entry.description || "-",
  ]);

  const totalLogged = timeEntries.reduce(
    (sum, entry) =>
      sum + ((entry.logged_hours || 0) * 60 + (entry.logged_mins || 0)),
    0
  );
  const totalEst = timeEntries.reduce((sum, entry) => {
    if (entry.timesheet) {
      return (
        sum +
        (entry.timesheet.estimated_hours || 0) * 60 +
        (entry.timesheet.estimated_mins || 0)
      );
    }
    return sum;
  }, 0);

  tableData.push([
    "Total",
    "",
    "",
    "",
    totalLogged > 0
      ? `${Math.floor(totalLogged / 60)}h ${totalLogged % 60}m`
      : "-",
    totalEst > 0 ? `${Math.floor(totalEst / 60)}h ${totalEst % 60}m` : "-",
    "",
  ]);

  return {
    tableData,
    headers: [
      "Date",
      "Task Name",
      "Subtask Name",
      "Project Name",
      "Logged",
      "Estimated",
      "Description",
    ],
  };
};

export const prepareDepartmentSummaryExcelData = (
  deptAssigned,
  employeeMap,
  timeData
) => {
  const data = deptAssigned.map((empId) => {
    const emp = employeeMap[empId];
    const time = timeData[empId] || {
      totalLogged: "-",
      totalEstimated: "-",
    };
    return {
      ID: emp.id,
      Name: `${emp.first_name} ${emp.last_name}`,
      Email: emp.email,
      Title: emp.title || "-",
      "Total Logged Time": time.totalLogged,
      "Estimated Time": time.totalEstimated,
    };
  });

  const totalLoggedMins = deptAssigned.reduce((sum, empId) => {
    const time = timeData[empId];
    if (time && time.totalLogged !== "-") {
      const parts = time.totalLogged.split("h ");
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]?.replace("m", "")) || 0;
      return sum + h * 60 + m;
    }
    return sum;
  }, 0);
  const totalEstMins = deptAssigned.reduce((sum, empId) => {
    const time = timeData[empId];
    if (time && time.totalEstimated !== "-") {
      const parts = time.totalEstimated.split("h ");
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]?.replace("m", "")) || 0;
      return sum + h * 60 + m;
    }
    return sum;
  }, 0);

  data.push({
    ID: "Total",
    Name: "",
    Email: "",
    Title: "",
    "Total Logged Time":
      totalLoggedMins > 0
        ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m`
        : "-",
    "Estimated Time":
      totalEstMins > 0
        ? `${Math.floor(totalEstMins / 60)}h ${totalEstMins % 60}m`
        : "-",
  });

  return data;
};

export const prepareDepartmentSummaryPDFData = (
  deptAssigned,
  employeeMap,
  timeData
) => {
  const tableData = deptAssigned.map((empId) => {
    const emp = employeeMap[empId];
    const time = timeData[empId] || {
      totalLogged: "-",
      totalEstimated: "-",
    };
    return [
      emp.id,
      `${emp.first_name} ${emp.last_name}`,
      emp.email,
      emp.title || "-",
      time.totalLogged,
      time.totalEstimated,
    ];
  });

  const totalLoggedMins = deptAssigned.reduce((sum, empId) => {
    const time = timeData[empId];
    if (time && time.totalLogged !== "-") {
      const parts = time.totalLogged.split("h ");
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]?.replace("m", "")) || 0;
      return sum + h * 60 + m;
    }
    return sum;
  }, 0);
  const totalEstMins = deptAssigned.reduce((sum, empId) => {
    const time = timeData[empId];
    if (time && time.totalEstimated !== "-") {
      const parts = time.totalEstimated.split("h ");
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]?.replace("m", "")) || 0;
      return sum + h * 60 + m;
    }
    return sum;
  }, 0);

  tableData.push([
    "Total",
    "",
    "",
    "",
    totalLoggedMins > 0
      ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m`
      : "-",
    totalEstMins > 0
      ? `${Math.floor(totalEstMins / 60)}h ${totalEstMins % 60}m`
      : "-",
  ]);

  return {
    tableData,
    headers: ["ID", "Name", "Email", "Title", "Total Logged Time", "Estimated Time"],
  };
};

export const prepareTodoExcelData = (todos) => {
  const data = todos.map((todo) => ({
    ID: todo.id || "-",
    Name: todo.title || "-",
    Project: todo.project?.name || "-",
    Logged: (() => {
      const mins = (todo.logged_hours || 0) * 60 + (todo.logged_mins || 0);
      return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "-";
    })(),
  }));

  const totalLogged = todos.reduce(
    (sum, todo) => sum + ((todo.logged_hours || 0) * 60 + (todo.logged_mins || 0)),
    0
  );

  data.push({
    ID: "Total",
    Name: "",
    Project: "",
    Logged: totalLogged > 0 ? `${Math.floor(totalLogged / 60)}h ${totalLogged % 60}m` : "-",
  });

  return data;
};

export const prepareTodoPDFData = (todos) => {
  const tableData = todos.map((todo) => [
    todo.id || "-",
    todo.title || "-",
    todo.project?.name || "-",
    (() => {
      const mins = (todo.logged_hours || 0) * 60 + (todo.logged_mins || 0);
      return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "-";
    })(),
  ]);

  const totalLogged = todos.reduce(
    (sum, todo) => sum + ((todo.logged_hours || 0) * 60 + (todo.logged_mins || 0)),
    0
  );

  tableData.push([
    "Total",
    "",
    "",
    totalLogged > 0 ? `${Math.floor(totalLogged / 60)}h ${totalLogged % 60}m` : "-",
  ]);

  return {
    tableData,
    headers: ["ID", "Name", "Project", "Logged"],
  };
};
