//@ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();import { sendEmail } from '../../utils/emailService';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { reminderText } = req.body;

    try {
      // Fetch suppliers and banks
      const suppliersResult = await pool.query('SELECT * FROM acc_portal_suppliers WHERE status = true');
      const banksResult = await pool.query('SELECT * FROM acc_portal_banks WHERE status = true');

      const suppliers = suppliersResult.rows;
      const banks = banksResult.rows;

      // Send emails to suppliers
      for (const supplier of suppliers) {
        if (supplier.contact_email) {
          const personalizedText = reminderText.replace('{name}', supplier.name);
          await sendEmail(
            supplier.contact_email,
            'Monthly Document Upload Reminder',
            personalizedText,
            'Your Organization',
            process.env.EMAIL_FROM_ADDRESS!
          );
        }
      }

      // Send emails to banks
      for (const bank of banks) {
        if (bank.relationship_manager_email) {
          const personalizedText = reminderText.replace('{name}', bank.name);
          await sendEmail(
            bank.relationship_manager_email,
            'Monthly Document Upload Reminder',
            personalizedText,
            'Your Organization',
            process.env.EMAIL_FROM_ADDRESS!
          );
        }
      }

      res.status(200).json({ message: 'Reminders sent successfully' });
    } catch (error) {
      console.error('Error sending reminders:', error);
      res.status(500).json({ message: 'Error sending reminders', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}