export const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date)) return 'Invalid Date';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  const options = {weekday: 'long', month: 'long', day: 'numeric'};
  return date.toLocaleDateString(undefined, options);
};
