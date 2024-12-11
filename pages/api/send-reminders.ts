

// // @ts-check
// // @ts-ignore
// import { NextApiRequest, NextApiResponse } from 'next';
// import { supabase } from '@/lib/supabaseClient';

// import { emailService } from '../../utils/emailService';

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     const { to, documents, companyName, message } = req.body;

//     // Get document files from Supabase
//     const documentFiles = await Promise.all(
//       documents.map(async (doc: { filepath: string }) => {
//         const { data, error } = await supabase.storage
//           .from('kyc-documents')
//           .download(doc.filepath);
        
//         if (error) throw error;
//         return {
//           filename: doc.filepath.split('/').pop() || 'document',
//           content: data,
//         };
//       })
//     );

//     // Send email with documents
//     await emailService.sendDocumentSharing({
//       to,
//       companyName,
//       documents: documentFiles,
//       customMessage: message,
//     });

//     res.status(200).json({ message: 'Email sent successfully' });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ message: 'Failed to send email' });
//   }
// }