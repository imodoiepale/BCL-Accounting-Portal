// Install required packages:
// npm install @clerk/clerk-sdk-node dotenv

// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YWJsZS1jcmlja2V0LTY2LmNsZXJrLmFjY291bnRzLmRldiQ"
// CLERK_SECRET_KEY="sk_test_3MYT1uGEVjfYw3E7T8aXwzXmHjfDY9gt1YjqAJsUXf"

require('dotenv').config();
const { clerkClient } = require('@clerk/clerk-sdk-node');
const fs = require('fs');

// // Initialize Clerk with your secret key
// const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// Array of client credentials
const clientCredentials = [
    { username: 'BclTest123', password: 'BclTest123' },
];

// Function to create a single user
async function createUser(username, password) {
    try {
      const user = await clerkClient.users.createUser({
        username,
        password,
      });
      console.log(`Created user: ${username}`);
      return { username, password, id: user.id };
    } catch (error) {
      console.error(`Error creating user ${username}:`, error);
      return null;
    }
  }
  
  // Main function to create users in bulk
  async function createBulkUsers(clientCredentials) {
    const users = [];
    for (const { username, password } of clientCredentials) {
      const user = await createUser(username, password);
      if (user) users.push(user);
    }
    return users;
  }
  
  // Execute the bulk user creation
  createBulkUsers(clientCredentials)
    .then((users) => {
      console.log('All users created successfully');
      console.log(users);
      // Save users to a file
      fs.writeFileSync('created_users.json', JSON.stringify(users, null, 2));
      console.log('User credentials saved to created_users.json');
    })
    .catch((error) => {
      console.error('Error in bulk user creation:', error);
    });