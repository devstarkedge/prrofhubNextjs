export const getFormattedDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateRange = (filter) => {
  const today = new Date();
  const fromDate = new Date(today);

  switch (filter) {
    case 'Today':
      return {
        from: getFormattedDate(today),
        to: getFormattedDate(today),
      };
    case 'Yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return {
        from: getFormattedDate(yesterday),
        to: getFormattedDate(yesterday),
      };
    case 'This Week':
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      return {
        from: getFormattedDate(startOfWeek),
        to: getFormattedDate(today),
      };
    case 'Last 7 Days':
      fromDate.setDate(today.getDate() - 7);
      return {
        from: getFormattedDate(fromDate),
        to: getFormattedDate(today),
      };
    case 'Last 30 Days':
      fromDate.setDate(today.getDate() - 30);
      return {
        from: getFormattedDate(fromDate),
        to: getFormattedDate(today),
      };
    case 'This Month':
      fromDate.setDate(1);
      return {
        from: getFormattedDate(fromDate),
        to: getFormattedDate(today),
      };
    default:
      return null;
  }
};

export const getDaysBetween = (from, to) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffTime = Math.abs(toDate - fromDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  return diffDays;
};
