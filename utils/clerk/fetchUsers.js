// Install required packages:
// npm install @clerk/clerk-sdk-node dotenv

// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YWJsZS1jcmlja2V0LTY2LmNsZXJrLmFjY291bnRzLmRldiQ"
// CLERK_SECRET_KEY="sk_test_3MYT1uGEVjfYw3E7T8aXwzXmHjfDY9gt1YjqAJsUXf"

require('dotenv').config();
const { clerkClient } = require('@clerk/clerk-sdk-node');
const fs = require('fs');

async function fetchUsers() {
  try {
    const response = await clerkClient.users.getUserList({
      limit: 100,
    });

    const users = Array.isArray(response) ? response : (response.data || []);
    const mappedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      // Add any other user properties you need
    }));

    return mappedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Execute the user fetching
(async () => {
  const allUsers = await fetchUsers();
  console.log(`Fetched ${allUsers.length} users`);
  fs.writeFileSync('fetched_users.json', JSON.stringify(allUsers, null, 2));
  console.log('User data updated in fetched_users.json');
  console.log(`Total users fetched: ${allUsers.length}`);
})();
