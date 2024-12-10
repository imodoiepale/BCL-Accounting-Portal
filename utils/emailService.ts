
// @ts-check
// @ts-ignore
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabaseClient';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  fromName: string,
  fromEmail: string,
  attachments?: { filepath: string }[]
) {
  // If there are attachments, get them from Supabase
  let emailAttachments: { filename: string | undefined; content: Blob; }[] = [];
  if (attachments?.length) {
    emailAttachments = await Promise.all(
      attachments.map(async (att) => {
        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .download(att.filepath);
        
        if (error) throw error;

        return {
          filename: att.filepath.split('/').pop(),
          content: data,
        };
      })
    );
  }

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
      from: process.env.EMAIL_FROM_ADDRESS,
      to: to
    },
    attachments: emailAttachments
  });

  console.log("Message sent: %s", info.messageId);
  return info;
}