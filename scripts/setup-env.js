const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('base64');
}

async function setupEnv() {
  console.log('\n🔐 BCL Accounting Portal Environment Setup\n');

  // Check if .env already exists
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('⚠️  Warning: .env file already exists');
    const answer = await new Promise(resolve => {
      rl.question('Do you want to overwrite it? (y/N): ', resolve);
    });
    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled');
      process.exit(0);
    }
  }

  // Generate encryption key
  const encryptionKey = await generateEncryptionKey();
  
  // Get user input for other environment variables
  const gmailClientId = await new Promise(resolve => {
    rl.question('Enter your Gmail Client ID: ', resolve);
  });

  const gmailClientSecret = await new Promise(resolve => {
    rl.question('Enter your Gmail Client Secret: ', resolve);
  });

  const supabaseUrl = await new Promise(resolve => {
    rl.question('Enter your Supabase Project URL: ', resolve);
  });

  const supabaseAnonKey = await new Promise(resolve => {
    rl.question('Enter your Supabase Anon Key: ', resolve);
  });

  // Create .env file
  const envContent = `# Gmail API Configuration
NEXT_PUBLIC_GMAIL_CLIENT_ID=${gmailClientId}
NEXT_PUBLIC_GMAIL_CLIENT_SECRET=${gmailClientSecret}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Email Encryption Key (32 bytes, base64 encoded)
EMAIL_ENCRYPTION_KEY=${encryptionKey}
`;

  // Write to .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment variables have been set up successfully!');
  console.log('\n⚠️  Important: Make sure to:');
  console.log('1. Never commit the .env file to version control');
  console.log('2. Keep your encryption key safe - if lost, you won\'t be able to decrypt stored passwords');
  console.log('3. Use different encryption keys for development and production environments');

  rl.close();
}

setupEnv().catch(console.error);
