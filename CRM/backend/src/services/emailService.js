import nodemailer from 'nodemailer';

// Create transporter for Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Email templates
const emailTemplates = {
  statusUpdate: (data) => ({
    subject: `CRM Status Update: ${data.entityType} - ${data.entityTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Status Update Notification</h2>
        <p>Dear ${data.recipientName},</p>
        <p>The status of your <strong>${data.entityType}</strong> has been updated:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Title:</strong> ${data.entityTitle}</p>
          <p><strong>Previous Status:</strong> ${data.oldStatus || 'N/A'}</p>
          <p><strong>New Status:</strong> ${data.newStatus}</p>
          <p><strong>Updated At:</strong> ${new Date().toLocaleString()}</p>
          ${data.jiraIssueKey ? `<p><strong>Jira Issue:</strong> ${data.jiraIssueKey}</p>` : ''}
        </div>
        <p>Please log in to your CRM dashboard to view more details.</p>
        <p>Best regards,<br>CRM System</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated notification from your CRM system.
        </p>
      </div>
    `,
  }),

  issueAlert: (data) => ({
    subject: `CRM Issue Alert: ${data.issueTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #d32f2f; text-align: center;">Issue Alert</h2>
        <p>Dear ${data.recipientName},</p>
        <p>A new issue has been reported that requires your attention:</p>
        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f57c00;">
          <p><strong>Issue:</strong> ${data.issueTitle}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Reported By:</strong> ${data.reportedBy}</p>
          <p><strong>Description:</strong> ${data.description}</p>
        </div>
        <p>Please address this issue as soon as possible.</p>
        <p>Best regards,<br>CRM Support Team</p>
      </div>
    `,
  }),
};

// Send email
export const sendEmail = async (to, templateType, templateData) => {
  try {
    const transporter = createTransporter();
    const template = emailTemplates[templateType](templateData);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    throw error;
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return false;
  }
};

// Send status update email
export const sendStatusUpdateEmail = async (recipientEmail, recipientName, entityType, entityTitle, oldStatus, newStatus, jiraIssueKey = null) => {
  return await sendEmail(recipientEmail, 'statusUpdate', {
    recipientName,
    entityType,
    entityTitle,
    oldStatus,
    newStatus,
    jiraIssueKey,
  });
};

// Send issue alert email
export const sendIssueAlertEmail = async (recipientEmail, recipientName, issueTitle, priority, status, reportedBy, description) => {
  return await sendEmail(recipientEmail, 'issueAlert', {
    recipientName,
    issueTitle,
    priority,
    status,
    reportedBy,
    description,
  });
};