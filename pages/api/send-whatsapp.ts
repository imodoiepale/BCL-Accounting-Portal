import { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { supabase } from '@/lib/supabaseClient';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phone, documents, companyName } = req.body;

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    // Get signed URLs for documents
    const documentUrls = await Promise.all(
      documents.map(async (doc: { filepath: string }) => {
        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrl(doc.filepath, 60 * 60); // 1 hour expiry
        
        if (error) throw error;
        
        const fileName = doc.filepath.split('/').pop() || 'document';
        return {
          name: fileName,
          url: data.signedUrl
        };
      })
    );

    // Create message template
    const messageTemplate = createMessageTemplate(companyName, documentUrls);

    // Send message using Twilio
    const message = await client.messages.create({
      body: messageTemplate,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`,
    });

    // Send document URLs
    for (const doc of documentUrls) {
      await client.messages.create({
        body: doc.name,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedPhone}`,
        mediaUrl: [doc.url]
      });
    }

    res.status(200).json({ 
      message: 'WhatsApp message sent successfully',
      messageId: message.sid 
    });

  } catch (error) {
    console.error('WhatsApp sending error:', error);
    res.status(500).json({ 
      message: 'Error sending WhatsApp message', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add + if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // If number doesn't have country code, add default (+1)
  if (cleaned.length <= 10) {
    cleaned = '+1' + cleaned;
  }
  
  return cleaned;
}

function createMessageTemplate(
  companyName: string,
  documents: { name: string; url: string }[]
): string {
  const template = `
*Document Sharing from ${companyName}*

You have received ${documents.length} document${documents.length !== 1 ? 's' : ''}.

*Documents:*
${documents.map((doc, index) => `${index + 1}. ${doc.name}`).join('\n')}

The documents will be sent in separate messages following this one.

_Note: Document links will expire in 1 hour for security purposes._

Best regards,
${companyName} Team
`.trim();

  return template;
}