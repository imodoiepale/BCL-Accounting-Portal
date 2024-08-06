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
    // { username: 'Akash', password: 'Akashbcl1*' },
    // { username: 'Ambe', password: 'Ambebcl1*' },
    // { username: 'Anamaya', password: 'Anamayabcl1*' },
    // { username: 'ATPE', password: 'ATPEbcl1*' },
    // { username: 'Bearings', password: 'Bearingsbcl1*' },
    // { username: 'Booksmart', password: 'Booksmartbcl1*' },
    // { username: 'CDShah', password: 'CDShahbcl1*' },
    // { username: 'Copper', password: 'Copperbcl1*' },
    // { username: 'Digital', password: 'Digitalbcl1*' },
    // { username: 'Fashion', password: 'Fashionbcl1*' },
    // { username: 'Filament', password: 'Filamentbcl1*' },
    // { username: 'Five', password: 'Fivebcl1*' },
    // { username: 'Gala', password: 'Galabcl1*' },
    // { username: 'Honeycomb', password: 'Honeycombbcl1*' },
    // { username: 'Indosella', password: 'Indosellabcl1*' },
    // { username: 'Infobit', password: 'Infobitbcl1*' },
    // { username: 'Jalaram', password: 'Jalarambcl1*' },
    // { username: 'JIKL', password: 'JIKLbcl1*' },
    // { username: 'Kifaru', password: 'Kifarubcl1*' },
    // { username: 'Koruwe', password: 'Koruwebcl1*' },
    // { username: 'Kushal', password: 'Kushalbcl1*' },
    // { username: 'LTML', password: 'LTMLbcl1*' },
    // { username: 'Leopard', password: 'Leopardbcl1*' },
    // { username: 'Liveal', password: 'Livealbcl1*' },
    // { username: 'Mahabalvira', password: 'Mahabalvirabcl1*' },
    // { username: 'Masani', password: 'Masanibcl1*' },
    // { username: 'Nazish', password: 'Nazishbcl1*' },
    // { username: 'Nelato', password: 'Nelatobcl1*' },
    // { username: 'Nirdrilling', password: 'Nirdrillingbcl1*' },
    // { username: 'OmSingh', password: 'OmSinghbcl1*' },
    // { username: 'Optech', password: 'Optechbcl1*' },
    // { username: 'Patthar', password: 'Pattharbcl1*' },
    // { username: 'Rutu', password: 'Rutubcl1*' },
    // { username: 'Sbnp', password: 'Sbnpbcl1*' },
    // { username: 'Shanavi', password: 'Shanavibcl1*' },
    // { username: 'Shreeji', password: 'Shreejibcl1*' },
    // { username: 'Shreenathji', password: 'Shreenathjibcl1*' },
    // { username: 'Shukrupa', password: 'Shukrupabcl1*' },
    // { username: 'Simstel', password: 'Simstelbcl1*' },
    // { username: 'Simuh', password: 'Simuhbcl1*' },
    // { username: 'TFBL', password: 'TFBLbcl1*' },
    // { username: 'UAEL', password: 'UAELbcl1*' },
    // { username: 'UMLTD', password: 'UMLTDbcl1*' },
    // { username: 'Victoria', password: 'Victoriabcl1*' },
    // { username: 'VBDL', password: 'VBDLbcl1*' },
    // { username: 'VBCL', password: 'VBCLbcl1*' },
    // { username: 'VUPL', password: 'VUPLbcl1*' },
    // { username: 'WLDL', password: 'WLDLbcl1*' },
    // { username: 'Xerox', password: 'Xeroxbcl1*' },
    // { username: 'Xtra', password: 'Xtrabcl1*' },
    // { username: 'LaTerro', password: 'LaTerrobcl1*' },
    // { username: 'Lakhani', password: 'Lakhanibcl1*' },
    // { username: 'Nakuru', password: 'Nakurubcl1*' },
    // { username: 'Navratna', password: 'Navratnabcl1*' },
    // { username: 'Randal', password: 'Randalbcl1*' },
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