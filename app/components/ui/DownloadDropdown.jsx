import { useState, useRef, useEffect } from "react";

const DownloadDropdown = ({ onExcel, onPDF, loading }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex justify-center" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
        disabled={loading}
      >
        {loading ? "Loading..." : "Download"}
      </button>
      {dropdownOpen && (
        <div className="absolute mt-6 w-40 bg-white border border-gray-300 rounded shadow-lg z-10">
          <button
            onClick={() => {
              onExcel();
              setDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            disabled={loading}
          >
            Download Excel
          </button>
          <button
            onClick={() => {
              onPDF();
              setDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            disabled={loading}
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadDropdown;
