export const generateOTP = (length: number = 4): string => {
  if (process.env.NODE_ENV === 'development') return '1234';

  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

export const formatPhone = (phone: string | number): string => {
  // Remove all non-digits and ensure it's a 10-digit number
  const cleaned = ('' + phone).replace(/\D/g, '');
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
};
