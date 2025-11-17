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

const getPDFColorClass = (timeStr) => {
  if (!timeStr || timeStr === "0h 0m" || timeStr === "-")
    return [251, 44, 54]; // Red
  const parts = timeStr.split("h ");
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]?.replace("m", "")) || 0;
  const totalMins = h * 60 + m;
  if (totalMins < 480) return [251, 44, 54]; // Red
  if (totalMins === 480) return [0, 201, 81]; // Green
  return [240, 177, 0]; // Yellow
};

export const downloadPDF = (
  tableData,
  headers,
  filename,
  isSummary = false,
  totalLogged,
  totalEstimated,
  deptName = ""
) => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const body = [...tableData];
    if (isSummary && totalLogged && totalEstimated) {
      body.push(["Total", "", "", "", totalLogged, totalEstimated, ""]);
    }
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 5;
    const marginRight = 5;
    const availableWidth = pageWidth - marginLeft - marginRight;

    // Add department name at the top if provided
    let startY = 15;
    if (deptName) {
      doc.setFontSize(14);
      doc.text(deptName, pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text("Time Entry Color Legend", pageWidth / 2, 25, { align: 'center' });
      // Legend in single row with color dots
      const legendY = 32;
      const startX = pageWidth / 2 - 60;
      // Green
      doc.setFillColor(0, 201, 81);
      doc.circle(startX, legendY, 2, 'F');
      doc.text("Green: Exactly 8 hours", startX + 5, legendY + 1);
      // Yellow
      doc.setFillColor(240, 177, 0);
      doc.circle(startX + 70, legendY, 2, 'F');
      doc.text("Yellow: More than 8 hours", startX + 75, legendY + 1);
      // Red
      doc.setFillColor(251, 44, 54);
      doc.circle(startX + 150, legendY, 2, 'F');
      doc.text("Red: Less than 8 hours", startX + 155, legendY + 1);
      startY = 45;
    }

    // Calculate column styles
    const columnStyles = {};
    const numColumns = headers.length;

    // For department summary PDF, headers are ["Date", ...employeeNames]
    // So Date column fixed, others distributed
    if (headers[0] === "Date") {
      columnStyles[0] = { cellWidth: 25 }; // Date column
      const remainingWidth = availableWidth - 25;
      const empWidth = remainingWidth / (numColumns - 1);
      for (let i = 1; i < numColumns; i++) {
        columnStyles[i] = { cellWidth: empWidth };
      }
    } else {
      // Fallback for other PDFs
      const columnWidth = availableWidth / numColumns;
      for (let i = 0; i < numColumns; i++) {
        columnStyles[i] = { cellWidth: columnWidth };
      }
    }

    autoTable(doc, {
      head: [headers],
      body,
      styles: { fontSize: 9, halign: 'center', valign: 'middle' },
      columnStyles,
      margin: { left: marginLeft, right: marginRight },
      didParseCell: function (data) {
        if (data.section === 'body') {
          const colIndex = data.column.index;
          const cellContent = data.cell.raw;

          if (headers[0] === "Date" && colIndex > 0) {
            if (data.row.index !== data.table.body.length - 1) {
              const color = getPDFColorClass(cellContent);
              data.cell.styles.textColor = color;
            }
          } else {
            if (headers[colIndex] !== "Name" && headers[colIndex] !== "Email" && headers[colIndex] !== "Total Logged Time" && headers[colIndex] !== "Date") {
              if (data.row.index !== data.table.body.length - 1) {
                const color = getPDFColorClass(cellContent);
                data.cell.styles.textColor = color;
              }
            }
          }
        }
      },
      startY: startY, 
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
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to download PDF. Please try again.");
  }
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
  timeData,
  dates = []
) => {
  const data = deptAssigned.map((empId) => {
    const emp = employeeMap[empId];
    const time = timeData[empId] || {
      totalLogged: "-",
      daily: {},
    };
    const row = {
      Name: `${emp.first_name} ${emp.last_name}`,
      Email: emp.email,
    };
    dates.forEach(date => {
      row[date] = time.daily[date] || "0h 0m";
    });
    row["Total Logged Time"] = time.totalLogged;
    return row;
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

  const totalRow = {
    Name: "Total",
    Email: "",
  };
  dates.forEach(date => {
    const totalMins = deptAssigned.reduce((sum, empId) => {
      const time = timeData[empId];
      if (time && time.daily[date]) {
        const parts = time.daily[date].split("h ");
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]?.replace("m", "")) || 0;
        return sum + h * 60 + m;
      }
      return sum;
    }, 0);
    totalRow[date] = totalMins > 0 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m` : "-";
  });
  totalRow["Total Logged Time"] = totalLoggedMins > 0
    ? `${Math.floor(totalLoggedMins / 60)}h ${totalLoggedMins % 60}m`
    : "-";
  data.push(totalRow);

  return data;
};

export const prepareDepartmentSummaryPDFData = (
  deptAssigned,
  employeeMap,
  timeData,
  dates = []
) => {
  // Transpose: dates as rows, employees as columns
  const employeeNames = deptAssigned.map(empId => {
    const emp = employeeMap[empId];
    return `${emp.first_name} ${emp.last_name}`;
  });

  const headers = ["Date", ...employeeNames];

  const tableData = dates.map(date => {
    const row = [date];
    deptAssigned.forEach(empId => {
      const time = timeData[empId] || { daily: {} };
      row.push(time.daily[date] || "0h 0m");
    });
    return row;
  });

  // Total row
  const totalRow = ["Total Logged Time"];
  deptAssigned.forEach(empId => {
    const time = timeData[empId];
    if (time && time.totalLogged !== "-") {
      totalRow.push(time.totalLogged);
    } else {
      totalRow.push("-");
    }
  });
  tableData.push(totalRow);

  return {
    tableData,
    headers,
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
