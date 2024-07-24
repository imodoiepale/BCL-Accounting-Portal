// Install required packages:
// npm install @clerk/clerk-sdk-node dotenv

require('dotenv').config();
const { clerkClient } = require('@clerk/clerk-sdk-node');
const fs = require('fs');

// Short list of client credentials for demonstration
const clientCredentials = [
    { username: 'Agrolt', password: 'Agroltbcl1*' },
    { username: 'Akash', password: 'Akashbcl1*' },
    { username: 'Ambe', password: 'Ambebcl1*' },
    { username: 'Anamaya', password: 'Anamayabcl1*' },
    { username: 'ATPE', password: 'ATPEbcl1*' },
    { username: 'Bearings', password: 'Bearingsbcl1*' },
    { username: 'Booksmart', password: 'Booksmartbcl1*' },
    { username: 'CDShah', password: 'CDShahbcl1*' },
    { username: 'Copper', password: 'Copperbcl1*' },
    { username: 'Digital', password: 'Digitalbcl1*' },
    { username: 'Fashion', password: 'Fashionbcl1*' },
    { username: 'Filament', password: 'Filamentbcl1*' },
    { username: 'Five', password: 'Fivebcl1*' },
    { username: 'Gala', password: 'Galabcl1*' },
    { username: 'Honeycomb', password: 'Honeycombbcl1*' },
    { username: 'Indosella', password: 'Indosellabcl1*' },
    { username: 'Infobit', password: 'Infobitbcl1*' },
    { username: 'Jalaram', password: 'Jalarambcl1*' },
    { username: 'JIKL', password: 'JIKLbcl1*' },
    { username: 'Kifaru', password: 'Kifarubcl1*' },
    { username: 'Koruwe', password: 'Koruwebcl1*' },
    { username: 'Kushal', password: 'Kushalbcl1*' },
    { username: 'LTML', password: 'LTMLbcl1*' },
    { username: 'Leopard', password: 'Leopardbcl1*' },
    { username: 'Liveal', password: 'Livealbcl1*' },
    { username: 'Mahabalvira', password: 'Mahabalvirabcl1*' },
    { username: 'Masani', password: 'Masanibcl1*' },
    { username: 'Nazish', password: 'Nazishbcl1*' },
    { username: 'Nelato', password: 'Nelatobcl1*' },
    { username: 'Nirdrilling', password: 'Nirdrillingbcl1*' },
    { username: 'OmSingh', password: 'OmSinghbcl1*' },
    { username: 'Optech', password: 'Optechbcl1*' },
    { username: 'Patthar', password: 'Pattharbcl1*' },
    { username: 'Rutu', password: 'Rutubcl1*' },
    { username: 'Sbnp', password: 'Sbnpbcl1*' },
    { username: 'Shanavi', password: 'Shanavibcl1*' },
    { username: 'Shreeji', password: 'Shreejibcl1*' },
    { username: 'Shreenathji', password: 'Shreenathjibcl1*' },
    { username: 'Shukrupa', password: 'Shukrupabcl1*' },
    { username: 'Simstel', password: 'Simstelbcl1*' },
    { username: 'Simuh', password: 'Simuhbcl1*' },
    { username: 'TFBL', password: 'TFBLbcl1*' },
    { username: 'UAEL', password: 'UAELbcl1*' },
    { username: 'UMLTD', password: 'UMLTDbcl1*' },
    { username: 'Victoria', password: 'Victoriabcl1*' },
    { username: 'VBDL', password: 'VBDLbcl1*' },
    { username: 'VBCL', password: 'VBCLbcl1*' },
    { username: 'VUPL', password: 'VUPLbcl1*' },
    { username: 'WLDL', password: 'WLDLbcl1*' },
    { username: 'Xerox', password: 'Xeroxbcl1*' },
    { username: 'Xtra', password: 'Xtrabcl1*' },
    { username: 'LaTerro', password: 'LaTerrobcl1*' },
    { username: 'Lakhani', password: 'Lakhanibcl1*' },
    { username: 'Nakuru', password: 'Nakurubcl1*' },
    { username: 'Navratna', password: 'Navratnabcl1*' },
    { username: 'Randal', password: 'Randalbcl1*' },
];

// Delay function to wait before retrying
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to create a single user with retry logic
async function createUser(username, password, retries = 3) {
    try {
        const user = await clerkClient.users.createUser({
            username,
            password,
        });
        console.log(`Created user: ${username}`);
        return { username, password, id: user.id };
    } catch (error) {
        if (error.status === 429 && retries > 0) {
            console.warn(`Rate limit exceeded. Retrying in 5 seconds... (${retries} retries left)`);
            await delay(5000); // Wait for 5 seconds before retrying
            return createUser(username, password, retries - 1);
        } else if (error.status === 422 && error.errors.some(e => e.code === 'form_identifier_exists')) {
            console.warn(`User ${username} already exists.`);
            return null;
        } else {
            console.error(`Error creating user ${username}:`, error);
            return null;
        }
    }
}

// Function to fetch all users
async function fetchAllUsers() {
    try {
        const response = await clerkClient.users.getUserList();
        if (Array.isArray(response)) {
            return response;
        } else if (response.data && Array.isArray(response.data)) {
            return response.data;
        } else {
            console.error('Unexpected response format:', response);
            return [];
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Main function to create users if they don't already exist
async function createUsersIfNotExist(clientCredentials) {
    const existingUsers = await fetchAllUsers();
    const existingUsernames = new Set(existingUsers.map(user => user.username));
    
    const usersToCreate = clientCredentials.filter(cred => !existingUsernames.has(cred.username));
    const createdUsers = [];
    
    for (const { username, password } of usersToCreate) {
        const user = await createUser(username, password);
        if (user) createdUsers.push(user);
    }
    
    return createdUsers;
}

// Execute the user creation if not exist
createUsersIfNotExist(clientCredentials)
    .then((createdUsers) => {
        console.log('Users created successfully:');
        console.log(createdUsers);
        // Save created users to a file
        fs.writeFileSync('created_users.json', JSON.stringify(createdUsers, null, 2));
        console.log('Created user credentials saved to created_users.json');
    })
    .catch((error) => {
        console.error('Error in user creation:', error);
    });