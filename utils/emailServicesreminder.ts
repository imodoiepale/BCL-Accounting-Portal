//@ts-nocheck
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(to: string, subject: string, html: string, fromName: string, fromEmail: string) {
  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to,
    subject,
    html,
    headers: {
      'Sender': `${fromName} <${fromEmail}>`,
      'Reply-To': `${fromName} <${fromEmail}>`,
      'X-Sender': fromEmail,
      'X-Receiver': to
    },
    envelope: {
      from: process.env.EMAIL_FROM_ADDRESS, // This ensures deliverability
      to: to
    }
  });

  console.log("Message sent: %s", info.messageId);
  return info;
}