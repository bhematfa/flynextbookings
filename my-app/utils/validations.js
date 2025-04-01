export const isValidDate = (date) => {
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() + 1 === month &&
    parsedDate.getDate() === day
  );
};
