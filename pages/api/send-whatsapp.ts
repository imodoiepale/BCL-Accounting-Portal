// pages/api/send-whatsapp.ts
import { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { supabase } from '@/lib/supabaseClient';

// Types for request body and document structure
interface WhatsAppRequestBody {
  phone: string;
  documents: {
    filepath: string;
    filename?: string;
  }[];
  companyName: string;
}

interface DocumentWithUrl {
  name: string;
  url: string;
}

interface APIResponse {
  message: string;
  initialMessageId?: string;
  documentMessageIds?: string[];
  error?: string;
}

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Adjust based on your needs
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  // Validate request method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      error: 'Only POST requests are allowed'
    });
  }

  try {
    // Validate environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || 
        !process.env.TWILIO_AUTH_TOKEN || 
        !process.env.TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Missing required environment variables');
    }

    const { phone, documents, companyName } = req.body as WhatsAppRequestBody;

    // Validate request body
    if (!phone || !documents || !companyName) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        error: 'Phone, documents, and companyName are required'
      });
    }

    // Validate documents array
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        message: 'Invalid documents array',
        error: 'Documents must be a non-empty array'
      });
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    try {
      // Get signed URLs for documents
      const documentUrls = await Promise.all(
        documents.map(async (doc) => {
          if (!doc.filepath) {
            throw new Error('Invalid document: missing filepath');
          }

          const { data, error } = await supabase.storage
            .from('kyc-documents')
            .createSignedUrl(doc.filepath, 60 * 60); // 1 hour expiry

          if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Failed to generate signed URL for ${doc.filepath}`);
          }

          if (!data?.signedUrl) {
            throw new Error(`No signed URL generated for ${doc.filepath}`);
          }

          return {
            name: doc.filename || doc.filepath.split('/').pop() || 'document',
            url: data.signedUrl
          };
        })
      );

      // Send initial message with document list
      const messageTemplate = createMessageTemplate(companyName, documentUrls);
      
      const initialMessage = await client.messages.create({
        body: messageTemplate,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedPhone}`,
      });

      // Send documents in separate messages
      const documentPromises = documentUrls.map(async (doc) => {
        try {
          return await client.messages.create({
            body: doc.name,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${formattedPhone}`,
            mediaUrl: [doc.url]
          });
        } catch (error) {
          console.error(`Error sending document ${doc.name}:`, error);
          throw new Error(`Failed to send document ${doc.name}`);
        }
      });

      // Wait for all document messages to be sent
      const documentMessages = await Promise.all(documentPromises);

      // Log success for monitoring
      console.log('WhatsApp messages sent successfully', {
        phone: formattedPhone,
        company: companyName,
        documentCount: documents.length,
        initialMessageId: initialMessage.sid,
        documentMessageIds: documentMessages.map(m => m.sid)
      });

      // Return success response
      return res.status(200).json({
        message: 'WhatsApp messages sent successfully',
        initialMessageId: initialMessage.sid,
        documentMessageIds: documentMessages.map(m => m.sid)
      });

    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to process documents');
    }

  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return res.status(500).json({
      message: 'Error sending WhatsApp message',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Kenyan phone numbers
  if (cleaned.startsWith('0')) {
    // Convert leading 0 to Kenyan code
    cleaned = '254' + cleaned.slice(1);
  } else if (!cleaned.startsWith('254')) {
    // Add Kenyan code if not present
    cleaned = '254' + cleaned;
  }
  
  // Add + prefix if not present
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
}

function createMessageTemplate(
  companyName: string, 
  documents: DocumentWithUrl[]
): string {
  const documentsList = documents
    .map((doc, index) => `${index + 1}. ${doc.name}`)
    .join('\n');

  return `
*Document Sharing from ${companyName}*

You have received ${documents.length} document${documents.length !== 1 ? 's' : ''}.

*Documents:*
${documentsList}

The documents will be sent in separate messages following this one.

_Note: Document links will expire in 1 hour for security purposes._

Best regards,
${companyName} Team
`.trim();
}

// Environment variables type declaration
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_WHATSAPP_NUMBER: string;
    }
  }
}