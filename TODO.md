# TODO: Add Download Functionality for Todo Tasks Table

- [x] Add `prepareTodoExcelData(todos)` function in `downloadUtils.js` to prepare data for Excel download, including totals.
- [x] Add `prepareTodoPDFData(todos)` function in `downloadUtils.js` to prepare table data and headers for PDF download, including totals.
- [x] In `EmployeeList.jsx`, add `downloadTodoExcel` function that calls `prepareTodoExcelData` and `downloadExcel`.
- [x] In `EmployeeList.jsx`, add `downloadTodoPDF` function that calls `prepareTodoPDFData` and `downloadPDF`.
- [x] In `EmployeeList.jsx`, add a `DownloadDropdown` component for the todos table, placed near the "Todo Tasks" heading, with onExcel and onPDF handlers, and loading={loadingTodos}.
