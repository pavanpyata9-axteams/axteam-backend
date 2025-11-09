const { nanoid } = require('nanoid');

/**
 * Generate unique booking ID in format: AX-YYYYMMDD-XXXX
 * @returns {string} Unique booking ID
 */
const generateBookingId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const dateStr = `${year}${month}${day}`;
  const uniqueId = nanoid(4).toUpperCase();
  
  return `AX-${dateStr}-${uniqueId}`;
};

/**
 * Validate booking ID format
 * @param {string} bookingId 
 * @returns {boolean}
 */
const validateBookingId = (bookingId) => {
  const regex = /^AX-\d{8}-[A-Z0-9]{4}$/;
  return regex.test(bookingId);
};

module.exports = {
  generateBookingId,
  validateBookingId
};