//@ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '../../utils/emailService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { to, subject, html } = req.body;

    try {
      const result = await sendEmail(to, subject, html);
      res.status(200).json({ message: 'Email sent successfully', result });
    } catch (error) {
      res.status(500).json({ message: 'Error sending email', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}