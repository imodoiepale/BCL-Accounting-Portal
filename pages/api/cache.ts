// pages/api/cache.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { cacheUtils } from '@/lib/redis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body, query } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.key === 'all_tabs_data') {
          const data = await cacheUtils.getAllData();
          return res.status(200).json(data);
        }
        const data = await cacheUtils.get(query.key as string);
        return res.status(200).json(data);

      case 'POST':
        await cacheUtils.set(body.key, body.data, body.expiry);
        return res.status(200).json({ success: true });

      case 'DELETE':
        await cacheUtils.invalidate(query.pattern as string);
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Cache API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}