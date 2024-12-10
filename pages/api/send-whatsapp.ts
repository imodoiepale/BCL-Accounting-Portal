import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phone, documents, companyName } = req.body;

    // Get signed URLs for documents
    const urls = await Promise.all(
      documents.map(async (doc: { filepath: string }) => {
        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrl(doc.filepath, 60 * 60); // 1 hour expiry
        
        if (error) throw error;
        return data.signedUrl;
      })
    );

    // Send WhatsApp message with document links
    const message = await client.messages.create({
      body: `Documents from ${companyName}:\n\n${urls.join('\n')}`,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${phone}`,
    });

    res.status(200).json({ message: 'WhatsApp message sent successfully' });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ message: 'Failed to send WhatsApp message' });
  }
}