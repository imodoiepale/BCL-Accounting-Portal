import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { from, to, subject, html } = req.body;
    
    if (!from || !to || !subject || !html) {
      return res.status(422).json({ error: 'Missing required fields' });
    }

    try {
      const response = await axios.post('https://api.resend.com/emails', 
        { from, to, subject, html },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Resend API response:', response.data);
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error sending email:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: error.response?.data?.message || error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}