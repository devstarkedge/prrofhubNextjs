const DataTable = ({ columns, data, onRowClick, footer }) => {
  return (
    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
      <table className="min-w-full text-sm text-left text-gray-700 rounded-lg table-fixed">
        <thead className="bg-gray-200 text-gray-900 font-semibold">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key}
                className={`px-4 py-3 border-b border-gray-300 whitespace-nowrap ${
                  index === 0
                    ? "text-left"
                    : index === columns.length - 1
                    ? "text-right"
                    : "text-center"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={`${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              } ${onRowClick ? "hover:bg-blue-100 transition-colors duration-200 cursor-pointer" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={col.key}
                  className={`px-4 py-2 whitespace-nowrap border-b border-gray-200 ${
                    colIndex === 0
                      ? "text-left"
                      : colIndex === columns.length - 1
                      ? "text-right"
                      : "text-center"
                  }`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              {footer.map((cell, index) => (
                <td
                  key={index}
                  className={`px-4 py-2 border-t border-gray-300 ${
                    index === 0
                      ? "text-left"
                      : index === footer.length - 1
                      ? "text-right"
                      : "text-center"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default DataTable;
