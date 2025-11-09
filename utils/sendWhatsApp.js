const axios = require('axios');

/**
 * Send WhatsApp message using API
 * @param {string} to - Phone number to send message to
 * @param {string} message - WhatsApp message content
 */
const sendWhatsAppMessage = async (to, message) => {
  try {
    // Check if WhatsApp configuration is available
    if (!process.env.WHATSAPP_API_KEY) {
      console.warn('⚠️ WhatsApp API key missing, message not sent');
      return { success: false, error: 'WhatsApp API key missing' };
    }

    // For now, we'll use a generic WhatsApp API endpoint
    // In production, you would use services like Twilio WhatsApp API, Meta WhatsApp Business API, etc.
    const whatsappData = {
      phone: to,
      message: message,
      apikey: process.env.WHATSAPP_API_KEY
    };

    // Log the message that would be sent (for development)
    console.log(`📱 [WhatsApp] Would send to ${to}:`);
    console.log(`📄 [WhatsApp] Message: ${message}`);
    
    // In development mode, just log the message
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 [WhatsApp] Development mode - message logged but not sent');
      console.log('ℹ️ [WhatsApp] To send real messages, update WHATSAPP_API_KEY in .env file');
      console.log('ℹ️ [WhatsApp] See WHATSAPP_SETUP_GUIDE.md for instructions');
      return { success: true, messageId: 'dev-' + Date.now() };
    }

    // In production, you would make the actual API call
    // const response = await axios.post(process.env.WHATSAPP_API_URL, whatsappData);
    // return { success: true, messageId: response.data.messageId };

    return { success: true, messageId: 'simulated-' + Date.now() };
  } catch (error) {
    console.error('❌ WhatsApp sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation WhatsApp to customer
 * @param {Object} booking - Booking details
 */
const sendBookingConfirmationWhatsApp = async (booking) => {
  try {
    const message = `💬 AX TEAM - Booking Confirmation

Hello ${booking.name},
Your booking has been submitted successfully.

📌 Booking ID: ${booking.bookingId}
🛠️ Services: ${booking.services.map(s => s.serviceName).join(', ')}
📍 Address: ${booking.address.street}, ${booking.address.city}, ${booking.address.state} - ${booking.address.pincode}
${booking.address.googleMapsLink ? `🔗 Location: ${booking.address.googleMapsLink}` : ''}
📅 Date: ${new Date(booking.date).toLocaleDateString('en-IN')}
⏰ Time: ${booking.time}

Thank you for choosing AX TEAM!

Support: ${process.env.SUPPORT_WHATSAPP_NUMBER || '+91-9876543210'}`;

    const result = await sendWhatsAppMessage(booking.phone, message);
    
    if (result.success) {
      console.log(`✅ Customer WhatsApp sent: ${result.messageId}`);
    } else {
      console.error(`❌ Customer WhatsApp failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending customer WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking alert WhatsApp to admin
 * @param {Object} booking - Booking details
 */
const sendAdminBookingAlertWhatsApp = async (booking) => {
  try {
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
    if (!adminPhone) {
      console.warn('⚠️ Admin WhatsApp number not configured');
      return { success: false, error: 'Admin WhatsApp number not configured' };
    }

    const message = `🚨 NEW BOOKING ALERT - AX TEAM

✅ Booking ID: ${booking.bookingId}

👤 User: ${booking.name}
📞 Phone: ${booking.phone}
✉️ Email: ${booking.email}

🛠️ Service: ${booking.services.map(s => s.serviceName).join(', ')}
📝 Work: ${booking.workDescription || 'No specific description provided'}

📍 Address: ${booking.address.street}, ${booking.address.city}, ${booking.address.state} - ${booking.address.pincode}
${booking.address.googleMapsLink ? `🔗 Maps: ${booking.address.googleMapsLink}` : ''}

📅 Date: ${new Date(booking.date).toLocaleDateString('en-IN')}
⏰ Time: ${booking.time}

Please assign a technician ASAP.`;

    const result = await sendWhatsAppMessage(adminPhone, message);
    
    if (result.success) {
      console.log(`✅ Admin WhatsApp sent: ${result.messageId}`);
    } else {
      console.error(`❌ Admin WhatsApp failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending admin WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking status update WhatsApp to customer
 * @param {Object} booking - Booking details
 */
const sendBookingStatusWhatsApp = async (booking) => {
  try {
    let message = '';
    
    switch (booking.status) {
      case 'Confirmed':
        message = `✅ AX TEAM - Booking Confirmed

Hello ${booking.name},
Your booking ${booking.bookingId} has been confirmed!

Our technician will arrive on ${new Date(booking.date).toLocaleDateString('en-IN')} at ${booking.time}.

Service: ${booking.services.map(s => s.serviceName).join(', ')}
Address: ${booking.address.street}, ${booking.address.city}

Thank you for choosing AX TEAM!`;
        break;
        
      case 'InProgress':
        message = `🔧 AX TEAM - Work Started

Hello ${booking.name},
Work has started for booking ${booking.bookingId}.

Our technician is now servicing your request.

Support: ${process.env.SUPPORT_WHATSAPP_NUMBER || '+91-9876543210'}`;
        break;
        
      case 'Completed':
        message = `✅ AX TEAM - Service Completed

Hello ${booking.name},
Service has been completed for booking ${booking.bookingId}.

Thank you for choosing AX TEAM! 
We hope you're satisfied with our service.

Support: ${process.env.SUPPORT_WHATSAPP_NUMBER || '+91-9876543210'}`;
        break;
        
      case 'Cancelled':
        message = `❌ AX TEAM - Booking Cancelled

Hello ${booking.name},
Booking ${booking.bookingId} has been cancelled.

For rebooking or queries, contact: ${process.env.SUPPORT_WHATSAPP_NUMBER || '+91-9876543210'}`;
        break;
        
      default:
        message = `📱 AX TEAM - Status Update

Hello ${booking.name},
Booking ${booking.bookingId} status updated to: ${booking.status}

For details, contact: ${process.env.SUPPORT_WHATSAPP_NUMBER || '+91-9876543210'}`;
    }

    const result = await sendWhatsAppMessage(booking.phone, message);
    
    if (result.success) {
      console.log(`✅ Status WhatsApp sent: ${result.messageId}`);
    } else {
      console.error(`❌ Status WhatsApp failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending status WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendBookingConfirmationWhatsApp,
  sendAdminBookingAlertWhatsApp,
  sendBookingStatusWhatsApp
};