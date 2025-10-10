export const getFormattedDate = (date) => {
  return date.toISOString().split('T')[0];
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
