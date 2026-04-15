const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

module.exports = {
  formatDate,
  addDays,
  isExpired,
};
