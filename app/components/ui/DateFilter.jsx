const DateFilter = ({
  selectedFilter,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onApply,
  loading = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedFilter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="Today">Today</option>
        <option value="Yesterday">Yesterday</option>
        <option value="This Week">This Week</option>
        <option value="This Month">This Month</option>
        <option value="Exact Date Range">Exact Date Range</option>
      </select>

      {selectedFilter === "Exact Date Range" && (
        <>
          <div className="flex items-center space-x-2">
            <label htmlFor="fromDate" className="whitespace-nowrap font-medium">
              From Date:
            </label>
            <input
              id="fromDate"
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, from: e.target.value })
              }
              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="toDate" className="whitespace-nowrap font-medium">
              To Date:
            </label>
            <input
              id="toDate"
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, to: e.target.value })
              }
              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={onApply}
            disabled={loading}
            className={`px-4 py-2 text-white rounded transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Applying..." : "Apply Filter"}
          </button>
        </>
      )}
    </div>
  );
};

export default DateFilter;
