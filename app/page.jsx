"use client";

import { useState } from "react";
import EmployeeList from "./component/EmployeeList.jsx";
import DepartmentList from "./component/DepartmentList.jsx";

function App() {
  const [activeButton, setActiveButton] = useState("Employee");
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  return (
    <div className="p-6 max-w-[1400px] m-auto">
      <h2 className="text-3xl font-bold text-center mb-6">{selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}'s TimeSheet` : 'My TimeSheet'}</h2>

      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 cursor-pointer rounded-md ${
            activeButton === "Employee"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
          onClick={() => {
            setActiveButton("Employee");
            setView("list");
            setSelectedId(null);
            setSelectedEmployee(null);
          }}
        >
          Employee
        </button>
        <button
          className={`px-4 py-2 cursor-pointer rounded-md ${
            activeButton === "Department"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
          onClick={() => {
            setActiveButton("Department");
            setSelectedId(null);
            setSelectedEmployee(null);
          }}
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
          setSelectedEmployee={setSelectedEmployee}
        />
      )}

      {activeButton === "Department" && (
        <DepartmentList
          setActiveButton={setActiveButton}
          setView={setView}
          setSelectedId={setSelectedId}
          setSelectedEmployee={setSelectedEmployee}
        />
      )}
    </div>
  );
}

export default App;
