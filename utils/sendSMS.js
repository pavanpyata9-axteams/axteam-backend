// Initialize Twilio client safely
let twilioClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH) {
  try {
    twilioClient = require("twilio")(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH
    );
  } catch (error) {
    console.warn("⚠️ Twilio initialization failed:", error.message);
  }
} else {
  console.warn("⚠️ Twilio keys missing, SMS disabled.");
}

/**
 * Send SMS using Twilio
 * @param {string} to - Phone number to send SMS to
 * @param {string} message - SMS message content
 */
const sendTwilioSMS = async (to, message) => {
  if (!twilioClient) return console.log("SMS disabled (no client)");
  
  try {
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to: to
    });
    
    console.log(`✅ SMS sent via Twilio: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('❌ Twilio SMS error:', error);
    throw error;
  }
};

/**
 * Send SMS using MSG91 (Alternative for India)
 * @param {string} to - Phone number to send SMS to
 * @param {string} message - SMS message content
 */
const sendMSG91SMS = async (to, message) => {
  try {
    const axios = require('axios');
    
    const data = {
      sender: process.env.MSG91_SENDER_ID || 'AXTEAM',
      route: '4',
      country: '91',
      sms: [{
        message: message,
        to: [to.replace('+91', '')]
      }]
    };
    
    const response = await axios.post('https://api.msg91.com/api/v2/sendsms', data, {
      headers: {
        'authkey': process.env.MSG91_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ SMS sent via MSG91:`, response.data);
    return response.data;
  } catch (error) {
    console.error('❌ MSG91 SMS error:', error);
    throw error;
  }
};

/**
 * Send SMS (automatically chooses available service)
 * @param {string} to - Phone number
 * @param {string} message - SMS content
 */
const sendSMS = async (to, message) => {
  try {
    // Try Twilio first, fallback to MSG91
    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH) {
      return await sendTwilioSMS(to, message);
    } else if (process.env.MSG91_API_KEY) {
      return await sendMSG91SMS(to, message);
    } else {
      throw new Error('No SMS service configured');
    }
  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    // Don't throw error to prevent booking failure due to SMS issues
    return null;
  }
};

/**
 * Send booking confirmation SMS to customer
 * @param {Object} booking - Booking details
 */
const sendBookingConfirmationSMS = async (booking) => {
  const message = `AX TEAM: Your booking ${booking.bookingId} is confirmed for ${new Date(booking.date).toLocaleDateString()} at ${booking.time}. Our team will contact you soon. Call +91-9876543210 for queries.`;
  
  return await sendSMS(booking.phone, message);
};

/**
 * Send booking status update SMS to customer
 * @param {Object} booking - Booking details
 */
const sendBookingStatusSMS = async (booking) => {
  let message = '';
  
  switch (booking.status) {
    case 'Confirmed':
      message = `AX TEAM: Booking ${booking.bookingId} confirmed! Our technician will arrive on ${new Date(booking.date).toLocaleDateString()} at ${booking.time}.`;
      break;
    case 'InProgress':
      message = `AX TEAM: Work started for booking ${booking.bookingId}. Our technician is now servicing your request.`;
      break;
    case 'Completed':
      message = `AX TEAM: Service completed for booking ${booking.bookingId}. Thank you for choosing us! Rate us: link.axteam.com/rate`;
      break;
    case 'Cancelled':
      message = `AX TEAM: Booking ${booking.bookingId} has been cancelled. For rebooking, call +91-9876543210.`;
      break;
    default:
      message = `AX TEAM: Booking ${booking.bookingId} status updated to ${booking.status}. Call +91-9876543210 for details.`;
  }
  
  return await sendSMS(booking.phone, message);
};

/**
 * Send new booking alert SMS to admin
 * @param {Object} booking - Booking details
 */
const sendAdminBookingAlertSMS = async (booking) => {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return;
  
  const message = `🚨 NEW BOOKING: ${booking.bookingId} | Customer: ${booking.name} | Phone: ${booking.phone} | Date: ${new Date(booking.date).toLocaleDateString()} | Services: ${booking.services.length} items`;
  
  return await sendSMS(adminPhone, message);
};

module.exports = {
  sendSMS,
  sendBookingConfirmationSMS,
  sendBookingStatusSMS,
  sendAdminBookingAlertSMS
};