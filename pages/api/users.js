import { clerkClient } from '@clerk/clerk-sdk-node';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('Attempting to fetch users from Clerk');
      const response = await clerkClient.users.getUserList({
        limit: 100,
      });

      // Assuming users are inside a `data` field, adjust the structure accordingly
      const users = response.data || [];

      if (Array.isArray(users) && users.length > 0) {
        const mappedUsers = users.map(user => ({
          id: user.id,
          username: user.username || 'No username',
        }));

        console.log(`Successfully fetched ${users.length} users from Clerk`);
        res.status(200).json(mappedUsers);
      } else {
        console.error('Unexpected format:', response);
        res.status(500).json({ error: 'Unexpected data format from Clerk', details: JSON.stringify(response) });
      }
    } catch (error) {
      console.error('Detailed error fetching users:', error);
      res.status(500).json({ error: 'Error fetching users', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
// okay
