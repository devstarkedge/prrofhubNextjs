import { useState, useEffect } from "react";
import { fetchTimeEntries } from "../utils/apiUtils";

export const useTimeEntries = (employeeId, from, to) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const entries = await fetchTimeEntries(employeeId, from, to);
      setData(entries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId, from, to]);

  return { data, loading, error, refetch: fetchData };
};
