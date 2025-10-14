# TODO: Fix PDF Column Widths for Employee Details Table

## Steps to Complete

- [x] Modify the `downloadPDF` function in `proofhub/app/utils/downloadUtils.js` to set equal column widths for all columns by calculating the width based on the number of headers and applying `columnStyles`.
- [ ] Test the PDF download for employee details to verify that all columns have equal width and the description column no longer expands to the maximum page width.
