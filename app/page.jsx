"use client";

import { useState } from "react";
import EmployeeList from "./component/EmployeeList.jsx";
import DepartmentList from "./component/DepartmentList.jsx";

function App() {
  const [activeButton, setActiveButton] = useState("Employee");
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="p-6 max-w-[1400px] m-auto">
      <h2 className="text-3xl font-bold text-center mb-6">My Time Entries</h2>

      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${
            activeButton === "Employee"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
          onClick={() => {
            setActiveButton("Employee");
            setView("list");
            setSelectedId(null);
          }}
        >
          Employee
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            activeButton === "Department"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
          onClick={() => setActiveButton("Department")}
        >
          Department
        </button>
      </div>

      
      {activeButton === "Employee" && (
        <EmployeeList
          view={view}
          setView={setView}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      )}

      {activeButton === "Department" && (
        <DepartmentList
          setActiveButton={setActiveButton}
          setView={setView}
          setSelectedId={setSelectedId}
        />
      )}
    </div>
  );
}

export default App;
