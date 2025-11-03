# TODO: Fix PDF Download and Excel Date-wise Time Issues

## Steps to Complete

- [x] Update `prepareDepartmentSummaryExcelData` in `downloadUtils.js` to accept a `dates` array and include daily time columns for each date.
- [x] Update `prepareDepartmentSummaryPDFData` in `downloadUtils.js` to accept a `dates` array and include daily time columns for each date.
- [x] Add error handling to `downloadPDF` function in `downloadUtils.js` to catch and log any issues.
- [x] Update `handleDownloadExcel` in `DepartmentList.jsx` to pass the dates array to the preparation function.
- [x] Update `handleDownloadPDF` in `DepartmentList.jsx` to pass the dates array to the preparation function.
