// test-email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_ADDRESS,
      to: process.env.EMAIL_ADDRESS,
      subject: 'Test Email',
      text: 'If you receive this, your email configuration is working!',
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail();