export const formatDate = (date: Date | string | number): string => {
  return new Date(date).toISOString().split('T')[0];
};

export const addDays = (date: Date | string | number, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isExpired = (expiryDate: Date | string | number): boolean => {
  return new Date() > new Date(expiryDate);
};
