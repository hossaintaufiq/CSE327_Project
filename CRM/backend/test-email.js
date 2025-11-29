import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('🔧 Testing Gmail SMTP configuration...');
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD?.length || 0);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    debug: true,
    logger: true
  });

  try {
    console.log('🔍 Verifying connection...');
    await transporter.verify();
    console.log('✅ Email service is ready to send emails');

    // Send a test email
    console.log('📧 Sending test email...');
    const result = await transporter.sendMail({
      from: `"CRM System" <${process.env.GMAIL_USER}>`,
      to: 'nazmul.sakib01@northsouth.edu',
      subject: 'CRM Email Test - ' + new Date().toLocaleString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">CRM Email Test</h1>
          <p>This is a test email from your CRM system.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Server:</strong> ${process.env.GMAIL_USER}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you received this email, your Gmail SMTP configuration is working correctly!</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response);

    if (error.code === 'EAUTH') {
      console.log('\n💡 Gmail Authentication Troubleshooting:');
      console.log('1. Make sure you have 2-Factor Authentication ENABLED on your Gmail account');
      console.log('2. Generate an App Password from: https://myaccount.google.com/apppasswords');
      console.log('3. Use the App Password (not your regular password) in GMAIL_APP_PASSWORD');
      console.log('4. The App Password should be 16 characters with no spaces');
      console.log('5. Make sure the Gmail account is not blocked or suspended');
    }
  }
}

testEmail();