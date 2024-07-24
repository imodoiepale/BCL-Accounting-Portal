// Install required packages:
// npm install @clerk/clerk-sdk-node dotenv

require('dotenv').config();
const { clerkClient } = require('@clerk/clerk-sdk-node');
const fs = require('fs');

// Function to fetch all users
async function fetchAllUsers() {
  try {
    const response = await clerkClient.users.getUserList();
    const users = response.data;  // Access the data property
    if (Array.isArray(users)) {
      return users;
    } else {
      console.error('Expected an array of users but got:', users);
      return [];
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Function to delete a user by ID
async function deleteUser(userId) {
  try {
    await clerkClient.users.deleteUser(userId);
    console.log(`Deleted user: ${userId}`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
  }
}

// Main function to delete all users
async function deleteAllUsers() {
  const users = await fetchAllUsers();
  if (users.length > 0) {
    for (const user of users) {
      await deleteUser(user.id);
    }
  } else {
    console.log('No users to delete.');
  }
}

// Execute delete
async function main() {
  // Delete users
  await deleteAllUsers();
  console.log('All users deleted successfully');
}

main().catch((error) => {
  console.error('Error in main execution:', error);
});
