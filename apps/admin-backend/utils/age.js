/**
 * Calculate age in full years from a Date of Birth.
 * @param {Date|string|null} dob - Date of birth (Date object, ISO string, or null)
 * @returns {number|null} Age in full years, or null if dob is falsy
 */
function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

module.exports = { calculateAge };
