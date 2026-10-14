import { Timestamp } from 'firebase/firestore';

/**
 * Checks if a date is within the last 30 days.
 * @param {Date|Timestamp|string} dateInput - The date to check.
 * @returns {boolean} True if within 30 days, false otherwise.
 */
export const isWithinLast30Days = (dateInput) => {
    if (!dateInput) return false;

    let date;

    // Handle Firestore Timestamp
    if (dateInput instanceof Timestamp) {
        date = dateInput.toDate();
    }
    // Handle string or other formats
    else {
        date = new Date(dateInput);
    }

    // Check for invalid date
    if (isNaN(date.getTime())) return false;

    const nav = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(nav.getDate() - 30);

    return date >= thirtyDaysAgo;
};

/**
 * Checks if a date is within the last 90 days (3 months).
 * @param {Date|Timestamp|string} dateInput - The date to check.
 * @returns {boolean} True if within 90 days, false otherwise.
 */
export const isWithinLast90Days = (dateInput) => {
    if (!dateInput) return false;

    let date;

    // Handle Firestore Timestamp
    if (dateInput instanceof Timestamp) {
        date = dateInput.toDate();
    }
    // Handle string or other formats
    else {
        date = new Date(dateInput);
    }

    // Check for invalid date
    if (isNaN(date.getTime())) return false;

    const nav = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(nav.getDate() - 90);

    return date >= ninetyDaysAgo;
};
