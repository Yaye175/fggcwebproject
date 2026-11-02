// Shared rules for monthly dues, used by the member portal, the finance admin
// and the API that saves payments, so all three always agree.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// First year whose dues are tracked on the site. Every year from here up to
// the current calendar year is editable; a new year appears automatically on
// 1 January with no code change.
const FIRST_DUES_YEAR = 2024;

const currentYear = (now = new Date()) => now.getFullYear();

// [current, current-1, …, FIRST_DUES_YEAR] — newest first.
function duesYears(now = new Date()) {
    const years = [];
    for (let y = currentYear(now); y >= FIRST_DUES_YEAR; y--) years.push(y);
    return years;
}

function isDuesYear(year, now = new Date()) {
    return Number.isInteger(year) && year >= FIRST_DUES_YEAR && year <= currentYear(now);
}

// Parse a query/body value into a dues year, defaulting to the current year.
// Returns null when a value was given but isn't a valid dues year.
function parseYear(value, now = new Date()) {
    if (value === undefined || value === null || value === '') return currentYear(now);
    const year = Number(value);
    return isDuesYear(year, now) ? year : null;
}

// "Jan, Feb,Mar" -> { months: ['Jan','Feb','Mar'], invalid: [] }
// Output is de-duplicated and in calendar order; unknown tokens are reported.
function parseMonths(value) {
    const tokens = String(value || '').split(',').map(s => s.trim()).filter(Boolean);
    const invalid = tokens.filter(t => !MONTHS.includes(t));
    const months = MONTHS.filter(m => tokens.includes(m));
    return { months, invalid };
}

// Months that should be paid by now for the given year: all twelve for a past
// year, January through this month for the current year.
function expectedMonths(year, now = new Date()) {
    const thisYear = currentYear(now);
    if (year < thisYear) return MONTHS.slice();
    if (year === thisYear) return MONTHS.slice(0, now.getMonth() + 1);
    return [];
}

// 0 months owed -> Paid, 1–2 -> Pending, 3+ -> Overdue.
function statusFor(year, paidMonths, now = new Date()) {
    const owed = expectedMonths(year, now).filter(m => !paidMonths.includes(m)).length;
    if (owed === 0) return 'Paid';
    return owed >= 3 ? 'Overdue' : 'Pending';
}

module.exports = {
    MONTHS,
    FIRST_DUES_YEAR,
    currentYear,
    duesYears,
    isDuesYear,
    parseYear,
    parseMonths,
    expectedMonths,
    statusFor,
};
