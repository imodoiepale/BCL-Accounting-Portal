
// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabaseClient';

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to, subject, html, documents, companyName } = req.body;

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
    });

    // Get document files from Supabase and prepare attachments
    const attachments = await Promise.all(
      documents.map(async (doc: { filepath: string }) => {
        try {
          const { data, error } = await supabase.storage
            .from('kyc-documents')
            .download(doc.filepath);

          if (error) {
            console.error('Supabase download error:', error);
            throw error;
          }

          // Convert Blob to Buffer
          const buffer = await blobToBuffer(data);
          const filename = doc.filepath.split('/').pop() || 'document';
          
          return {
            filename,
            content: buffer,
            contentType: getContentType(filename)
          };
        } catch (error) {
          console.error(`Error processing document ${doc.filepath}:`, error);
          throw error;
        }
      })
    );

    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
      attachments
    });

    console.log('Message sent:', info.messageId);
    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      message: 'Error sending email', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Helper function to determine content type
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}