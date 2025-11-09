const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send booking confirmation email to customer
 * @param {Object} booking - Booking details
 */
const sendBookingConfirmation = async (booking) => {
  try {
    const transporter = createTransporter();
    
    const servicesHtml = booking.services.map(service => 
      `<li>${service.serviceName} (${service.category})</li>`
    ).join('');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: booking.email,
      subject: `Booking Confirmation - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">AX TEAM Home Services - Booking Confirmed</h2>
          
          <p>Dear ${booking.name},</p>
          
          <p>Thank you for choosing AX TEAM Home Services! Your booking has been confirmed.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            <p><strong>Status:</strong> ${booking.status}</p>
            
            <h4>Services Requested:</h4>
            <ul>${servicesHtml}</ul>
            
            <h4>Service Address:</h4>
            <p>${booking.address.street}<br>
            ${booking.address.city}, ${booking.address.state} - ${booking.address.pincode}</p>
            
            ${booking.workDescription ? `<p><strong>Work Description:</strong> ${booking.workDescription}</p>` : ''}
          </div>
          
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>Our team will contact you shortly to confirm the appointment</li>
            <li>A skilled technician will arrive at your location on the scheduled date and time</li>
            <li>Payment can be made after service completion</li>
          </ul>
          
          <p>For any queries, please contact us:</p>
          <p>📞 Phone: +91-9876543210<br>
          📧 Email: support@axteam.com</p>
          
          <p>Thank you for trusting AX TEAM Home Services!</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated email. Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation email sent to ${booking.email}`);
    
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    throw error;
  }
};

/**
 * Send booking status update email to customer
 * @param {Object} booking - Booking details
 * @param {string} oldStatus - Previous status
 */
const sendBookingStatusUpdate = async (booking, oldStatus) => {
  try {
    const transporter = createTransporter();
    
    let statusMessage = '';
    let statusColor = '#2563eb';
    
    switch (booking.status) {
      case 'Confirmed':
        statusMessage = 'Your booking has been confirmed! Our team will arrive as scheduled.';
        statusColor = '#16a34a';
        break;
      case 'InProgress':
        statusMessage = 'Our technician has started working on your service request.';
        statusColor = '#ea580c';
        break;
      case 'Completed':
        statusMessage = 'Your service has been completed successfully! Thank you for choosing AX TEAM.';
        statusColor = '#16a34a';
        break;
      case 'Cancelled':
        statusMessage = 'Your booking has been cancelled. If you have any questions, please contact us.';
        statusColor = '#dc2626';
        break;
      default:
        statusMessage = `Your booking status has been updated to ${booking.status}.`;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: booking.email,
      subject: `Booking Update - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">AX TEAM Home Services - Booking Update</h2>
          
          <p>Dear ${booking.name},</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Previous Status:</strong> ${oldStatus}</p>
            <p><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${booking.status}</span></p>
          </div>
          
          <p>${statusMessage}</p>
          
          ${booking.technicianNotes ? `<p><strong>Technician Notes:</strong> ${booking.technicianNotes}</p>` : ''}
          ${booking.adminNotes ? `<p><strong>Additional Notes:</strong> ${booking.adminNotes}</p>` : ''}
          
          <p>For any queries, please contact us:</p>
          <p>📞 Phone: +91-9876543210<br>
          📧 Email: support@axteam.com</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated email. Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Status update email sent to ${booking.email}`);
    
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    throw error;
  }
};

/**
 * Send new booking alert to admin
 * @param {Object} booking - Booking details
 */
const sendAdminBookingAlert = async (booking) => {
  try {
    const transporter = createTransporter();
    
    const servicesHtml = booking.services.map(service => 
      `<li>${service.serviceName} (${service.category})</li>`
    ).join('');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `New Booking Alert - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 New Booking Alert</h2>
          
          <p>A new booking has been received on AX TEAM Home Services.</p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Customer:</strong> ${booking.name}</p>
            <p><strong>Phone:</strong> ${booking.phone}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            
            <h4>Services Requested:</h4>
            <ul>${servicesHtml}</ul>
            
            <h4>Service Address:</h4>
            <p>${booking.address.street}<br>
            ${booking.address.city}, ${booking.address.state} - ${booking.address.pincode}</p>
            
            ${booking.workDescription ? `<p><strong>Work Description:</strong> ${booking.workDescription}</p>` : ''}
          </div>
          
          <p><strong>Action Required:</strong></p>
          <ul>
            <li>Review and confirm the booking</li>
            <li>Assign a technician</li>
            <li>Contact the customer if needed</li>
          </ul>
          
          <p>Please log in to the admin dashboard to manage this booking.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin alert email sent for booking ${booking.bookingId}`);
    
  } catch (error) {
    console.error('❌ Error sending admin alert email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendAdminBookingAlert
};