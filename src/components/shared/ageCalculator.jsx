/**
 * Calculate the current age from a birthdate and format it according to these rules:
 * - Less than 16 weeks: "X weeks"
 * - 16 weeks to 1 year: "X months"
 * - 1 year or more: "Y years, Z months"
 * 
 * @param {string} birthdateStr - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted age display string
 */
export function calculateCurrentAge(birthdateStr) {
  if (!birthdateStr) return "Unknown";

  const birthdate = new Date(birthdateStr);
  const today = new Date();

  let years = today.getFullYear() - birthdate.getFullYear();
  let months = today.getMonth() - birthdate.getMonth();
  let days = today.getDate() - birthdate.getDate();

  // Adjust for negative days
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Adjust for negative months
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Calculate total weeks for young patients
  const totalWeeks = Math.floor(
    (today.getTime() - birthdate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  // Less than 16 weeks: display weeks
  if (totalWeeks < 16) {
    return `${totalWeeks} week${totalWeeks !== 1 ? "s" : ""}`;
  }

  // Less than 1 year (52 weeks): display months
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) {
    return `${totalMonths} month${totalMonths !== 1 ? "s" : ""}`;
  }

  // 1 year or more: display years, and months only if > 0
  const monthsDisplay = months > 0 ? `, ${months} month${months !== 1 ? "s" : ""}` : "";
  return `${years} year${years !== 1 ? "s" : ""}${monthsDisplay}`;
}

/**
 * Calculate age components from a birthdate
 * Returns { years, months, weeks } for snapshot storage in PatientVisit
 * 
 * @param {string} birthdateStr - ISO date string (YYYY-MM-DD)
 * @returns {object} { years: number, months: number, weeks: number }
 */
export function calculateAgeComponents(birthdateStr) {
  if (!birthdateStr) return { years: 0, months: 0, weeks: 0 };

  const birthdate = new Date(birthdateStr);
  const today = new Date();

  let years = today.getFullYear() - birthdate.getFullYear();
  let months = today.getMonth() - birthdate.getMonth();
  let days = today.getDate() - birthdate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalWeeks = Math.floor(
    (today.getTime() - birthdate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    weeks: totalWeeks,
  };
}